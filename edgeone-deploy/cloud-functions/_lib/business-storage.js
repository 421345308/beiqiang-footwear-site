import { ApiError, STORE_NAME, dependencies, handleError, reply, requireSession, safeEqual, sameOrigin, settings, storeFor } from './workbench.js';
import { OPS_STORE } from './operations.js';
import { createDatabase } from './database.js';

export const AUTH_PREFIXES = ['sessions/', 'revoked/', 'magic/', 'consumed/', 'rate/'];
export const isAuthKey = key => AUTH_PREFIXES.some(prefix => key.startsWith(prefix));

// Auth and source attachments retain their original stores. Business state has one selected writer.
export function businessStoreFactory(blobFactory, databaseFactory) {
  const stores = new Map();
  return args => {
    if (![STORE_NAME, OPS_STORE].includes(args.name)) return blobFactory(args);
    if (!stores.has(args.name)) {
      const pg = databaseFactory(args), blob = blobFactory(args);
      stores.set(args.name, { ...pg,
        get: (key, options) => isAuthKey(key) ? blob.get(key, options) : pg.get(key, options),
        setJSON: (key, value, options) => isAuthKey(key) ? blob.setJSON(key, value, options) : pg.setJSON(key, value, options),
        delete: key => isAuthKey(key) ? blob.delete(key) : pg.delete(key),
      });
    }
    return stores.get(args.name);
  };
}

export async function businessRequest(context, options, build, method, identity = 'owner') {
  const env = context.env || {}, backend = env.WORKBENCH_STORAGE || 'blob';
  if (env.WORKBENCH_MAINTENANCE === 'enabled') return reply(503, {code: 'BUSINESS_MAINTENANCE', error: '业务库正在维护，任务领取和编辑暂时停止；原记录保留。'});
  if (backend === 'blob') return build({ ...options, businessContext: true, backend: { kind: 'private_blob', verified: false, reason: '当前业务记录仍在原私有存储；关系数据库尚未切换。' } })[method](context);
  let database;
  try {
    if (backend !== 'postgres') throw new ApiError(503, '业务存储配置无效。');
    const deps = dependencies(options), config = settings(env);
    if (identity === 'owner') {
      if (method === 'onRequestPost') sameOrigin(context.request, config);
      await requireSession(context.request, config, storeFor(deps), deps.nowImpl(), method === 'onRequestPost');
    } else if (Buffer.byteLength(String(env.WORKBENCH_RUNNER_SECRET || '')) < 32 || !safeEqual(context.request.headers.get('authorization'), `Bearer ${env.WORKBENCH_RUNNER_SECRET}`)) throw new ApiError(401, '执行器身份无效。');
    database = (options.createDatabaseImpl || createDatabase)(env);
    await database.assertVerified(env.WORKBENCH_DATABASE_MIGRATION_ID);
    return await database.withTransaction(async tx => {
      const scoped = { ...options, businessContext: true, transactional: true,
        getStoreImpl: businessStoreFactory(deps.getStoreImpl, tx.storeFactory),
        backend: { kind: 'postgres', verified: true, reason: '业务记录由已核验的私有PostgreSQL保存；原询盘与附件仍沿原服务。' },
      };
      return build(scoped)[method](context);
    });
  } catch (error) { return handleError(error); }
  finally { await database?.close(); }
}

export function businessHandlers(options, build, identity = 'owner') {
  return Object.fromEntries(['onRequestGet', 'onRequestPost'].map(method => [method, context => businessRequest(context, options, build, method, identity)]));
}

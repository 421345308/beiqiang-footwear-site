import s from './execution-readiness.module.css';

export type BackendReadiness = { kind: 'private_blob' | 'postgres' | 'self_hosted'; verified: boolean; reason: string };
export type DispatchReadiness = { mode: 'manual_cloud' | 'self_hosted'; enabled: boolean; ready: boolean; blocking_reasons: string[]; last_seen_at: string | null };

export default function ExecutionReadiness({ backend, dispatch }: { backend?: BackendReadiness; dispatch?: DispatchReadiness }) {
  const automatic = dispatch?.mode === 'self_hosted' && dispatch.enabled && dispatch.ready;
  const manual = !dispatch || dispatch.mode === 'manual_cloud';
  return <section className={s.root} aria-labelledby="execution-readiness-title">
    <h2 id="execution-readiness-title">存储与执行就绪状态</h2>
    <div className={s.columns}>
      <div><h3>{backend?.kind === 'self_hosted' ? '统一私有后端（PostgreSQL）' : backend?.kind === 'postgres' ? 'PostgreSQL' : backend?.kind === 'private_blob' ? '现有私有存储' : '存储状态未读取'}</h3><p>{backend?.kind === 'private_blob' ? '原存储正在使用，关系数据库尚未切换。' : backend ? backend.verified ? '连接已核验' : '连接待核验' : '等待后台提供实际状态。'}</p>{backend?.reason && <p>{backend.reason}</p>}</div>
      <div><h3>{manual ? '人工启动 Cloud' : automatic ? '自动领取可用' : '自动领取未就绪'}</h3><p>{manual ? '提交只保存并排队；需要到官方 Cloud 启动指定运行。' : automatic ? '已开启自动领取；排队任务需等执行器实际领取后才算开始。' : '任务可以保存排队，尚未具备自动领取条件。'}</p><p>最近执行器回报：{dispatch?.last_seen_at ? new Date(dispatch.last_seen_at).toLocaleString('zh-CN', { hour12: false }) : '未读取'}</p></div>
    </div>
    {!!dispatch?.blocking_reasons.length && <div className={s.blocked}><strong>当前限制</strong><ul>{dispatch.blocking_reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul></div>}
  </section>;
}

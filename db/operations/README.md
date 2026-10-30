# 私有经营数据库

部署选型：通用PostgreSQL，优先现有机器开源自建；Supabase付费托管不再是采购前提。现有 EdgeOne 网站、负责人登录、客户询盘原件与附件继续使用原服务。本目录只迁共用经营状态，不创建另一套登录或客户副本。选型费用与执行器部署条件统一见经营仓库 `08_工具链/08_经营工作台/PRODUCT.md`。

## 已实现与验证范围

`001_private_backend.sql` 建私有 `beiqiang_private` schema、当前对象表、不可覆盖的依据历史、任务/运行/占用索引及迁移批次。业务请求使用同一个事务；版本冲突不会覆盖其他任务。后端通过服务端 PostgreSQL 连接访问，不能把此 schema 加入公开 Data API。

已用隔离 PostgreSQL 验证并发创建、条件更新、回滚、双领取、历史与当前记录一致、鉴权资料隔离、整条询盘处理、备份恢复及真实本机 Sol 结果采纳。尚未部署生产数据库，因此 EdgeOne 到所选数据库/业务服务的真实网络、权限与恢复流程仍须在目标环境验收。默认 `WORKBENCH_STORAGE=blob` 保持原线上来源，不因代码发布切库。

## 服务端配置

| 变量 | 用途 |
| --- | --- |
| `WORKBENCH_STORAGE` | `blob` 为现状；完成迁移后改 `postgres` |
| `WORKBENCH_DATABASE_URL` | 仅服务端保存的数据库连接；Supavisor 6543仅适用于选择Supabase时 |
| `WORKBENCH_DATABASE_CA` | 如部署证书需要，填写可信 CA PEM；不能关闭证书校验 |
| `WORKBENCH_DATABASE_MIGRATION_ID` | 已验证迁移批次标识 |
| `WORKBENCH_MAINTENANCE` | `enabled` 暂停经营读写和领取；负责人登录、原询盘服务保持原流程 |
| `WORKBENCH_RUNNER_MODE` | 原线上 `manual_cloud`；私有常驻执行器验收后改 `self_hosted` |
| `WORKBENCH_AUTODISPATCH` | 仅显式 `enabled` 才允许常驻执行器自动领取；仍需近期通过启动检查的心跳 |

连接池每个请求最多一个连接，远端严格验证 TLS；不使用命名 prepared statement。生产执行身份使用仅获 `beiqiang_backend` 权限的独立登录角色，初始化/迁移身份只在受控部署操作中使用。登录角色和密码在服务商私有设置创建，不写入 SQL、源码或聊天。Supabase 的匿名 key/service role key 不是本连接的数据库密码。

## 首次迁移

1. 准备所选自建/托管数据库，核真实资源、私有连接及 CA；先从 EdgeOne 验证连接路径，不能直接暴露未受保护的数据库端口。用管理员初始化 SQL，为运行角色授予 `beiqiang_backend`，核未授权用户无法读取私有表。
2. 完成一次服务商备份/恢复验证。停止新任务进入，排空已有运行，设置 `WORKBENCH_MAINTENANCE=enabled` 并核接口返回 `BUSINESS_MAINTENANCE`。不要直接删除正在运行的租约。
3. 受控终端通过环境注入数据库与原 Blob 部署身份 `BEIQIANG_DEPLOY_TOKEN`，执行以下命令。文件必须位于被 Git 忽略的私有目录，Linux 权限 0600；Windows 使用当前用户私有目录与相应 ACL。不得上传导出包。

```sh
node scripts/migrate-business-database.mjs init
node scripts/migrate-business-database.mjs export <batch-id> <private-file.json>
node scripts/migrate-business-database.mjs import <batch-id> <private-file.json>
node scripts/migrate-business-database.mjs verify <batch-id> <private-file.json>
node scripts/migrate-business-database.mjs activate <batch-id> <private-file.json>
```

导出只含两个经营命名空间，排除 sessions/revoked/magic/consumed/rate。保留控制要求、文档依据、任务、运行、事件、占用、审阅及询盘处理版本，按原 key、数量、hash 和当前表逐项核验；激活前重新读取冻结来源比对。原询盘、消息、附件和认证资料不迁移。本工具不自动修改生产环境、不删除旧来源。

4. 保持维护状态，设 `WORKBENCH_STORAGE=postgres` 及正确迁移 ID。核只读与指定内部测试对象，再解除维护，验收登录、原询盘读取、任务创建/领取/回传/采纳、版本冲突和重新登录后结果一致。只在新库开放经营写入；原 Blob 留作切换依据，不继续双写。
5. 常驻执行器另行完成真实 Sol、跨重启认证、关闭本机继续运行验收后，再启用自动领取。旧手动 Cloud 不与新执行器同时消费同一队列。

## 恢复与回退

Supabase Pro 当前保留每日备份七天；数据库备份不包含原附件文件。原件继续沿原存储保存。服务商恢复、用户误操作和程序版本回退分别处理，不把本地 `pg_dump` 恢复成功写成 Supabase 恢复已验收。

回退前停止经营写入和领取，核对切换后新增/修改记录，先恢复一致性再开放任一来源。不能简单把 `WORKBENCH_STORAGE` 改回旧 Blob 丢掉新库成果。首次迁移与后续恢复均保存受控回执，不在公开 Git 留客户记录、连接串、密码或原始导出。

官方依据：[连接与池](https://supabase.com/docs/guides/database/connecting-to-postgres)、[TLS](https://supabase.com/docs/guides/platform/ssl-enforcement)、[备份](https://supabase.com/docs/guides/platform/backups)、[价格](https://supabase.com/pricing)。

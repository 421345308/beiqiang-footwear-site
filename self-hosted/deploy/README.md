# Ubuntu 24.04 原生隔离部署

只准备包，未远程安装、未迁生产。API、PostgreSQL及runner原生systemd运行；
没有Docker，不改变sing-box、443、SSH、iptables、默认路由，不重启主机。
网站仍由EdgeOne承载公开静态页面，统一业务API走独立8443 TLS入口。

## 目录及资源

`/opt/beiqiang/releases/<UTC>/`只读代码，`current`软链接切换；
`/var/lib/beiqiang/files`为API专用0700私有原件；
`/etc/beiqiang/{api.env,runner.env}`为root 0600凭证；TLS证书位于`tls/`。
PG独立16/beiqiang cluster仅localhost:5433（IPv4/IPv6 loopback），10连接、64MB shared_buffers；
API仅127.0.0.1:8787，独立nginx进程仅8443。各进程组MemoryMax分别256/256/64MB，
runner512MB，CPUQuota分别50/50/25/75%，初值须按真实代理共存峰值调整。
合计上限不保证主机无争用，验收须包含真实模型任务和原代理基线。

## 安装顺序

先在可信本机运行`node self-hosted/deploy/build-release.mjs /absolute/new/external-release`。
构建器仅带锁文件实际版本的pg、nodemailer、pages-blob及其生产依赖闭包，
API/SQL/迁移及部署源和实际相对引用文件，生成最小package-lock与逐文件SHA256SUMS。
不带Next/React、工作树凭证、local/private或测试；依赖现有安装版本须匹配lock。
构建目录不能已存在或位于网站源码内；最终源改动完毕后重建新目录，不复用旧包。

1. 记录现有服务、监听端口、内存/磁盘、TCP/UDP/DNS代理基线。先确认8443/5433空闲。
2. 从Ubuntu官方apt仓库准备`postgresql-16 postgresql-client-16 nginx-core curl`；
   安装nginx包前防止默认服务自动启动，**不能启动默认nginx的80/443配置**。
   Node采用官方24.22.1发行版校验后安装到`/opt/beiqiang/runtime/node`；service与runner PATH已指向该路径，
   不要覆盖系统Node。不运行未知一键安装脚本。
3. 先运行`bash verify-pg-config.sh`：真实pg_conftool写新临时配置，再由PostgreSQL -C解析核验；不会启动或修改cluster。随后root运行`bash prepare-host.sh`。仅创建专用账号、目录、PG cluster和自身资源drop-in；
   不修改既有cluster。用`sudo -u postgres psql -p 5433`创建非超级用户`beiqiang`和同名数据库，
   交互式`\password beiqiang`设密码；URL密码须percent encode。
4. 只把API必要代码、SQL与已安装生产依赖打包。禁止复制整个工作树、`.env`、`.git`、客户原件、
   私钥和桌面登录态。包在可信构建机`npm ci --omit=dev`，保留package-lock；不在2GB主机做网站构建。
5. `bash release.sh install /absolute/unpacked-release`；安装service到`/etc/systemd/system/`，
   nginx.conf到`/etc/beiqiang/nginx.conf`，logrotate.conf到`/etc/logrotate.d/beiqiang`。
   api.env按example补真实值并chmod0600，证书/key同样受控。不要打印env内容。
6. `systemd-analyze verify`两个service；`nginx -t -c /etc/beiqiang/nginx.conf -p /var/lib/beiqiang/gateway`；
   `systemctl daemon-reload`；`bash release.sh activate <ID>`；再启动独立gateway。
   `/healthz`只证明进程就绪；认证、DB、附件与任务仍须业务验收。
7. 执行器按根工作台`cloud-runner/deploy/self-hosted/README.md`安装与真实mount检查。
   固定官网runner HTTPS端点由EdgeOne转发到统一后端，同一secret；不修改预检白名单。
8. 经同源EdgeOne转发验证owner/buyer、附件和真实任务后再enable本项目三个服务及专用PG。
   原业务写入口切换及迁移由统筹执行；包不会自行覆盖旧存储。

## 必须配置的变量

`WORKBENCH_DATABASE_URL`、`SELF_HOSTED_DATA_DIR`、`WORKBENCH_ORIGIN`、
`SELF_HOSTED_UPLOAD_SECRET`、`SELF_HOSTED_PROXY_SECRET`、`WORKBENCH_RUNNER_SECRET`及`PORT=8787`。
上传签名secret必须随恢复保留；代理secret只与EdgeOne内部桥共享。
已有owner/buyer会话、邮箱等业务变量沿原API约定补齐，不能因启动成功省略身份验收。
HOST示例仅说明绑定意图，HTTP服务实际固定loopback。

## 更新、停用与回退

新代码安装新release，再activate。服务仅重启`beiqiang-api`；不停止gateway、PG或代理。
有不兼容迁移先停写备份，不能仅切旧代码冒充回退。代码兼容时activate旧release ID；
失败release与原件保留。独立停用用`systemctl stop beiqiang-runner beiqiang-api beiqiang-gateway`，
确需停数据库只停`postgresql@16-beiqiang`。永不调用`reboot`、全局nginx restart或删除旧release。

## 备份及实际恢复

root运行`bash backup.sh /absolute/new/private-backup`：暂停本项目runner/API写入，
pg_dump custom格式加完整files.tar、release ID和SHA256SUMS，随后恢复原本active的服务。
凭证/签名secret另存受控加密介质，不公开、不放发布包。备份加密复制离机。
运行`bash restore-check.sh BACKUP /absolute/new/restore`校验manifest、拒绝路径穿越/链接，
恢复到新`beiqiang_restore_*`数据库与新文件目录，生产及源备份不变。
再以恢复库和`<restore>/files`设置`VERIFY_DATABASE_URL`、`VERIFY_DATA_DIR`，
`node self-hosted/deploy/verify-restored-storage.mjs`逐对象读取并校验二进制hash；
恢复成功必须包含此项和真实对象数，而不只是pg_restore退出0。
生产灾难恢复在停止入口写入后由统筹明确选择恢复库/目录，重新设置准确归属；不要全盘chown。

日志默认journal，不打印凭证/客户正文；nginx access_log关闭，error日志每周或5MB轮换保留4份。
共享journal大小由主机管理员整体管理，本包不改全局journald配置。

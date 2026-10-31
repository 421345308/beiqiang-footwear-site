#!/bin/bash
# Prerequisites installed separately after host review; no network changes here.
set -euo pipefail
umask 077
[[ $EUID == 0 ]] || exit 1
[[ $(. /etc/os-release; echo "$VERSION_ID") == 24.04 ]] || exit 1
for tool in pg_createcluster nginx; do command -v "$tool" >/dev/null || { echo "Missing prerequisite: $tool" >&2; exit 1; }; done
# Only our known Node runtime ancestors. Installation under umask 077 may leave
# an otherwise executable binary unreachable to the non-root service users.
for directory in /opt/beiqiang /opt/beiqiang/runtime /opt/beiqiang/runtime/node /opt/beiqiang/runtime/node/bin; do
  [[ -d $directory && ! -L $directory ]] || { echo "Expected real runtime directory: $directory" >&2; exit 1; }
  chmod 0755 "$directory"
done
[[ -f /opt/beiqiang/runtime/node/bin/node && ! -L /opt/beiqiang/runtime/node/bin/node ]] || exit 1
chmod 0755 /opt/beiqiang/runtime/node/bin/node
/opt/beiqiang/runtime/node/bin/node -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)'
for account in beiqiang-api beiqiang-runner; do
  id "$account" >/dev/null 2>&1 || useradd --system --create-home --home-dir "/var/lib/$account" --shell /usr/sbin/nologin "$account"
done
runuser -u beiqiang-api -- /opt/beiqiang/runtime/node/bin/node --version
runuser -u beiqiang-runner -- /opt/beiqiang/runtime/node/bin/node --version
install -d -m 0755 /opt/beiqiang /opt/beiqiang/releases /etc/beiqiang
install -d -m 0700 /etc/beiqiang/tls /var/lib/beiqiang/backups /var/log/beiqiang
install -d -m 0755 /var/lib/beiqiang
install -d -o beiqiang-api -g beiqiang-api -m 0700 /var/lib/beiqiang/files
install -d -o beiqiang-runner -g beiqiang-runner -m 0700 /var/lib/beiqiang/runner /var/lib/beiqiang/runner/codex /var/lib/beiqiang/runner/state
install -d -m 0755 /var/lib/beiqiang/gateway
install -d -o www-data -g www-data -m 0700 /var/lib/beiqiang/gateway/body /var/lib/beiqiang/gateway/proxy /var/lib/beiqiang/gateway/fastcgi /var/lib/beiqiang/gateway/uwsgi /var/lib/beiqiang/gateway/scgi
# Do not edit or restart another cluster. Refuse an occupied dedicated port.
if ! pg_lsclusters -h | awk '$1==16 && $2=="beiqiang" {found=1} END {exit !found}'; then
  if ss -ltnH 'sport = :5433' | grep -q .; then echo 'Port 5433 occupied' >&2; exit 1; fi
  pg_createcluster 16 beiqiang --port 5433 --start-conf manual -- --auth-host=scram-sha-256 --auth-local=peer
fi
pg_conftool 16 beiqiang set listen_addresses localhost
pg_conftool 16 beiqiang set shared_buffers 64MB
pg_conftool 16 beiqiang set max_connections 10
pg_conftool 16 beiqiang set work_mem 4MB
pg_conftool 16 beiqiang set maintenance_work_mem 32MB
install -d /etc/systemd/system/postgresql@16-beiqiang.service.d
cat > /etc/systemd/system/postgresql@16-beiqiang.service.d/resources.conf <<'EOF'
[Service]
MemoryMax=256M
CPUQuota=50%
TasksMax=64
EOF
systemctl daemon-reload
systemctl start postgresql@16-beiqiang.service
echo 'Dedicated DB ready on 127.0.0.1:5433. Create role/database interactively without shell-history passwords.'

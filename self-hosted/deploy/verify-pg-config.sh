#!/bin/bash
# Uses real pg_conftool and PostgreSQL parser on a new disposable config only.
# No cluster is created, started, stopped, or reconfigured.
set -euo pipefail
[[ $EUID == 0 ]] || exit 1
postgres_binary=${POSTGRES_CONFIG_BINARY:-/usr/lib/postgresql/16/bin/postgres}
check_dir=$(mktemp -d /tmp/beiqiang-pgconftool-check.XXXXXX)
chmod 0755 "$check_dir"
touch "$check_dir/postgresql.conf"
chmod 0644 "$check_dir/postgresql.conf"
pg_conftool "$check_dir/postgresql.conf" set listen_addresses localhost
pg_conftool "$check_dir/postgresql.conf" set shared_buffers 64MB
pg_conftool "$check_dir/postgresql.conf" set max_connections 10
pg_conftool "$check_dir/postgresql.conf" set work_mem 4MB
pg_conftool "$check_dir/postgresql.conf" set maintenance_work_mem 32MB
for item in listen_addresses:localhost shared_buffers:8192 max_connections:10 work_mem:4096 maintenance_work_mem:32768; do
  setting=${item%%:*}
  expected=${item#*:}
  actual=$(runuser -u postgres -- "$postgres_binary" -D "$check_dir" -c "config_file=$check_dir/postgresql.conf" -C "$setting")
  [[ $actual == "$expected" ]] || { echo "PostgreSQL config mismatch: $setting" >&2; exit 1; }
done
printf 'PASS: actual pg_conftool output accepted by PostgreSQL; loopback localhost and resource values verified. Evidence: %s\n' "$check_dir/postgresql.conf"

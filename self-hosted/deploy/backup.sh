#!/bin/bash
# Quiesced DB + private files; source and credentials stay in place.
set -euo pipefail
umask 077
[[ $EUID == 0 ]] || exit 1
output=${1:?absolute new backup directory}
[[ $output = /* && ! -e $output ]] || exit 1
install -d -m 0700 "$output"
api_active=$(systemctl is-active beiqiang-api.service || true)
runner_active=$(systemctl is-active beiqiang-runner.service || true)
resume() {
  [[ $api_active != active ]] || systemctl start beiqiang-api.service
  [[ $runner_active != active ]] || systemctl start beiqiang-runner.service
}
trap resume EXIT
systemctl stop beiqiang-runner.service beiqiang-api.service
runuser -u postgres -- pg_dump -p 5433 -Fc beiqiang > "$output/database.dump"
tar -C /var/lib/beiqiang -cpf "$output/files.tar" files
readlink /opt/beiqiang/current > "$output/release.txt"
(cd "$output"; sha256sum database.dump files.tar release.txt > SHA256SUMS)
echo 'Copy backup encrypted to controlled off-host storage and run restore-check.sh.'

#!/bin/bash
# New disposable DB/directory only. No production replacement or source deletion.
set -euo pipefail
umask 077
[[ $EUID == 0 ]] || exit 1
backup=$(realpath -e "${1:?backup directory}")
output=${2:?absolute new restore directory}
[[ $output = /* && ! -e $output ]] || exit 1
(cd "$backup"; sha256sum -c SHA256SUMS)
python3 - "$backup/files.tar" <<'PY'
import sys, tarfile
from pathlib import PurePosixPath
with tarfile.open(sys.argv[1]) as archive:
    for member in archive:
        path = PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or path.parts[0] != 'files' or not (member.isfile() or member.isdir()):
            raise SystemExit('Unsafe archive member')
PY
install -d -m 0700 "$output"
tar -xf "$backup/files.tar" -C "$output" --no-same-owner
check_db="beiqiang_restore_$(date +%s)_$$"
runuser -u postgres -- createdb -p 5433 "$check_db"
# Intentionally retain failed restores for inspection.
runuser -u postgres -- pg_restore -p 5433 --exit-on-error --no-owner --no-acl -d "$check_db" < "$backup/database.dump"
runuser -u postgres -- psql -p 5433 -d "$check_db" -v ON_ERROR_STOP=1 -c "SELECT count(*) AS restored_tables FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema');"
printf 'Restored DB: %s; files: %s. Run storage hash verification against this DB and directory. Production and backup retained.\n' "$check_db" "$output"

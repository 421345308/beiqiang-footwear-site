#!/bin/bash
set -euo pipefail
umask 077
[[ $EUID == 0 ]] || exit 1
base=/opt/beiqiang
case "${1:-}" in
install)
  source_path=$(realpath -e -- "${2:?release source}")
  [[ -f $source_path/self-hosted/server.mjs && -f $source_path/package-lock.json && -d $source_path/node_modules ]] || { echo 'Incomplete tested release' >&2; exit 1; }
  release_id=$(date -u +%Y%m%dT%H%M%SZ)
  target="$base/releases/$release_id"
  [[ ! -e $target ]] || exit 1
  install -d -m 0755 "$target"
  cp -a -- "$source_path/." "$target/"
  # This new dedicated release is the only tree whose ownership/mode we alter.
  # Refuse links before find/chmod so a copied link cannot reach another object.
  if find "$target" -type l -print | grep -q .; then
    echo 'Release contains symlinks; retained inactive for inspection' >&2; exit 1
  fi
  find "$target" -type d -exec chmod 0755 {} +
  find "$target" -type f -exec chmod 0644 {} +
  find "$target" -exec chown root:root {} +
  if find "$target" -path '*/node_modules' -prune -o \( -name .env -o -name auth.json -o -name '*.pem' \) -print | grep -q .; then
    echo 'Release contains credentials; retained inactive for inspection' >&2; exit 1
  fi
  echo "$release_id"
  ;;
activate)
  release_id=${2:?release ID}
  [[ $release_id =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || exit 1
  target=$(realpath -e "$base/releases/$release_id")
  [[ $target == "$base/releases/$release_id" && -f $target/self-hosted/server.mjs ]] || exit 1
  [[ ! -e $base/current || -L $base/current ]] || exit 1
  previous=$(readlink "$base/current" || true)
  ln -s "$target" "$base/current.next"
  mv -Tf "$base/current.next" "$base/current"
  systemctl restart beiqiang-api.service
  if ! curl --fail --silent --retry 5 --retry-delay 1 --retry-connrefused --max-time 10 http://127.0.0.1:8787/healthz >/dev/null; then
    echo "Health failed. Previous release: $previous. Explicit rollback requires schema-compatibility review." >&2; exit 1
  fi
  ;;
*) echo 'Usage: release.sh install SOURCE | activate RELEASE_ID' >&2; exit 2;;
esac

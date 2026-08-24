#!/bin/bash
# Tum seed dosyalarini 2024-01'den itibaren yeniden ceker
set -e
cd "$(dirname "$0")/.."
for s in organizasyon tur2 tur3 takimlar oyuncular; do
  if [ -f "data/raw/seed_${s}.csv" ]; then
    echo "=== seed_${s}.csv ==="
    python3 scripts/dfs_volume.py "data/raw/seed_${s}.csv" "data/raw/hacim_${s}.csv" 2>&1 | tail -4
  fi
done
python3 scripts/marka_siniflandir.py >/dev/null 2>&1
echo "=== marka siniflandirma tamam ==="

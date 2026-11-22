#!/bin/bash
set -euo pipefail

cd ~/VScode/GitHub/cn-private-network-platform

echo "=== STOP ONLY THE TEMPORARY PORT 1053 SERVER ==="

pid=$(sudo lsof -t -nP -iTCP:1053 -sTCP:LISTEN | head -n 1)

if [ -z "$pid" ]; then
  echo "ERROR: No temporary DNS server on port 1053"
  exit 1
fi

command_line=$(ps -ww -p "$pid" -o command=)

case "$command_line" in
  *rajat-ttl-probe-new.conf*)
    echo "Stopping verified temporary DNS PID $pid"
    kill -TERM "$pid"
    ;;
  *)
    echo "ERROR: Unexpected process. Not stopping it:"
    echo "$command_line"
    exit 1
    ;;
esac

for i in $(seq 1 20); do
  if ! sudo lsof -t -nP -iTCP:1053 -sTCP:LISTEN | grep -q .; then
    break
  fi
  sleep 0.1
done

if sudo lsof -t -nP -iTCP:1053 -sTCP:LISTEN | grep -q .; then
  echo "ERROR: Port 1053 is still occupied"
  exit 1
fi

echo "=== START TEMPORARY DNS WITH ORIGINAL IP ==="

/opt/homebrew/sbin/dnsmasq --no-daemon \
  --conf-file="$PWD/evidence/phase2/B-ttl/rajat-ttl-probe.conf" \
  2>&1 | tee evidence/phase2/B-ttl/rajat-final-switch-proof.txt

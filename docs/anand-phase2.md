# Phase 2 — Anand's Part (Main nginx edge, failover, DNS cache client)

**Machine:** Anand's Mac — `10.7.2.253` (role: primary nginx edge, backend failover, caching-DNS test client)
Only Anand's commands are listed here. Other members' parts are in their own sections of the team manual.

## Variables (paste in every Terminal tab)
```bash
export RAJAT_IP=10.7.10.96
export ANAND_IP=10.7.2.253
export RAJDEEP_IP=10.7.12.140
export OMVED_IP=10.7.26.0
export APP_HOST=app.team1.test
export APP_URL=https://app.team1.test:8443/api/status
```

## Status (done on this Mac)
- [x] Checkpoint 0.3: `en0` IP is 10.7.2.253 (matches assignment)
- [x] Evidence folders `evidence/phase2/{A..F}` and `~/cn-phase2-backups/` created
- [x] N1: cert, CA and `team1-server.key` present; old `nginx.conf` backed up to `~/cn-phase2-backups/nginx.conf`
- [x] N2: `config/nginx/nginx.conf` updated (new upstreams, listen 10.7.2.253:8443, passive failover, timeouts)
- [x] `nginx -t` OK; nginx started on 10.7.2.253:8443
- [x] `config/dnsmasq/cache-client.conf` created (TEST 4)
- [ ] Waiting on others: Backend A (Rajdeep), Backend B (Omved), DNS (Rajat/Omved) — then run N4, tests below

> Note: the manual's N2 wrote cert paths as `config/tls/...`, but nginx resolves relative paths against the
> config file's directory, so `nginx -t` failed. Fixed to `../tls/team1-server.crt` / `../tls/team1-server.key`.

## Checkpoint 0 (Anand)
```bash
cd ~/cn-private-network-platform
networksetup -getinfo Wi-Fi; ifconfig en0 | grep -E 'inet |ether '; route -n get default | grep gateway
for ip in "$RAJAT_IP" "$ANAND_IP" "$RAJDEEP_IP" "$OMVED_IP"; do echo "=== $ip ==="; ping -c 2 "$ip"; done
brew list nginx || brew install nginx
brew list dnsmasq || brew install dnsmasq   # needed for TEST 4 cache forwarder
```

## N1 — Check TLS files and back up config
```bash
ls -l config/tls/team1-server.crt config/tls/team1-ca.crt
test -f config/tls/team1-server.key && echo 'Private key OK'
cp config/nginx/nginx.conf "$HOME/cn-phase2-backups/nginx.conf"
```
Anand must also **AirDrop `team1-server.key` to Rajdeep** (never via GitHub/group chat) for the standby nginx.

## N2 — nginx.conf (final result)
Upstream pool `10.7.12.140:3001` (A) + `10.7.26.0:3002` (B), both `max_fails=1 fail_timeout=5s`;
`listen 10.7.2.253:8443 ssl`; `proxy_connect_timeout 2s; proxy_read_timeout 5s;`
`proxy_next_upstream error timeout http_502 http_503 http_504; proxy_next_upstream_tries 2;`
```bash
nginx -t -p "$PWD/" -c "$PWD/config/nginx/nginx.conf"
```

## N3 — Start / reload (choose ONE)
```bash
pgrep -fl 'nginx: master'
nginx -s reload -p "$PWD/" -c "$PWD/config/nginx/nginx.conf"   # if running
nginx -p "$PWD/" -c "$PWD/config/nginx/nginx.conf"              # if not running
lsof -nP -iTCP:8443 -sTCP:LISTEN
```

## N4 — Test nginx (from another Mac, e.g. Rajat; run it repeatedly)
```bash
curl --noproxy '*' --cacert config/tls/team1-ca.crt \
  --resolve app.team1.test:8443:10.7.2.253 -i https://app.team1.test:8443/api/status
```
Expected: HTTP 200, `X-Backend` alternating A/B.

## Backend reachability check (Anand, before tests)
```bash
curl -i http://10.7.12.140:3001/api/status   # Backend A
curl -i http://10.7.26.0:3002/api/status     # Backend B
```

## TEST 1 / N5 — HA failover (Extension D)
Rajdeep Ctrl+C's Backend A; Omved keeps B; Rajat runs the curl loop. **Anand watches the nginx error log:**
```bash
tail -f /tmp/cn-nginx-error.log
```
Save the output into `evidence/phase2/D-ha/` (e.g. `nginx-error-log.txt`, `nginx.conf` copy).

## TEST 2 — Backup DNS failover (Extension A)
After Rajat stops primary DNS, Anand:
```bash
dig @10.7.26.0 app.team1.test +noall +answer
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
curl --noproxy '*' --cacert config/tls/team1-ca.crt -i https://app.team1.test:8443/api/status
```
Save to `evidence/phase2/A-backup-dns/`.

## J4 — Client DNS settings (Anand as client; only after both DNS servers work)
```bash
networksetup -getdnsservers Wi-Fi                 # RECORD this first!
sudo networksetup -setdnsservers Wi-Fi 10.7.10.96 10.7.26.0
networksetup -getdnsservers Wi-Fi
scutil --dns
# Restore later:
sudo networksetup -setdnsservers Wi-Fi Empty      # or the values you recorded
```

## TEST 3 — Standby edge (Extension E)
Anand keeps main nginx online and helps with certificate problems (sends key to Rajdeep securely).

## TEST 4 — Caching DNS client on port 5533 (Terminal C)
File `config/dnsmasq/cache-client.conf` (already created):
```
port=5533
listen-address=127.0.0.1
bind-interfaces
no-resolv
server=/team1.test/10.7.10.96
cache-size=1000
log-queries
log-facility=-
```
```bash
"$(brew --prefix)/sbin/dnsmasq" --no-daemon --conf-file="$PWD/config/dnsmasq/cache-client.conf"
```
Leave open. Use 5533, NOT 5353.

## TEST 5 / 6 — TTL cache (Extension B)
```bash
dig @127.0.0.1 -p 5533 app.team1.test +noall +answer     # BEFORE cutover -> 10.7.2.253
# tell Rajat + Omved: "CUT OVER NOW"
dig @127.0.0.1 -p 5533 app.team1.test +noall +answer     # cached old answer (if within TTL)
dig @127.0.0.1 -p 5533 app.team1.test +noall +answer     # after expiry -> 10.7.12.140
```
Save real output to `evidence/phase2/B-ttl/` (do not fabricate cached results).

## TEST 7 — HTTPS uses new edge
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
curl -v --noproxy '*' --cacert config/tls/team1-ca.crt https://app.team1.test:8443/api/status 2>&1 | tee evidence/phase2/E-edge/https-after-cutover.txt
```
Confirm connected IP is 10.7.12.140.

## Restore (after Tests 4–7)
- Ctrl+C the cache forwarder (Terminal C)
- Restore Wi-Fi DNS (J4)
- Confirm: `dig @10.7.10.96 app.team1.test +noall +answer` and `dig @10.7.26.0 ...` → 10.7.2.253

## PF5 — Firewall verification (Extension C, Anand = allowed edge)
Both must SUCCEED from Anand:
```bash
curl --connect-timeout 3 http://10.7.12.140:3001/api/status
curl --connect-timeout 3 http://10.7.26.0:3002/api/status
```
(Do NOT run PF rules on Anand's Mac.) Save to `evidence/phase2/C-isolation/`.

## Extension F — Fault diagnosis (DNS → TCP → TLS → HTTP → backend)
```bash
dig @10.7.10.96 app.team1.test
dig @10.7.26.0 app.team1.test
nc -vz 10.7.2.253 8443
openssl s_client -connect 10.7.2.253:8443 -servername app.team1.test -CAfile config/tls/team1-ca.crt
curl --cacert config/tls/team1-ca.crt -v https://app.team1.test:8443/api/status
curl -i http://10.7.12.140:3001/api/status
curl -i http://10.7.26.0:3002/api/status
```

## Anand's end-of-session checklist
- [ ] Main nginx answers over trusted HTTPS on 10.7.2.253:8443
- [ ] Temporary cache resolver (port 5533) stopped
- [ ] Wi-Fi DNS restored
- [ ] Evidence saved (D-ha, A-backup-dns, B-ttl, E-edge, C-isolation, F-fault)
- [ ] No `*.key` committed (`git status` shows none)

## Evidence recorded so far (Anand, 22 Nov 2026 ~20:56 IST)
- `evidence/phase2/checkpoint0-anand.txt` — IP 10.7.2.253, netmask 0xffffe000 (/19 = 10.7.0.0–10.7.31.255, so all four IPs incl. 10.7.26.0 are valid hosts in one subnet), pings
- `evidence/phase2/E-edge/anand-nginx-main.txt` — `nginx -t` OK, listener on 10.7.2.253:8443, config
- `evidence/phase2/D-ha/anand-backend-reach.txt` — backends NOT yet reachable (connection refused: services not started)
- `evidence/phase2/F-fault/anand-edge-layers.txt` — TCP OK, TLS verify OK, HTTP 502 (nginx up, backends down)
Still to record once others are ready: HA failover, backup DNS, TTL cache, HTTPS cutover, firewall (PF5), restore.

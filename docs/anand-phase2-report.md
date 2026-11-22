# Phase 2 — Anand's Report (for Rajat)

**Machine:** Anand's Mac, `10.7.2.253` | **Role:** main nginx edge, backend failover, DNS-cache test client | **Date:** 22 Nov 2026

## 1. Done and verified
| Item | Result |
|---|---|
| IP / subnet (Checkpoint 0) | `en0` = 10.7.2.253, netmask `0xffffe000` (/19 → 10.7.0.0–10.7.31.255). All four IPs, incl. Omved's 10.7.26.0, are valid hosts in the same subnet |
| Ping to all four Macs | 0% loss (10.7.10.96, 10.7.2.253, 10.7.12.140, 10.7.26.0) |
| Evidence folders `evidence/phase2/{A..F}` | created |
| Old nginx.conf backup | `~/cn-phase2-backups/nginx.conf` |
| TLS files (crt, CA, server.key) | all present on my Mac (key is gitignored, not committed) |
| `config/nginx/nginx.conf` updated | upstream A `10.7.12.140:3001`, B `10.7.26.0:3002` (`max_fails=1 fail_timeout=5s`); `listen 10.7.2.253:8443 ssl`; `proxy_connect_timeout 2s`, `proxy_read_timeout 5s`, `proxy_next_upstream error timeout http_502 http_503 http_504`, `proxy_next_upstream_tries 2` |
| `nginx -t` | syntax ok / test successful |
| nginx running | listening on `10.7.2.253:8443` |
| TCP to 10.7.2.253:8443 | succeeded |
| TLS (`openssl s_client`, CA `team1-ca.crt`, SNI app.team1.test) | Verification: OK (CN=app.team1.test, issuer Team1 Local CA) |
| `config/dnsmasq/cache-client.conf` (port 5533 → 10.7.10.96) | created, `dnsmasq --test` OK |

## 2. Current status
- HTTPS request to nginx returns **502 Bad Gateway** because Backend A (Rajdeep) and Backend B (Omved) are not started yet (connection refused on 3001/3002). nginx, TCP and TLS are healthy.

## 3. Fix needed in the manual (important)
The manual's N2 writes cert paths as `config/tls/team1-server.crt`. nginx resolves relative paths against the **config file's folder**, so `nginx -t` failed (`config/nginx/config/tls/...` not found). I used:
```
ssl_certificate     ../tls/team1-server.crt;
ssl_certificate_key ../tls/team1-server.key;
```
Rajdeep's `config/nginx/nginx-standby.conf` has the same problem; it must use `../tls/...` as well.

## 4. Pending (need the other Macs)
- Rajdeep: start Backend A (3001), standby nginx (8443) — I will AirDrop him `team1-server.key` (not via GitHub/chat)
- Omved: start Backend B (3002) and backup DNS; Rajat: primary DNS
- Then I run: backend curls (N4), HA tail of `/tmp/cn-nginx-error.log` (Test 1), backup-DNS check (Test 2), cache forwarder on 5533 + TTL dig tests (Tests 4–6), HTTPS-after-cutover (Test 7), firewall check PF5 (both backend curls must succeed from me), fault diagnosis (F)
- Restore: stop cache forwarder, restore Wi-Fi DNS

## 5. Files to collect for the repo
- `config/nginx/nginx.conf`
- `config/dnsmasq/cache-client.conf`
- `docs/anand-phase2.md`, `docs/anand-phase2-report.md`
- `evidence/phase2/checkpoint0-anand.txt`
- `evidence/phase2/E-edge/anand-nginx-main.txt`
- `evidence/phase2/D-ha/anand-backend-reach.txt` (shows backends down at that time)
- `evidence/phase2/F-fault/anand-edge-layers.txt`
- No `*.key` files.

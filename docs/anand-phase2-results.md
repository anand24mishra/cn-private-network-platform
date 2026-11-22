# Anand — Phase 2 Results (Mac 10.7.2.253)

Last updated: 22 Nov 2026 ~23:30 IST. Only executed steps are marked PASS; live coordinated tests are BLOCKED/PENDING until the team runs them.

| ID | Test | Prerequisites | Command(s) | Observed | Result | Evidence | Restoration |
|---|---|---|---|---|---|---|---|
| A0 | Preflight | repo on `main`, no unmerged files | git status, `ipconfig getifaddr en0`, ping x4 | IP 10.7.2.253; 0% loss to all four; no merge conflicts | PASS | `evidence/phase2/checkpoint0-anand-current.txt` | n/a |
| A1 | Certificate/key check | key present | pubkey SHA-256 compare, `nginx -t`, `lsof 8443` | cert and key fingerprints match (`12949789…6211eb`); nginx -t ok; nginx listening 10.7.2.253:8443 | PASS | `evidence/phase2/E-edge/anand-cert-check-*.txt` | n/a |
| A1b | Server key to Rajdeep via AirDrop | human action | AirDrop only `team1-server.key` | not performed by Codex/Claude; needs Anand + Rajdeep | PENDING | — | Rajdeep deletes extra copy after demo |
| A2 | Backends online | Rajdeep/Omved started Node | `curl http://10.7.12.140:3001/api/status`, `http://10.7.26.0:3002/api/status` | A → 200 `X-Backend: A`; B → 200 `X-Backend: B` (21:38:54) | PASS | `evidence/phase2/D-ha/anand-backend-check-*.txt` | n/a |
| A2b | Edge baseline (earlier 502 resolved) | A2 PASS | 6× curl `--resolve` via nginx | 6× HTTP 200, alternating A/B/A/B/A/B (21:39:22) | PASS | `evidence/phase2/D-ha/anand-edge-baseline.txt` | n/a |
| A3 | HA failover (D) / Signal 2 | Rajdeep stops A, Omved keeps B, Rajat runs 10-request loops | tail `/tmp/cn-nginx-error.log` | Connection refused to 10.7.12.140:3001 and A temporarily disabled at 21:49:23; 10/10 requests 200 B-only during outage; A restored ~21:51; 10/10 200 alternating A/B after. See Signal 2 section | PASS (combined team evidence) | `evidence/phase2/D-ha/` | Backend A restarted by Rajdeep (PID 96309) |
| A4 | Backup DNS (A) / Signal 3 | both DNS answer 10.7.2.253; client DNS = 10.7.10.96, 10.7.26.0 | dig, dscacheutil, curl without `--resolve` | Primary stopped: `dig @10.7.10.96` timed out; system-order `dig` answered by `SERVER: 10.7.26.0` (23:03:15); HTTPS without `--resolve` → 200 (X-Backend B); Wi-Fi DNS restored to automatic; primary answers again | PASS | `evidence/phase2/A-backup-dns/` | Wi-Fi DNS `Empty` (verified 23:22); Rajat restarted primary |
| A5 | TTL cache + edge cutover (B, E) | Rajdeep standby nginx + key | cache-client.conf on :5533 | `dnsmasq --test` OK; port 5533 free; not started. Standby not yet verified | BLOCKED (standby edge not ready) | — | stop forwarder, DNS back to 10.7.2.253 |
| A6 | Isolation (C) | Rajdeep/Omved PF rules | curl direct backends from Anand | PF not yet applied by owners | BLOCKED | — | owners roll back PF |
| A7 | Fault drill (F) | fault introduced by team/faculty | dig → nc → openssl → curl → backends | Earlier baseline layers: TCP ok, TLS verify OK, HTTP 502 when backends were down (`F-fault/anand-edge-layers.txt`); formal drill not run | PENDING | `evidence/phase2/F-fault/anand-edge-layers.txt` | — |

## Notes
- `config/nginx/nginx.conf` uses `../tls/...` cert paths; `nginx -t` passes. For Rajdeep's standby config use absolute paths on his Mac.
- Wi-Fi DNS on this Mac was automatic (DHCP), so `Empty` is the correct restore.
- Teammates/services unavailable for live tests: coordinated failure steps need Rajat, Rajdeep, Omved.
- No private keys displayed or committed (`*.key` gitignored).

### Signal 2 — Extension D: Backend HA failover — **PASS** (combined team evidence)

**Objective:** with A and B healthy, nginx serves both; when only Backend A stops, the same nginx URL keeps returning HTTP 200 from B; after A restarts, both A and B serve again (nginx passive health checking, `max_fails=1 fail_timeout=5s`, `proxy_next_upstream ... tries 2`).

**Roles:** Rajat 10.7.10.96 — client requests/leader; Anand 10.7.2.253 — main nginx :8443, logs; Rajdeep 10.7.12.140 — stopped/restarted Backend A (:3001); Omved 10.7.26.0 — kept Backend B (:3002) running.

**Chronology (IST, 22 Nov 2026)**
| Time | Event | Source |
|---|---|---|
| 21:41 | Anand pre-check: direct A and B return 200 (A / B headers) | `anand-upstream-a-before.txt`, `anand-upstream-b-before.txt` (Anand's Mac) |
| before 21:49 | Baseline: A and B both returned 200 (reported by Rajat and Rajdeep) | team report; Rajat's file not on this Mac |
| 21:49:23 | Rajdeep stopped A. nginx error log: `connect() failed (61: Connection refused) ... upstream: http://10.7.12.140:3001/api/status` (client 10.7.10.96) | `anand-during-failover.txt` (lines 1) |
| 21:49:23 | nginx log: `upstream server temporarily disabled while connecting to upstream ... 10.7.12.140:3001` | `anand-during-failover.txt` (line 2) |
| 21:49:23–21:49:25 | Rajat's 10 requests via main nginx: access log shows 10 × HTTP 200 (lines 42–51); Rajat reports all `X-Backend: B`, curl exit 0 | `anand-nginx-access-signal2.txt`; Rajat's `rajat-a-stopped.txt` (his Mac) |
| ~21:51 | Rajdeep restarted A (new PID 96309); direct curl 200 `X-Backend: A`; access log shows 6 requests from 10.7.12.140 at 21:51:25–26 returning 200 | `anand-nginx-access-signal2.txt` lines 52–57; Rajdeep's `rajdeep-backend-a-restored.txt` (his Mac) |
| 21:52:26–27 | Rajat's 10 requests after recovery: access log 10 × 200 (lines 58–67); Rajat reports alternating A,B,A,B,A,B,A,B,A,B, exit 0 | `anand-nginx-access-signal2.txt`; Rajat's `rajat-after-recovery.txt` (his Mac) |

**Failure detection:** a single refused connection to A (first request, 21:49:23) marked A temporarily unavailable (`max_fails=1`). nginx retried that request on B (`proxy_next_upstream error`) so the client still got 200. For the next `fail_timeout=5s` nginx skipped A, so the remaining requests went to B only; no further refused-connection lines appear, which is expected. After the timeout and A's restart, A was probed again and rejoined the round-robin.

**Why it kept serving:** the upstream pool has two servers; passive failover with `proxy_next_upstream error timeout http_502 http_503 http_504` and `proxy_next_upstream_tries 2` retries on the healthy server, and the failed one is temporarily removed.

**Distinguishing older errors:** error-log entries at 20:56:24–25 (4 lines, both A and B refused) are from the earlier 502 test when both backends were down, before Signal 2. Signal 2 lines are only the two at 21:49:23. The 502 at 20:56:25 in the access log is the same earlier event.

**Evidence on Anand's Mac (owner Anand), `evidence/phase2/D-ha/`:** `anand-during-failover.txt` (original monitored log, untouched, 2 lines), `anand-nginx-access-signal2.txt` (extract of `/tmp/cn-nginx-access.log`, 21:48–21:55), `anand-nginx-error-full-*.txt` (full copy of `/tmp/cn-nginx-error.log`), `anand-upstream-a-before.txt`, `anand-upstream-b-before.txt`, `anand-edge-baseline.txt`.
**Evidence on other Macs (reported, not present here):** Rajat — `rajat-before.txt`, `rajat-a-stopped.txt`, `rajat-after-recovery.txt`; Rajdeep — `rajdeep-backend-a-before/stopped/restored.txt`; Omved — `omved-backend-b-*.txt`. Must be collected into the shared repo by Rajat.

**Limitations / observations:** nginx access log does not record which backend answered, so A/B attribution comes from Rajat's `X-Backend` output. The tests used `--resolve` to bypass client DNS, so this does not prove DNS-based HTTPS. Only one refused-connection error line appears (one request hit A first). Main nginx remains a single point of failure until edge migration (Signal 4). `anand-nginx-error-during.txt`/`-after.txt` were not separately created; the full error log copy covers them.

Not completed (separate signals): backup DNS failover, TTL, edge migration, PF isolation, troubleshooting drill.

### Signal 3 — Backup DNS failover (Extension A) — **PASS** (verified, restored)
- 22:15 IST: Wi-Fi DNS set to `10.7.10.96` (primary), `10.7.26.0` (backup) by Anand (sudo, own Terminal). Original was automatic (8.8.8.8, 10.5.7.1) → restore with `sudo networksetup -setdnsservers Wi-Fi Empty` after the test.
- Before primary stop: `scutil --dns` resolver #1 = 10.7.10.96, 10.7.26.0; `dscacheutil` and `dig` return `10.7.2.253` (TTL 30); `curl https://app.team1.test:8443/api/status` WITHOUT `--resolve` → connected to 10.7.2.253, `SSL certificate verify ok`, HTTP 200, `X-Backend: B`. PASS (precondition). Evidence: `evidence/phase2/A-backup-dns/anand-signal3-before-primary-stop.txt`
- Primary-DNS-stop result, backup answer and restoration: PENDING.
- **Primary stopped (Rajat's signal), 22:16:11–22:16:14 IST:** `dig @10.7.10.96` → `connection timed out; no servers could be reached` (exit 9); `dig @10.7.26.0` → `10.7.2.253` TTL 30; plain `dig` (system order) → `10.7.2.253` after 1.03 s (≈1 s delay consistent with fallback from dead primary to backup); `curl https://app.team1.test:8443/api/status` WITHOUT `--resolve` → connected to 10.7.2.253, `SSL certificate verify ok`, HTTP 200, `X-Backend: A`, 0.27 s total. Evidence: `evidence/phase2/A-backup-dns/anand-signal3-primary-stopped.txt`. Result: PASS for client behavior.
- **Caveats:** the sudo cache flush (`dscacheutil -flushcache`, `killall -HUP mDNSResponder`) was NOT run (no sudo in this session; run by Anand if desired). `dscacheutil` (0.03 s) and curl (0.27 s) may have used the macOS cache entry from 22:15:49 (age ~22 s < TTL 30 s), so they alone don't prove backup use; the 1.03 s plain `dig` and `dig @10.7.26.0` do. Omved's tcpdump of queries from 10.7.2.253 is the confirming server-side evidence (on his Mac). Restoration of primary DNS (Rajat) and of Anand's Wi-Fi DNS (`Empty`) still PENDING.

**Final Signal 3 verification (from the saved evidence files, all on Anand's Mac, owner Anand):**
| Stage | Time (IST) | Observation | File |
|---|---|---|---|
| Before outage | 22:12:01 | Wi-Fi DNS = 10.7.10.96, 10.7.26.0; `scutil` resolver #1 shows both; lookup → 10.7.2.253; HTTPS without `--resolve` → 200, `X-Backend: A`, TLSv1.3, cert verify ok, curl_exit=0 | `anand-before-outage.txt` |
| Pre-stop checkpoint | 22:15:14 / 22:15:49 | same results (HTTP 200). Taken before Rajat's stop completed, so NOT counted as outage proof | `anand-primary-down.txt`, `anand-signal3-before-primary-stop.txt` |
| Primary stopped | 22:16:11 | `dig @10.7.10.96` → timed out (exit 9); `dig @10.7.26.0` → 10.7.2.253; HTTPS 200 (may have used a cached entry, no sudo flush in this session) | `anand-signal3-primary-stopped.txt` |
| **Primary down, clean test** | **23:03:14** | plain `dig app.team1.test` (system resolvers, +tries=2) → `10.7.2.253`, `SERVER: 10.7.26.0#53`, 21 ms → the backup answered; `dscacheutil` → 10.7.2.253; HTTPS without `--resolve` → connected 10.7.2.253, `SSL certificate verify ok`, HTTP 200, `X-Backend: B`, curl_exit=0 | `anand-final-primary-down.txt` |
| Restored | 23:22:51 | `networksetup -getdnsservers Wi-Fi` → "There aren't any DNS Servers set on Wi-Fi."; `scutil --dns` resolver #1 = 8.8.8.8, 10.5.7.1 (original automatic state); `dig @10.7.26.0` still answers 10.7.2.253 | `anand-dns-restored.txt` |
| Primary back (re-checked 23:2x, read-only) | — | `dig @10.7.10.96 app.team1.test` → 10.7.2.253 TTL 30 | this check, not a saved file |

**Conclusion:** with Rajat's primary DNS (10.7.10.96) stopped, the macOS client kept resolving `app.team1.test` through Omved's backup (10.7.26.0, shown by the dig SERVER line) and normal HTTPS (no `--resolve`, trusted TLS) returned HTTP 200. Original client DNS settings (automatic) are restored and the primary is answering again.

**Limitations:** the omitted `sudo` cache flush means the dscacheutil/curl lines alone are not proof of backup use; the `SERVER: 10.7.26.0` line in `anand-final-primary-down.txt` is the decisive client-side evidence. Server-side confirmation (Omved's tcpdump/dnsmasq log of queries from 10.7.2.253) and Rajat's primary-stop/restart records are on their Macs and were reported, not inspected here. Signals 4–6 (TTL, edge migration, PF isolation, troubleshooting) not completed.

### Signal 4 — Extensions B (TTL) + E (edge migration) — IN PROGRESS: PREPARE done (Anand)
**PREPARE (23:37 IST) — PASS**
- Main edge healthy: `curl --resolve app.team1.test:8443:10.7.2.253` → 200, `X-Backend: B`, exit 0. Evidence: `evidence/phase2/E-edge/anand-signal4-prepare.txt`
- `cache-client.conf` verified: port 5533, 127.0.0.1, `no-resolv`, `server=/team1.test/10.7.10.96`, cache-size 1000; no `min-cache-ttl`/`max-cache-ttl`/`use-stale-cache`; `dnsmasq --test` OK; port 5533 was free.
- Both upstream DNS (10.7.10.96, 10.7.26.0) answered `10.7.2.253` TTL 30 before cutover.
- Cache resolver started (PID 45953, background, log appended to `evidence/phase2/B-ttl/anand-cache-daemon-log.txt`; runbook used a foreground `tee`, equivalent). Caching verified (23:37:28): TTL 30 → 27 → 24 for `10.7.2.253`; daemon log shows `forwarded ... to 10.7.10.96` then `cached`. Evidence: `evidence/phase2/B-ttl/anand-cache-prime-check.txt`. PASS (cache demonstrably caches, so TTL test can proceed).
- Wi-Fi DNS currently automatic (original). Temporary set to 10.7.10.96 / 10.7.26.0 (needs Anand's sudo + approval): PENDING.
- 4A (cache primed immediately before GO), 4B (timeline), 4C (HTTPS to 10.7.12.140), 4D (restore): PENDING leader GO.

---
## Consolidated addendum for PR (written from saved evidence files; supersedes the earlier "PENDING/BLOCKED/IN PROGRESS" lines above)

Machine: Anand, 10.7.2.253. Times IST (22–23 Nov 2026). Rajat's and other members' own files are in the team's `evidence/phase2/*/rajat-*` etc.; Anand's files are `evidence/phase2/*/anand-*`. Files whose names collided with Rajat's are kept in `evidence/phase2/teammates/anand/`.

### Extension B — DNS TTL / cache (Anand's local caching resolver on 127.0.0.1:5533)
- Config: `config/dnsmasq/cache-client.conf` (port 5533, loopback, `no-resolv`, forwards `team1.test` to Rajat 10.7.10.96, no TTL overrides). Probe variant `evidence/phase2/B-ttl/anand-ttl-probe-cache.conf` forwards `ttl-probe.team1.test` to Rajat's probe listener `10.7.10.96#1053` so production names were not changed for the TTL test.
- Caching verified (23:37, `anand-cache-prime-check.txt`): TTL 30→27→24; daemon log shows `forwarded` then `cached`.
- Cache-vs-upstream experiment (`anand-final-cache-change-proof.txt`, 01:47:48–01:48:35): cache and Rajat's upstream both returned `10.7.12.140`. At **01:48:26 the upstream switched to `10.7.2.253`** while Anand's cache **kept returning the old `10.7.12.140`** with TTL counting down (22, 21, 19 … 13 at 01:48:35). This is the old-cached-IP-persists observation.
- After expiry (`anand-cache-expiry-final-proof.txt`, 01:50:50): cache returned the new `10.7.2.253` (TTL 30, refreshed), upstream `10.7.2.253`; a recheck 16 s later showed cached TTL 14 for the new IP.
- Earlier transition attempts are kept unmodified for transparency (`anand-final-ttl-transition.txt`, `anand-final-transition-retry.txt`, `anand-rollback-ttl-transition*.txt`, `anand-signal4-ttl-timeline.txt` for production name `app.team1.test`, `anand-probe-cache-log.txt`); the decisive proof is the pair of files above.
- Result: PASS (old IP retained in cache after upstream change; new IP after expiry).

### Extension E — Standby edge migration (client side)
- Normal HTTPS (no `--resolve`) after DNS cutover (`E-edge/anand-standby-https.txt`, 00:09:15): connected to **10.7.12.140:8443**, `SSL certificate verify ok`, HTTP 200, `X-Backend: B`.
- Rollback (`E-edge/anand-original-edge-restored.txt`, 00:25:41): normal HTTPS connected to **10.7.2.253:8443**, verify ok, HTTP 200. Client DNS restored to automatic (`E-edge/anand-client-restored.txt`, 00:26:13: no manual DNS; resolvers 8.8.8.8, 10.5.7.1).
- Result: PASS.

### Extension C — Isolation (Anand = allowed edge)
- With owners' PF rules active: Anand → Backend A direct 200 and HTTPS via main nginx 200 (`C-isolation/anand-backend-a-pf-active.txt`, 00:52:39); Anand → Backend B direct 200 (`anand-backend-b-pf-active.txt`, 01:04:18). Blocked-client proof is on Rajat's Mac (`rajat-backend-*-pf-active*.txt`). Rajdeep's/Omved's PF rule files and rollback are theirs. Files `direct-baseline-recovered.txt` and `direct-before-firewall.txt` differ from Rajat's same-named files, so Anand's versions are under `evidence/phase2/teammates/anand/C-isolation/`. Omved Backend B diagnosis: `C-isolation/omved-backend-b-diagnosis.txt`.
- Result: PASS for Anand's side (allowed edge reaches both backends).

### Extension F — Troubleshooting / later checkpoint
- `final/anand-upstream-diagnosis.txt` (02:05:38): TCP/HTTP to Backend A OK (200); **Backend B TCP timed out (`b_tcp_exit=1`) and HTTP `b_http_exit=28`** (timeout). This is a point-in-time failure at that checkpoint (Backend B on Omved's Mac unreachable), preserved as-is.
- Recovery: `final/anand-b-recovery-check.txt` (02:36): Backend B `http://10.7.26.0:3002` → HTTP 200 and Backend A → HTTP 200. Root cause of the 02:05 timeout was not captured on Anand's Mac (Omved's side).

### Production state at 02:36 IST (read-only checks)
- Backends A and B both HTTP 200; primary DNS answers `10.7.2.253` TTL 30; Anand's Wi-Fi DNS automatic; main nginx on 10.7.2.253:8443 unchanged.
- Anand's temporary cache resolver (127.0.0.1:5533, PID 57747) was still running at the time of this check (`B-ttl/anand-final-cleanup.txt` records it at 02:01); stop it with Ctrl+C / `kill 57747` when finished. It does not affect production DNS.

### nginx configuration note
`config/nginx/nginx.conf` on this branch (team's working config, absolute cert paths for Anand's Mac) is **unchanged**. Anand's tested failover variant is archived as `config/nginx/nginx-anand-failover.conf` (adds `max_fails=1 fail_timeout=5s`, `proxy_connect_timeout 2s`, `proxy_read_timeout 5s`, `proxy_next_upstream … tries 2`, repo-relative `../tls/…` cert paths). Its HA behaviour is documented in the Signal 2 section above.

### Limitations
- Other members' files are referenced, not duplicated. The sudo DNS-cache flush was done by Anand manually where noted.
- No private keys or credentials are included (`*.key` excluded; evidence scanned).

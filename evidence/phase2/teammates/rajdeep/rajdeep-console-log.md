# CN Phase 2 — Rajdeep's command outputs

Machine: Rajdeep's Mac (role: Backend A on 3001, standby nginx on 8443, PF firewall).
Repo: ~/Desktop/cn-private-network-platform
Date: 2026-11-22
Variables exported in every step: RAJAT_IP=10.7.10.96, ANAND_IP=10.7.2.253, RAJDEEP_IP=10.7.12.140, OMVED_IP=10.7.26.0, APP_HOST=app.team1.test, APP_URL=https://app.team1.test:8443/api/status

## Checkpoint 0

### 0.1 Open repo

```bash
$ pwd; git status --short; git branch --show-current
```

```text
/Users/rajdeep/Desktop/cn-private-network-platform
phase2
[exit code: 0]
```

### 0.3 IP / netmask / gateway / interface

```bash
$ networksetup -listallhardwareports; echo ---; ipconfig getifaddr en0; echo ---; networksetup -getinfo Wi-Fi; echo ---; ifconfig en0 | grep -E "inet |ether "; echo ---; route -n get default | grep gateway
```

```text

Hardware Port: Ethernet Adapter (en3)
Device: en3
Ethernet Address: 62:12:18:fb:69:11

Hardware Port: Ethernet Adapter (en4)
Device: en4
Ethernet Address: 62:12:18:fb:69:12

Hardware Port: Thunderbolt Bridge
Device: bridge0
Ethernet Address: 36:f2:1e:e2:21:00

Hardware Port: Wi-Fi
Device: en0
Ethernet Address: 10:9f:41:c5:c7:51

Hardware Port: Thunderbolt 1
Device: en1
Ethernet Address: 36:f2:1e:e2:21:00

Hardware Port: Thunderbolt 2
Device: en2
Ethernet Address: 36:f2:1e:e2:21:04

VLAN Configurations
===================
---
10.7.12.140
---
DHCP Configuration
IP address: 10.7.12.140
Subnet mask: 255.255.224.0
Router: 10.7.0.1
Client ID: 
IPv6: Automatic
IPv6 IP address: none
IPv6 Router: none
Wi-Fi ID: 10:9f:41:c5:c7:51
---
	ether 6e:e6:fe:6e:73:20
	inet 10.7.12.140 netmask 0xffffe000 broadcast 10.7.31.255
---
    gateway: 10.7.0.1
[exit code: 0]
```

### 0.4 Reachability ping

```bash
$ for ip in "$RAJAT_IP" "$ANAND_IP" "$RAJDEEP_IP" "$OMVED_IP"; do echo "=== $ip ==="; ping -c 2 -t 5 "$ip"; done
```

```text
=== 10.7.10.96 ===
PING 10.7.10.96 (10.7.10.96): 56 data bytes
64 bytes from 10.7.10.96: icmp_seq=0 ttl=64 time=39.961 ms
64 bytes from 10.7.10.96: icmp_seq=1 ttl=64 time=83.854 ms

--- 10.7.10.96 ping statistics ---
2 packets transmitted, 2 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 39.961/61.907/83.854/21.946 ms
=== 10.7.2.253 ===
PING 10.7.2.253 (10.7.2.253): 56 data bytes
64 bytes from 10.7.2.253: icmp_seq=0 ttl=64 time=6.886 ms
64 bytes from 10.7.2.253: icmp_seq=1 ttl=64 time=9.139 ms

--- 10.7.2.253 ping statistics ---
2 packets transmitted, 2 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 6.886/8.012/9.139/1.127 ms
=== 10.7.12.140 ===
PING 10.7.12.140 (10.7.12.140): 56 data bytes
64 bytes from 10.7.12.140: icmp_seq=0 ttl=64 time=0.244 ms
64 bytes from 10.7.12.140: icmp_seq=1 ttl=64 time=0.173 ms

--- 10.7.12.140 ping statistics ---
2 packets transmitted, 2 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.173/0.208/0.244/0.035 ms
=== 10.7.26.0 ===
PING 10.7.26.0 (10.7.26.0): 56 data bytes
64 bytes from 10.7.26.0: icmp_seq=0 ttl=64 time=11.074 ms
64 bytes from 10.7.26.0: icmp_seq=1 ttl=64 time=15.518 ms

--- 10.7.26.0 ping statistics ---
2 packets transmitted, 2 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 11.074/13.296/15.518/2.222 ms
[exit code: 0]
```

### 0.5 Software check (nginx, node)

```bash
$ brew --version; brew list nginx >/dev/null 2>&1 && echo "nginx installed: $(nginx -v 2>&1)" || echo "nginx NOT installed"; node --version
```

```text
Homebrew 7.0.14
nginx installed: nginx version: nginx/1.31.6
v20.20.2
[exit code: 0]
```

## Checkpoint 1

### 1.1 Evidence folders

```bash
$ mkdir -p evidence/phase2/{A-backup-dns,B-ttl,C-isolation,D-ha,E-edge,F-fault}; mkdir -p docs; mkdir -p "$HOME/cn-phase2-backups"; ls evidence/phase2; git status --short
```

```text
A-backup-dns
B-ttl
C-isolation
D-ha
E-edge
F-fault
[exit code: 0]
```

### 1.2 Backup /etc/pf.conf (sudo) — NOT RUN YET

`sudo` needs a password, and Claude cannot type it. Run these by hand (see "Pending" at the end).

## Rajdeep — Backend A + standby nginx

### R1 Start Backend A

```bash
$ BACKEND=A PORT=3001 node backend/server.js   # started in background with nohup, PID 65675, log /tmp/cn-backend-a.log
```

```text
Backend A listening on 0.0.0.0:3001
```

### R2 Verify Backend A

```bash
$ curl -i http://10.7.12.140:3001/api/status; echo; lsof -nP -iTCP:3001 -sTCP:LISTEN
```

```text
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0100    29    0    29    0     0    120      0 --:--:-- --:--:-- --:--:--   120100    29    0    29    0     0    120      0 --:--:-- --:--:-- --:--:--   120
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 15:27:47 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    65675 rajdeep   15u  IPv4 0xc455927018858da9      0t0  TCP *:3001 (LISTEN)
[exit code: 0]
```

### R3 Check TLS files

```bash
$ ls -l config/tls/team1-server.crt config/tls/team1-ca.crt; test -f config/tls/team1-server.key && chmod 600 config/tls/team1-server.key && echo "server key present" || echo "STOP: config/tls/team1-server.key missing — Anand must AirDrop it"
```

```text
-rw-r--r--  1 rajdeep  staff  2009 22 Nov 20:54 config/tls/team1-ca.crt
-rw-r--r--  1 rajdeep  staff  1769 22 Nov 20:54 config/tls/team1-server.crt
STOP: config/tls/team1-server.key missing — Anand must AirDrop it
[exit code: 0]
```

## Status at end of this run

**Done and verified**
- Checkpoint 0: the IP is 10.7.12.140 on en0 (Wi-Fi). The netmask is 255.255.224.0 (/19), so the subnet is 10.7.0.0–10.7.31.255 and all four team IPs are in it. The gateway is 10.7.0.1. All four Macs answer ping. nginx 1.31.6 and Node v20.20.2 are installed.
- Checkpoint 1.1: the evidence folders and ~/cn-phase2-backups exist.
- R1/R2: Backend A is running in the background (PID 65675, log /tmp/cn-backend-a.log). It returns HTTP 200 with `X-Backend: A`.

**Blocked**
- R3: `config/tls/team1-server.key` is missing. Per the runbook, I stopped before R4. Anand must AirDrop the key into `config/tls/`. Then run R3 again, followed by R4 (create `nginx-standby.conf` and run `nginx -t`).

**Pending: needs sudo password or a live-session cue from the leader**
- 1.2: `sudo cp /etc/pf.conf ~/cn-phase2-backups/pf.conf.before`, `sudo pfctl -s info | head -10`, `sudo pfctl -sr`
- R5: start standby nginx (only when Rajat says so, after R4 passes)
- R6: stop/restart Backend A during Test 1 (Extension D). To stop the background copy: `kill 65675`
- J4: set the client DNS to 10.7.10.96 and 10.7.26.0 (sudo; only after both DNS servers work)
- PF1/PF3/PF4: Backend A firewall anchor (sudo; only after Tests D/A/E/B)
- PF6: firewall rollback (sudo)

## Update after Anand's report

Anand reported that nginx resolves relative certificate paths against the config file's folder (`config/nginx/`), not the `-p` prefix. With the runbook's `config/tls/...` paths, `nginx -t` fails. Based on this report, I wrote `config/nginx/nginx-standby.conf` (R4) using `../tls/team1-server.crt` and `../tls/team1-server.key`. Everything else matches the runbook.

Recheck at this point:
- Backend A is still listening on 3001 (PID 65675). `curl http://10.7.12.140:3001/api/status` returns `{"backend":"A","status":"ok"}`. Anand's earlier 502 came from before Backend A started.
- `config/tls/team1-server.key` is still missing because the AirDrop has not arrived. `nginx -t` for the standby config is not run yet.

## After key AirDrop

### R3 Check TLS files (re-run)

```bash
$ ls -l config/tls/team1-server.crt config/tls/team1-ca.crt; test -f config/tls/team1-server.key && chmod 600 config/tls/team1-server.key && ls -l config/tls/team1-server.key && echo "server key present"
```

```text
-rw-r--r--  1 rajdeep  staff  2009 22 Nov 20:54 config/tls/team1-ca.crt
-rw-r--r--  1 rajdeep  staff  1769 22 Nov 20:54 config/tls/team1-server.crt
-rw-------@ 1 rajdeep  staff  1704  4 Oct 22:46 config/tls/team1-server.key
server key present
[exit code: 0]
```

### R3b Key matches certificate

```bash
$ diff <(openssl x509 -noout -pubkey -in config/tls/team1-server.crt) <(openssl pkey -pubout -in config/tls/team1-server.key) && echo "key matches cert"
```

```text
key matches cert
[exit code: 0]
```

### R4 nginx standby syntax test

```bash
$ nginx -t -p "$PWD/" -c "$PWD/config/nginx/nginx-standby.conf"
```

```text
nginx: the configuration file /Users/rajdeep/Desktop/cn-private-network-platform/config/nginx/nginx-standby.conf syntax is ok
nginx: configuration file /Users/rajdeep/Desktop/cn-private-network-platform/config/nginx/nginx-standby.conf test is successful
[exit code: 0]
```

### Git ignores key

```bash
$ git check-ignore -v config/tls/team1-server.key; git status --short
```

```text
.gitignore:8:*.key	config/tls/team1-server.key
?? config/nginx/nginx-standby.conf
[exit code: 0]
```

### 1.2 Backup /etc/pf.conf + PF state (sudo via password dialog)

```bash
$ sudo cp /etc/pf.conf "$HOME/cn-phase2-backups/pf.conf.before"
$ sudo pfctl -s info | head -10
$ sudo pfctl -sr
```

```text
backup ok: -rw-r--r--@ 1 root  staff  1027 22 Nov 21:08 /Users/rajdeep/cn-phase2-backups/pf.conf.before
--- pfctl -s info ---
No ALTQ support in kernel
ALTQ related functions disabled
Status: Disabled                              Debug: Urgent

State Table                          Total             Rate
  current entries                        0               
  searches                               0            0.0/s
  inserts                                0            0.0/s
  removals                               0            0.0/s
Counters
--- pfctl -sr ---
No ALTQ support in kernel
ALTQ related functions disabled
scrub-anchor "com.apple/*" all fragment reassemble
anchor "com.apple/*" all
[exit code: 0]
```

**Note for rollback (PF6):** PF was **Disabled** before Phase 2, and only the Apple anchors (`com.apple/*`) were loaded. When `pfctl -E` runs in PF4, save the token it prints. In PF6, release it with `sudo pfctl -X <token>` so PF returns to disabled.

## Standby nginx check — found the old Phase 1 nginx on 8443

The standby nginx (`nginx-standby.conf`) is **not** running. `/tmp/cn-nginx-standby.pid` is an empty file that `nginx -t` created.

The process listening on `*:8443` was the old Phase 1 Homebrew nginx service. It had been running since 17 Nov, using `/opt/homebrew/etc/nginx/nginx.conf`, with upstreams `10.253.140.169:3001` and `10.253.140.1:3002` (old network) and certificates from `~/cn-project/certs/`. It would return errors to anyone hitting 10.7.12.140:8443, and it would block R5. The runbook (N3 note) says to stop an unrelated Homebrew nginx on 8443, so I stopped it. To undo: `brew services start nginx`.

### Before: brew services

```bash
$ brew services list | grep nginx; lsof -nP -iTCP:8443 -sTCP:LISTEN
```

```text
nginx         started         rajdeep ~/Library/LaunchAgents/sh.brew.nginx.plist
COMMAND  PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
nginx   1825 rajdeep    6u  IPv4 0xbc38c457c43176e8      0t0  TCP *:8443 (LISTEN)
nginx   2470 rajdeep    6u  IPv4 0xbc38c457c43176e8      0t0  TCP *:8443 (LISTEN)
[exit code: 0]
```

### Stop old Homebrew nginx service

```bash
$ brew services stop nginx
```

```text
Stopping `nginx`... (might take a while)
==> Successfully stopped `nginx` (label: sh.brew.nginx)
[exit code: 0]
```

### After: port 8443 and nginx processes

```bash
$ lsof -nP -iTCP:8443 -sTCP:LISTEN || echo "nothing listening on 8443"; pgrep -fl nginx || echo "no nginx process"; brew services list | grep nginx
```

```text
nothing listening on 8443
no nginx process
nginx         none                    
[exit code: 0]
```

## Standby readiness, firewall prep, results doc (21:13–21:16 IST)

- The standby readiness checks all passed: Backend A returns 200, the listen address and upstreams are correct, the certificate verifies against the CA, the key matches with permissions 600, `nginx -t` is OK, 8443 is free, and Backend B (10.7.26.0:3002) returns 200. Full output: `evidence/phase2/E-edge/rajdeep-standby-readiness.txt`.
- The standby nginx is **not started**. It waits for Rajat's go-ahead (Test 3).
- PF rule `config/firewall/backend-a.pf` created. `pfctl -vnf` dry run: `block drop in quick on en0 inet proto tcp from ! 10.7.2.253 to 10.7.12.140 port = 3001`, exit 0. **Not activated.** Output: `evidence/phase2/C-isolation/rajdeep-pf-prep.txt`.
- Checkpoint 0 re-captured to `evidence/phase2/checkpoint0-rajdeep.txt`.
- Results report: `docs/rajdeep-phase2-results.md`.

## R5: Standby nginx started (approved by Rajat, 21:22 IST)

Result: PASS. The standby is listening on `10.7.12.140:8443` (PID 80671). HTTPS through it returns 200 with `SSL certificate verify ok` (TLSv1.3, no `-k`). Six requests alternated between X-Backend A and B. `openssl s_client` gave `Verify return code: 0 (ok)`. Backend A is still up. Full output: `evidence/phase2/E-edge/rajdeep-standby-r5.txt`. The report is updated in `docs/rajdeep-phase2-results.md`.

## Test 1 baseline: main nginx (Anand, 10.7.2.253) before Backend A stops (run from Rajdeep's Mac)

```bash
$ for i in {1..6}; do curl -sS --noproxy '*' --cacert config/tls/team1-ca.crt --resolve app.team1.test:8443:10.7.2.253 -D - -o /dev/null https://app.team1.test:8443/api/status | grep -Ei '^HTTP/|^X-Backend:'; done | tee evidence/phase2/D-ha/rajat-before.txt
```

```text
HTTP/1.1 200 OK
X-Backend: B
HTTP/1.1 200 OK
X-Backend: A
HTTP/1.1 200 OK
X-Backend: B
HTTP/1.1 200 OK
X-Backend: A
HTTP/1.1 200 OK
X-Backend: B
HTTP/1.1 200 OK
X-Backend: A
[exit code: 0]
```

Note: this ran on Rajdeep's Mac, even though the file is named `rajat-before.txt`.

## Test 1 pre-check: Backend A and standby state before stop

```text
$ pwd
/Users/rajdeep/Desktop/cn-private-network-platform
$ git branch --show-current
phase2
$ mkdir -p evidence/phase2/D-ha
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    65675 rajdeep   15u  IPv4 0xc455927018858da9      0t0  TCP *:3001 (LISTEN)
$ curl --noproxy "*" -sS -i --max-time 10 http://10.7.12.140:3001/api/status 2>&1 | tee evidence/phase2/D-ha/rajdeep-backend-a-before.txt
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 16:12:07 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}
$ lsof -nP -iTCP:8443 -sTCP:LISTEN
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
nginx   80671 rajdeep    6u  IPv4 0xfe9e723d1ffe5b8a      0t0  TCP 10.7.12.140:8443 (LISTEN)
nginx   80672 rajdeep    6u  IPv4 0xfe9e723d1ffe5b8a      0t0  TCP 10.7.12.140:8443 (LISTEN)
```

## Test 1 (Signal 2): Backend A stopped

```text
# Test 1 / Extension D — stop Backend A — 2026-11-22 21:49:02 IST
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    65675 rajdeep   15u  IPv4 0xc455927018858da9      0t0  TCP *:3001 (LISTEN)
$ ps -o pid,command -p 65675
  PID COMMAND
65675 node backend/server.js
$ kill -TERM 65675
[exit 0]
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
nothing listening on 3001
$ curl --noproxy "*" -sS -i --max-time 3 http://10.7.12.140:3001/api/status
curl: (7) Failed to connect to 10.7.12.140 port 3001 after 5 ms: Couldn't connect to server

$ lsof -nP -iTCP:8443 -sTCP:LISTEN   (standby must stay up)
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
nginx   80671 rajdeep    6u  IPv4 0xfe9e723d1ffe5b8a      0t0  TCP 10.7.12.140:8443 (LISTEN)
nginx   80672 rajdeep    6u  IPv4 0xfe9e723d1ffe5b8a      0t0  TCP 10.7.12.140:8443 (LISTEN)
```

## Test 1 (Signal 2 restore): Backend A restarted

```text
# Test 1 / Extension D — restore Backend A — 2026-11-22 21:51:24 IST
$ BACKEND=A PORT=3001 node backend/server.js   (background, nohup, PID 96309)
Backend A listening on 0.0.0.0:3001
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    96309 rajdeep   15u  IPv4 0x93860391a8379c17      0t0  TCP *:3001 (LISTEN)
$ curl --noproxy "*" -sS -i --max-time 10 http://10.7.12.140:3001/api/status
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 16:21:24 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}
$ 6x via standby nginx (10.7.12.140:8443): HTTP + X-Backend
HTTP/1.1 200 OK X-Backend: B
HTTP/1.1 200 OK X-Backend: A
HTTP/1.1 200 OK X-Backend: B
HTTP/1.1 200 OK X-Backend: A
HTTP/1.1 200 OK X-Backend: B
HTTP/1.1 200 OK X-Backend: A

$ 6x via main nginx (10.7.2.253:8443): HTTP + X-Backend
HTTP/1.1 200 OK X-Backend: B
HTTP/1.1 200 OK X-Backend: B
HTTP/1.1 200 OK X-Backend: A
HTTP/1.1 200 OK X-Backend: B
HTTP/1.1 200 OK X-Backend: A
HTTP/1.1 200 OK X-Backend: B

$ grep upstream /tmp/cn-nginx-standby-error.log | tail -5   (standby saw A down?)
```

## Restart-A instruction (second copy): port already in use, so no duplicate was started

```text
# Restart-A instruction re-check — 2026-11-22 21:52:22 IST
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    96309 rajdeep   15u  IPv4 0x93860391a8379c17      0t0  TCP *:3001 (LISTEN)
$ curl -i http://10.7.12.140:3001/api/status
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 16:22:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}
```

## Status check: Backend A and standby nginx

```text
# Status check — 2026-11-22 22:00:39 IST
$ curl -i http://10.7.12.140:3001/api/status
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 16:30:39 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}
$ lsof -nP -iTCP:8443 -sTCP:LISTEN
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
nginx   80671 rajdeep    6u  IPv4 0xfe9e723d1ffe5b8a      0t0  TCP 10.7.12.140:8443 (LISTEN)
nginx   80672 rajdeep    6u  IPv4 0xfe9e723d1ffe5b8a      0t0  TCP 10.7.12.140:8443 (LISTEN)
```

## Signal 4 PREPARE (runbook section 1C), 23:37 IST

- 1C preflight: Backend A returns 200 (`backend_A_exit=0`). The standby is listening on `10.7.12.140:8443`. Standby HTTPS returns 200 with X-Backend B (`standby_curl_exit=0`). Saved to `evidence/phase2/E-edge/rajdeep-before-cutover.txt`.
- Extra checks: TLS verify ok (TLSv1.3); 6 requests through the standby gave B A B A B A; Backend B direct 200; `nginx -t` OK; key permissions 600 and git-ignored; PF untouched; Wi-Fi DNS automatic; both DNS servers still answer OLD `10.7.2.253` with TTL 30. Saved to `evidence/phase2/E-edge/rajdeep-signal4-preflight-extra.txt`.
- Nothing was changed. **Ready for Signal 4A.**

## Extension C: PF baseline before firewall test (23 Nov, 00:29 IST)

Read-only sudo capture saved to `evidence/phase2/C-isolation/pf-before.txt`. IP `10.7.12.140`. PF **Status: Disabled**, state table 0 entries. Rules: `scrub-anchor "com.apple/*" all fragment reassemble` and `anchor "com.apple/*" all`. Anchors: `com.apple` only. Nothing was changed.

## Extension C: candidate PF rules, dry-run syntax check (23 Nov)

File `evidence/phase2/C-isolation/rajdeep-pf-candidate.pf`:
```text
pass in quick on en0 proto tcp from 10.7.2.253 to 10.7.12.140 port 3001 keep state
block drop in quick on en0 proto tcp from any to 10.7.12.140 port 3001
```
`sudo pfctl -vnf` (dry run, nothing loaded; `-v` was added to print the parsed rules):
```text
pass in quick on en0 inet proto tcp from 10.7.2.253 to 10.7.12.140 port = 3001 flags S/SA keep state
block drop in quick on en0 inet proto tcp from any to 10.7.12.140 port = 3001
syntax_exit=0
```
After the check, PF status is still `Disabled`. Output: `evidence/phase2/C-isolation/rajdeep-pf-candidate-syntax.txt`.

## sudo cat /etc/pf.conf && pfctl -s info | grep Status (2026-11-23 00:38:19 IST)

```text
#
# Default PF configuration file.
#
# This file contains the main ruleset, which gets automatically loaded
# at startup.  PF will not be automatically enabled, however.  Instead,
# each component which utilizes PF is responsible for enabling and disabling
# PF via -E and -X as documented in pfctl(8).  That will ensure that PF
# is disabled only when the last enable reference is released.
#
# Care must be taken to ensure that the main ruleset does not get flushed,
# as the nested anchors rely on the anchor point defined here. In addition,
# to the anchors loaded by this file, some system services would dynamically 
# insert anchors into the main ruleset. These anchors will be added only when
# the system service is used and would removed on termination of the service.
#
# See pf.conf(5) for syntax.
#

#
# com.apple anchor point
#
scrub-anchor "com.apple/*"
nat-anchor "com.apple/*"
rdr-anchor "com.apple/*"
dummynet-anchor "com.apple/*"
anchor "com.apple/*"
load anchor "com.apple" from "/etc/pf.anchors/com.apple"
Status: Disabled                              Debug: Urgent
[exit code: 0]
```

## Extension C: anchor preflight (2026-11-23 00:44:35 IST)

Saved to `evidence/phase2/C-isolation/rajdeep-anchor-preflight.txt`.

```text
Mon Nov 23 00:44:35 IST 2026
=== PF STATUS ===
No ALTQ support in kernel
ALTQ related functions disabled
Status: Disabled                              Debug: Urgent
=== MAIN RULES ===
No ALTQ support in kernel
ALTQ related functions disabled
scrub-anchor "com.apple/*" all fragment reassemble
anchor "com.apple/*" all
=== APPLE CHILD ANCHORS ===
No ALTQ support in kernel
ALTQ related functions disabled
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
=== FIREWALL CANDIDATE ===
pass in quick on en0 proto tcp from 10.7.2.253 to 10.7.12.140 port 3001 keep state
block drop in quick on en0 proto tcp from any to 10.7.12.140 port 3001
=== SYNTAX CHECK ===
pfctl: Use of -f option, could result in flushing of rules
present in the main ruleset added by the system at startup.
See /etc/pf.conf for further details.

syntax_exit=0
```

## Extension C: check unused anchor com.apple/900.cn-phase2-a

Saved to `evidence/phase2/C-isolation/rajdeep-anchor-unused-check.txt`.

```text
Mon Nov 23 00:47:30 IST 2026
=== CHECK UNUSED ANCHOR ===
No ALTQ support in kernel
ALTQ related functions disabled
pfctl: DIOCGETRULES: Invalid argument
anchor_rules_exit=0
=== APPLE CHILD ANCHORS (after) ===
No ALTQ support in kernel
ALTQ related functions disabled
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
```

## Extension C: rules loaded into anchor com.apple/900.cn-phase2-a (PF still disabled)

Saved to `evidence/phase2/C-isolation/rajdeep-anchor-load.txt`. Undo: `sudo pfctl -a com.apple/900.cn-phase2-a -F rules`

```text
Mon Nov 23 00:48:11 IST 2026
$ pfctl -a com.apple/900.cn-phase2-a -f evidence/phase2/C-isolation/rajdeep-pf-candidate.pf
pfctl: Use of -f option, could result in flushing of rules
present in the main ruleset added by the system at startup.
See /etc/pf.conf for further details.

No ALTQ support in kernel
ALTQ related functions disabled
load_exit=0
$ pfctl -a com.apple/900.cn-phase2-a -sr
No ALTQ support in kernel
ALTQ related functions disabled
pass in quick on en0 inet proto tcp from 10.7.2.253 to 10.7.12.140 port = 3001 flags S/SA keep state
block drop in quick on en0 inet proto tcp from any to 10.7.12.140 port = 3001
$ pfctl -s info | grep Status:
No ALTQ support in kernel
ALTQ related functions disabled
Status: Disabled                              Debug: Urgent
$ pfctl -sr   (main ruleset must be unchanged)
No ALTQ support in kernel
ALTQ related functions disabled
scrub-anchor "com.apple/*" all fragment reassemble
anchor "com.apple/*" all
$ pfctl -a com.apple -s Anchors
No ALTQ support in kernel
ALTQ related functions disabled
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
  com.apple/900.cn-phase2-a
```

## Extension C: PF ENABLED (23 Nov, 00:49:54 IST)

```text
$ sudo pfctl -E
pf enabled
Token : 9529331583969757262
$ sudo pfctl -s info | grep Status:
Status: Enabled for 0 days 00:00:00           Debug: Urgent
$ sudo pfctl -a com.apple/900.cn-phase2-a -sr
pass in quick on en0 inet proto tcp from 10.7.2.253 to 10.7.12.140 port = 3001 flags S/SA keep state
block drop in quick on en0 inet proto tcp from any to 10.7.12.140 port = 3001
$ sudo pfctl -s References
84218    pfctl                        9529331583969757262      0 days 00:00:00
```

Post-enable checks from Rajdeep's own Mac: Backend A direct HTTP 200; through the standby, A B A B, all 200. Local traffic uses loopback (lo0), which the en0 rules do not filter, so this does **not** prove the block. Rajat (blocked) and Anand (allowed) must test from their Macs.

**TOKEN = 9529331583969757262** (saved in `evidence/phase2/C-isolation/rajdeep-pf-enable-token.txt`)
**Rollback:** `sudo pfctl -a com.apple/900.cn-phase2-a -F rules`, then `sudo pfctl -X 9529331583969757262`, then check that `sudo pfctl -s info | grep Status:` shows Disabled.

## Extension C: PF active, rule counters

Saved to `evidence/phase2/C-isolation/rajdeep-pf-active-counters.txt`.

```text
Mon Nov 23 00:52:48 IST 2026
=== PF STATUS ===
No ALTQ support in kernel
ALTQ related functions disabled
Status: Enabled for 0 days 00:02:54           Debug: Urgent
=== BACKEND A RULE COUNTERS ===
No ALTQ support in kernel
ALTQ related functions disabled
@0 pass in quick on en0 inet proto tcp from 10.7.2.253 to 10.7.12.140 port = 3001 flags S/SA keep state
  [ Owner : nil          Priority : 0     ]
  [ Evaluations: 22305     Packets: 24        Bytes: 2055        States: 2     ]
  [ Inserted: uid 0 pid 83391 ]
@1 block drop in quick on en0 inet proto tcp from any to 10.7.12.140 port = 3001
  [ Owner : nil          Priority : 0     ]
  [ Evaluations: 9227      Packets: 9         Bytes: 576         States: 0     ]
  [ Inserted: uid 0 pid 83391 ]
=== BACKEND A STILL HEALTHY ===
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0100    29    0    29    0     0  14023      0 --:--:-- --:--:-- --:--:-- 14500
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 19:22:48 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}
```

## Extension C: PF ROLLBACK

Saved to `evidence/phase2/C-isolation/rajdeep-pf-rollback.txt`.

```text
Mon Nov 23 00:56:41 IST 2026
=== REMOVE BACKEND A FIREWALL RULES ===
No ALTQ support in kernel
ALTQ related functions disabled
rules cleared
flush_exit=0
=== RELEASE PF TOKEN ===
No ALTQ support in kernel
ALTQ related functions disabled
pf disabled
release_exit=0
=== VERIFY PF STATUS ===
No ALTQ support in kernel
ALTQ related functions disabled
Status: Disabled for 0 days 00:00:00          Debug: Urgent
=== VERIFY ANCHOR CLEARED ===
No ALTQ support in kernel
ALTQ related functions disabled
=== EXTRA: MAIN RULES + APPLE ANCHORS + TOKENS ===
No ALTQ support in kernel
ALTQ related functions disabled
scrub-anchor "com.apple/*" all fragment reassemble
anchor "com.apple/*" all
No ALTQ support in kernel
ALTQ related functions disabled
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
  com.apple/900.cn-phase2-a
No ALTQ support in kernel
ALTQ related functions disabled
No pf starter references held
=== EXTRA: BACKEND A + STANDBY AFTER ROLLBACK ===
Backend A: HTTP 200
HTTP/1.1 200 OK X-Backend: A
$ diff /etc/pf.conf ~/cn-phase2-backups/pf.conf.before
pf.conf identical to backup
```

## Post-rollback re-check

```text
Mon Nov 23 00:58:37 IST 2026
$ pfctl -s info | grep Status:
Status: Disabled for 0 days 00:01:56          Debug: Urgent
$ pfctl -a com.apple/900.cn-phase2-a -sr
rules_exit=1
```

## Check anchor com.apple/900.cn-phase2-b on Rajdeep Mac

```text
Mon Nov 23 01:04:13 IST 2026
$ pfctl -a com.apple/900.cn-phase2-b -vvsr
pfctl: DIOCGETRULES: Invalid argument
exit=0
$ pfctl -a com.apple -s Anchors
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
  com.apple/900.cn-phase2-a
```

## Extension C (Omved's Backend B firewall): test from Rajdeep's Mac (23 Nov, 01:04:58 IST)

Saved to `evidence/phase2/C-isolation/rajdeep-backend-b-pf-active.txt`.
- Rajdeep to Backend B direct (`http://10.7.26.0:3002/api/status`): **HTTP 200, X-Backend: B**, `rajdeep_b_exit=0`.
- Standby HTTPS (`--resolve app.team1.test:8443:10.7.12.140`): **HTTP 200, X-Backend: B**, `standby_https_exit=0`.

Note: Rajdeep (10.7.12.140) is not Anand's edge (10.7.2.253). If Omved's rule matches Rajdeep's (allow only 10.7.2.253), this direct request should have been blocked. It was **not** blocked. Either Omved's PF is not active, or his rule also allows 10.7.12.140. Omved must confirm with `pfctl -s info` and the rule counters on his Mac.

## Extension F: Backend A diagnosis

Saved to `evidence/phase2/F-troubleshooting/rajdeep-backend-a-diagnosis.txt`.

```text
Mon Nov 23 01:15:48 IST 2026
=== MAC IP ===
10.7.12.140
=== PF STATUS ===
No ALTQ support in kernel
ALTQ related functions disabled
Status: Disabled for 0 days 00:19:07          Debug: Urgent
=== BACKEND A FIREWALL RULES ===
No ALTQ support in kernel
ALTQ related functions disabled
=== PORT 3001 LISTENER ===
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    96309 rajdeep   15u  IPv4 0x93860391a8379c17      0t0  TCP *:3001 (LISTEN)
=== LOCALHOST TEST ===
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0100    29    0    29    0     0    575      0 --:--:-- --:--:-- --:--:--   580
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 19:45:48 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}local_exit=0
=== LAN IP TEST ===
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0100    29    0    29    0     0    648      0 --:--:-- --:--:-- --:--:--   659
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 19:45:48 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}lan_exit=0
=== BACKEND SERVER PROCESSES ===
96309 node backend/server.js
```

## Final Backend A check

Saved to `evidence/phase2/F-troubleshooting/rajdeep-final-backend-check.txt`.

```text
Mon Nov 23 02:06:16 IST 2026
10.7.12.140
No ALTQ support in kernel
ALTQ related functions disabled
Status: Disabled for 0 days 01:09:35          Debug: Urgent
No ALTQ support in kernel
ALTQ related functions disabled
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    96309 rajdeep   15u  IPv4 0x93860391a8379c17      0t0  TCP *:3001 (LISTEN)
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0100    29    0    29    0     0   7696      0 --:--:-- --:--:-- --:--:--  9666
HTTP/1.1 200 OK
X-Backend: A
Content-Type: application/json
Cache-Control: public, max-age=60
Date: Sun, 22 Nov 2026 20:36:16 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"backend":"A","status":"ok"}
```

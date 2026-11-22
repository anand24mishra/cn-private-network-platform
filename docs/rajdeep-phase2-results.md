# Phase 2: Rajdeep's Results

**Machine:** Rajdeep's Mac. IP `10.7.12.140` on `en0` (Wi-Fi), netmask `255.255.224.0` (/19), gateway `10.7.0.1`.
**Role:** Backend A (TCP 3001), standby nginx edge (TCP 8443), PF firewall for Backend A.
**Repo:** `~/Desktop/cn-private-network-platform` (local branch `phase2`), contributed through branch `team/rajdeep-phase2-evidence`.
**Date:** 22–23 Nov 2026 (IST).
**Evidence location:** all of Rajdeep's raw evidence is under `evidence/phase2/teammates/rajdeep/`. Files were copied with their original timestamps. The full chronological console log is `evidence/phase2/teammates/rajdeep/rajdeep-console-log.md`.

This file records only commands that were actually run, with their real output. A step that has not run yet is marked **PENDING**, together with the team member it waits on. Evidence produced on other members' Macs is referenced, never copied in as if it came from here.

## Summary

| Step | Status | Evidence |
|---|---|---|
| Checkpoint 0: IP, subnet, reachability | PASS | `evidence/phase2/teammates/rajdeep/checkpoint0-rajdeep.txt` |
| Checkpoint 1.1: evidence folders | PASS | `evidence/phase2/teammates/rajdeep/{A..F}` exist |
| Checkpoint 1.2: PF backup and baseline | PASS | `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-prep.txt` |
| R1/R2: Backend A running | PASS | `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-standby-readiness.txt` |
| R3: TLS key received, matches certificate | PASS | same file |
| R4: `nginx-standby.conf` and `nginx -t` | PASS | same file |
| Old Phase 1 Homebrew nginx removed from 8443 | DONE | see "Issues found" |
| R5: start standby nginx and test HTTPS through it (approved by Rajat) | PASS | `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-standby-r5.txt` |
| Test 1 / Extension D: stop and restart Backend A | PASS (Rajdeep's part) | `evidence/phase2/teammates/rajdeep/D-ha/rajdeep-backend-a-{before,stopped,restored}.txt` |
| Signal 4 PREPARE (1C): standby and Backend A preflight | PASS | `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-before-cutover.txt`, `rajdeep-signal4-preflight-extra.txt` |
| Signal 4B/4C (Extension E): standby serves after DNS cutover | **Standby side observed**: access log shows a 200 for Anand's `10.7.2.253` at 00:09:15 IST, plus Rajat's remote tests. DNS cutover and Anand's normal-HTTPS proof are in Rajat's and Anand's evidence. | `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-standby-access-log.txt` |
| Extension C: PF rule prepared and dry-run validated | PASS (not activated) | `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-prep.txt` |
| Extension C: rules loaded into `com.apple/900.cn-phase2-a` (PF still disabled) | DONE | `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-anchor-load.txt` |
| Extension C: PF enabled (token 9529331583969757262) | DONE | `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-enable-token.txt` |
| Extension C: rule counters while active | PASS: pass rule 24 packets / 2 states from 10.7.2.253; block rule dropped 9 packets | `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-active-counters.txt` |
| Extension C: PF6 rollback | PASS: PF Disabled, no tokens, pf.conf identical to backup | `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-rollback.txt` |
| Extension C: PF5 remote outputs (Rajat blocked, Anand allowed) | On Rajat's and Anand's Macs, not here | their evidence files |
| Extension F: Backend A diagnosis and final check | PASS: PF disabled, listener on `*:3001`, 200 on loopback and LAN IP | `evidence/phase2/teammates/rajdeep/F-troubleshooting/` |
| End-of-session state (02:41 IST) | Backend A 200, standby HTTPS 200, primary DNS returns `10.7.2.253`, Wi-Fi DNS automatic. Anand's and Omved's Macs were unreachable (offline). | `evidence/phase2/teammates/rajdeep/final/rajdeep-final-state.txt` |

## Checkpoint 0 and 1

- The `en0` IP is `10.7.12.140`, which matches the roster. The netmask `0xffffe000` gives the range 10.7.0.0 to 10.7.31.255. All four team IPs fall in this one subnet, including Omved's `10.7.26.0`, which is a valid host address inside a /19.
- Ping to `10.7.10.96`, `10.7.2.253`, `10.7.12.140` and `10.7.26.0` showed 0% loss.
- Installed software: nginx 1.31.6 and Node v20.20.2.
- `/etc/pf.conf` is backed up to `~/cn-phase2-backups/pf.conf.before`. Before Phase 2, PF was **Disabled**. The only loaded rules were Apple's: `scrub-anchor "com.apple/*"` and `anchor "com.apple/*"`.

## Backend A (R1/R2)

Backend A was started with `BACKEND=A PORT=3001 node backend/server.js` (background process, PID 65675, log `/tmp/cn-backend-a.log`). It was stopped and restarted in Test 1, and its current PID is **96309**.

```text
$ curl -i http://10.7.12.140:3001/api/status
HTTP/1.1 200 OK
X-Backend: A
{"backend":"A","status":"ok"}

$ lsof -nP -iTCP:3001 -sTCP:LISTEN
node    65675 rajdeep   15u  IPv4 ...  TCP *:3001 (LISTEN)
```

## Standby nginx readiness (R3/R4)

Readiness check at 21:13 IST (full output in `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-standby-readiness.txt`):

- Listen address: `listen 10.7.12.140:8443 ssl;`
- Upstreams: `10.7.12.140:3001` and `10.7.26.0:3002`, both with `max_fails=1 fail_timeout=5s`. Failover uses `proxy_next_upstream error timeout http_502 http_503 http_504` and `proxy_next_upstream_tries 2`.
- Certificate: subject `CN=app.team1.test`, issued by `Team1 Local CA`, valid until 6 Jan 2029. SAN entries are `DNS:app.team1.test`, `DNS:api.team1.test` and `IP Address:10.253.140.31`.
- `openssl verify -CAfile config/tls/team1-ca.crt config/tls/team1-server.crt` printed `OK`.
- The private key's public key matches the certificate's public key. Key permissions are `-rw-------` (600). Git ignores the key through `.gitignore:8:*.key`.
- `nginx -t` printed `syntax is ok` and `test is successful`.
- Port 8443: nothing is listening.
- Backend B dependency: `curl http://10.7.26.0:3002/api/status` returned `200`, `X-Backend: B`.

## R5: Standby nginx started and HTTPS verified (21:22 IST, approved by Rajat)

Full output is in `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-standby-r5.txt`. DNS was not changed and PF was not enabled. Backend A stayed running throughout.

```text
$ nginx -p "$PWD/" -c "$PWD/config/nginx/nginx-standby.conf"
[exit 0]

$ lsof -nP -iTCP:8443 -sTCP:LISTEN
nginx   80671 rajdeep    6u  IPv4 ...  TCP 10.7.12.140:8443 (LISTEN)
nginx   80672 rajdeep    6u  IPv4 ...  TCP 10.7.12.140:8443 (LISTEN)

$ curl --noproxy "*" --cacert config/tls/team1-ca.crt \
    --resolve app.team1.test:8443:10.7.12.140 -i https://app.team1.test:8443/api/status
HTTP/1.1 200 OK
Server: nginx/1.31.6
X-Backend: A
{"backend":"A","status":"ok"}

$ curl -v ... (same request, TLS detail)
* Connected to app.team1.test (10.7.12.140) port 8443
* SSL connection using TLSv1.3 / AEAD-CHACHA20-POLY1305-SHA256
*  subject: C=IN; ST=Maharashtra; L=Dombivli; O=Team1; CN=app.team1.test
*  issuer: C=IN; ST=Maharashtra; L=Dombivli; O=Team1; CN=Team1 Local CA
*  SSL certificate verify ok.
< HTTP/1.1 200 OK

$ 6 requests through standby (HTTP status + X-Backend)
HTTP/1.1 200 OK X-Backend: A
HTTP/1.1 200 OK X-Backend: B
HTTP/1.1 200 OK X-Backend: A
HTTP/1.1 200 OK X-Backend: B
HTTP/1.1 200 OK X-Backend: A
HTTP/1.1 200 OK X-Backend: B

$ openssl s_client -connect 10.7.12.140:8443 -servername app.team1.test -CAfile config/tls/team1-ca.crt
Protocol: TLSv1.3
subject=C=IN, ST=Maharashtra, L=Dombivli, O=Team1, CN=app.team1.test
issuer=C=IN, ST=Maharashtra, L=Dombivli, O=Team1, CN=Team1 Local CA
Verify return code: 0 (ok)

$ curl -i http://10.7.12.140:3001/api/status
HTTP/1.1 200 OK
X-Backend: A
```

Result: **PASS.** The standby edge serves trusted HTTPS for `app.team1.test` without `-k`, and requests alternate between Backend A and Backend B.

The access log has one `400` entry with an empty request line. It comes from the `openssl s_client` handshake test, which opens a TLS connection and sends no HTTP request. It is expected and not an error.

These tests ran from Rajdeep's own Mac, which is why the access log shows the client as `10.7.12.140`. Rajat should repeat the same `--resolve` curl from his Mac (Test 3) to prove the standby is reachable from a remote machine.

Standby nginx is **left running** for Test 3 and the DNS cutover. To stop it: `nginx -s quit -p "$PWD/" -c "$PWD/config/nginx/nginx-standby.conf"`.

## Test 1 baseline: main nginx before Backend A stops (21:2x IST)

This ran from **Rajdeep's Mac** against Anand's main nginx (`--resolve app.team1.test:8443:10.7.2.253`). It was saved as `evidence/phase2/teammates/rajdeep/D-ha/rajat-before.txt`, using the file name given in the instruction.

```text
HTTP/1.1 200 OK  X-Backend: B
HTTP/1.1 200 OK  X-Backend: A
HTTP/1.1 200 OK  X-Backend: B
HTTP/1.1 200 OK  X-Backend: A
HTTP/1.1 200 OK  X-Backend: B
HTTP/1.1 200 OK  X-Backend: A
```

Result: **PASS.** The main edge returns 200 and balances across A and B before the failure is injected.

## Test 1 pre-check: Backend A before stop (21:42 IST)

Full output is in `evidence/phase2/teammates/rajdeep/D-ha/rajdeep-backend-a-before.txt`.

```text
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
node    65675 rajdeep   15u  IPv4 ...  TCP *:3001 (LISTEN)
$ curl --noproxy '*' -sS -i --max-time 10 http://10.7.12.140:3001/api/status
HTTP/1.1 200 OK
X-Backend: A
{"backend":"A","status":"ok"}
$ lsof -nP -iTCP:8443 -sTCP:LISTEN
nginx   80671 rajdeep    6u  IPv4 ...  TCP 10.7.12.140:8443 (LISTEN)
```

Result: Backend A is up (PID 65675), and the standby nginx is still listening on `10.7.12.140:8443`.

## Test 1 (Signal 2 from Rajat): Backend A stopped (21:49 IST)

Full output is in `evidence/phase2/teammates/rajdeep/D-ha/rajdeep-backend-a-stopped.txt`.

```text
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
node    65675 rajdeep   15u  IPv4 ...  TCP *:3001 (LISTEN)
$ ps -o pid,command -p 65675
65675 node backend/server.js
$ kill -TERM 65675
[exit 0]
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
nothing listening on 3001
$ curl --noproxy '*' -sS -i --max-time 3 http://10.7.12.140:3001/api/status
curl: (7) Failed to connect to 10.7.12.140 port 3001 after 5 ms: Couldn't connect to server
$ lsof -nP -iTCP:8443 -sTCP:LISTEN
nginx   80671 rajdeep    6u  IPv4 ...  TCP 10.7.12.140:8443 (LISTEN)
```

Result: Backend A is down (connection refused), and the standby nginx is still up. Before the kill, the PID was checked to be `node backend/server.js`. Backend A stays down until Rajat gives the restore signal.

## Test 1 (restore signal from Rajat): Backend A restarted (21:51 IST)

Full output is in `evidence/phase2/teammates/rajdeep/D-ha/rajdeep-backend-a-restored.txt`.

```text
$ BACKEND=A PORT=3001 node backend/server.js   (background, PID 96309)
Backend A listening on 0.0.0.0:3001
$ lsof -nP -iTCP:3001 -sTCP:LISTEN
node    96309 rajdeep   15u  IPv4 ...  TCP *:3001 (LISTEN)
$ curl --noproxy '*' -sS -i --max-time 10 http://10.7.12.140:3001/api/status
HTTP/1.1 200 OK
X-Backend: A
{"backend":"A","status":"ok"}

6x via standby nginx (10.7.12.140:8443): B A B A B A   (all 200)
6x via main nginx    (10.7.2.253:8443):  B B A B A B   (all 200)
```

Result: **PASS.** Backend A is back (new PID 96309) and returns 200 with `X-Backend: A`. Both edges serve A again.

The main-nginx run shows `B B` at the start. With round-robin, other clients' requests (for example Rajat's verification loop) take turns too, so a strict A/B pattern is not guaranteed from a single client's view. A appears again, which shows it rejoined the pool.

The standby error log has no upstream errors, because no traffic went through the standby while A was down.

Rajat reported 10/10 successful requests through the main nginx while A was down, all served by B. That is his evidence to save, not output from this Mac.

## Signal 4 (Extensions B + E): PREPARE, runbook section 1C (23:37 IST)

The runbook is `CN_Phase2_Signal4_TTL_Edge_Migration_Runbook.md`. Only Rajdeep's section 1C was run, and everything run was read-only. No DNS record changed, no service was stopped or restarted, no Wi-Fi DNS edit was made, and PF is untouched.

### 1C preflight, as written in the runbook

Saved to `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-before-cutover.txt`.

```text
Sun Nov 22 23:37:41 IST 2026
HTTP/1.1 200 OK
X-Backend: A
{"backend":"A","status":"ok"}backend_A_exit=0
nginx   80671 rajdeep    6u  IPv4 ...  TCP 10.7.12.140:8443 (LISTEN)
HTTP/1.1 200 OK
Server: nginx/1.31.6
X-Backend: B
{"backend":"B","status":"ok"}standby_curl_exit=0
```

### Extra read-only checks

Saved to `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-signal4-preflight-extra.txt`.

| Check | Result |
|---|---|
| Standby TLS (`curl -v`, no `-k`) | PASS: connected to `10.7.12.140:8443`, TLSv1.3, `CN=app.team1.test`, issuer `Team1 Local CA`, `SSL certificate verify ok`, HTTP 200 |
| 6 requests through the standby | PASS: B A B A B A, all 200 |
| Backend B direct (`10.7.26.0:3002`) | PASS: HTTP 200 |
| Processes | standby nginx master PID 80671 (`-c .../config/nginx/nginx-standby.conf`); Backend A PID 96309 (`node backend/server.js`) |
| `nginx -t` on the standby config | PASS: syntax ok, test successful; listens `10.7.12.140:8443`; upstreams `10.7.12.140:3001`, `10.7.26.0:3002` |
| Private key | permissions 600, ignored by git (`.gitignore:8:*.key`), not modified |
| PF | `cn_phase2` absent from `/etc/pf.conf`; only `com.apple` in `/etc/pf.anchors/` (not activated) |
| Rajdeep's Wi-Fi DNS | `There aren't any DNS Servers set on Wi-Fi.` (automatic, unchanged) |
| Current DNS answers (pre-cutover) | `@10.7.10.96` and `@10.7.26.0`, app and api: all `30 IN A 10.7.2.253` (OLD, TTL 30), as expected before Signal 4B |
| Git | untracked only: `config/firewall/`, `config/nginx/nginx-standby.conf`, `docs/rajdeep-phase2-results.md`, `evidence/phase2/teammates/rajdeep/`; nothing committed |

**PREPARE status: PASS.** Rajdeep's Mac is **HTTPS READY** for Signal 4A.

During Signals 4B and 4C, Rajdeep keeps the standby nginx and Backend A up and watches `/tmp/cn-nginx-standby-access.log`. A request from Anand's IP `10.7.2.253` in that log is standby-side proof that migrated clients reach this edge.

## Extension F: Backend A diagnosis from Rajdeep's Mac (23 Nov 2026, 01:15:48 IST)

Saved to `evidence/phase2/teammates/rajdeep/F-troubleshooting/rajdeep-backend-a-diagnosis.txt`. The runbook's original folder is `F-fault/`; `F-troubleshooting/` was used as instructed.

| Layer | Check | Result |
|---|---|---|
| Host | `ipconfig getifaddr en0` | `10.7.12.140` |
| Firewall | `pfctl -s info` | `Status: Disabled for 0 days 00:19:07` |
| Firewall | `pfctl -a com.apple/900.cn-phase2-a -sr` | no rules |
| Listener | `lsof -iTCP:3001 -sTCP:LISTEN` | `node 96309 ... TCP *:3001 (LISTEN)` |
| HTTP (loopback) | `curl http://127.0.0.1:3001/api/status` | 200, `X-Backend: A`, `local_exit=0` |
| HTTP (LAN IP) | `curl http://10.7.12.140:3001/api/status` | 200, `X-Backend: A`, `lan_exit=0` |
| Process | `pgrep -lf 'node.*backend/server.js'` | `96309 node backend/server.js` (exactly one instance) |

Result: from Rajdeep's Mac, Backend A is **healthy** at every layer checked. No firewall rule is in the way, the process is listening on all interfaces, and it answers on both loopback and the LAN IP.

If a remote client still cannot reach `10.7.12.140:3001`, the fault is outside this host: the client's route or Wi-Fi isolation, or that client's own firewall. The next check is `nc -vz 10.7.12.140 3001`, run from that client.

## Final Backend A check

Saved to `evidence/phase2/teammates/rajdeep/F-troubleshooting/rajdeep-final-backend-check.txt`. It checks the IP, PF status, that the anchor is empty, the 3001 listener and a loopback HTTP request. See the evidence file for the raw output.

## Firewall preparation (Extension C), not activated

Rule file `config/firewall/backend-a.pf`:

```text
block in quick on en0 inet proto tcp from ! 10.7.2.253 to 10.7.12.140 port 3001
```

The rule was validated with a dry run, which loads nothing:

```text
$ pfctl -vnf config/firewall/backend-a.pf
block drop in quick on en0 inet proto tcp from ! 10.7.2.253 to 10.7.12.140 port = 3001
[exit 0]
```

As a control, a deliberately broken rule (`port 30o1`) was rejected with `unknown port 30o1` and exit code 1. This shows the dry run really parses the rule.

The `cn_phase2` anchor is **not** installed in `/etc/pf.conf`, and nothing has been loaded into PF.

### PF baseline immediately before the firewall test (23 Nov 2026, 00:29 IST)

Read-only sudo capture, saved to `evidence/phase2/teammates/rajdeep/C-isolation/pf-before.txt`:

```text
=== MAC IP ===
10.7.12.140
=== PF STATUS ===
Status: Disabled                              Debug: Urgent
  current entries                        0
=== CURRENT PF RULES ===
scrub-anchor "com.apple/*" all fragment reassemble
anchor "com.apple/*" all
=== EXISTING PF ANCHORS ===
  com.apple
```

This matches the 1.2 baseline from 22 Nov: PF is disabled, only Apple's anchors are present, and there is no `cn_phase2` anchor.

### Candidate two-rule PF set, dry-run validated (23 Nov 2026)

File `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-candidate.pf`. Output is in `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-candidate-syntax.txt`.

```text
$ sudo pfctl -vnf evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-candidate.pf
pass in quick on en0 inet proto tcp from 10.7.2.253 to 10.7.12.140 port = 3001 flags S/SA keep state
block drop in quick on en0 inet proto tcp from any to 10.7.12.140 port = 3001
syntax_exit=0
```

Result: syntax **PASS**. With `-n`, nothing was loaded, and PF is still `Disabled` afterwards. This set does the same thing as `config/firewall/backend-a.pf`: it allows `10.7.2.253` and blocks every other source on 3001. It does so with an explicit pass rule followed by a block.

**Warning:** at activation, load this file **only into an anchor** (`pfctl -a <anchor> -f ...`). Running `pfctl -f` on it directly would replace the main ruleset, including Apple's anchors.

### Anchor preflight (23 Nov 2026, 00:44 IST)

Read-only sudo capture plus a dry-run syntax check. Saved to `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-anchor-preflight.txt`.

```text
=== PF STATUS ===
Status: Disabled                              Debug: Urgent
=== MAIN RULES ===
scrub-anchor "com.apple/*" all fragment reassemble
anchor "com.apple/*" all
=== APPLE CHILD ANCHORS ===
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
=== FIREWALL CANDIDATE ===
pass in quick on en0 proto tcp from 10.7.2.253 to 10.7.12.140 port 3001 keep state
block drop in quick on en0 proto tcp from any to 10.7.12.140 port 3001
=== SYNTAX CHECK ===
syntax_exit=0
```

Finding: macOS has added two child anchors at runtime, `com.apple/200.AirDrop` and `com.apple/250.ApplicationFirewall`. Neither appears in `/etc/pf.conf`. This confirms the risk noted in the activation plan: a reload with `pfctl -f /etc/pf.conf` (runbook PF4) could flush these system-inserted anchors.

Loading the candidate into a new child anchor (for example `com.apple/cn_phase2`) would leave them untouched. It also needs no edit to `/etc/pf.conf`.

### Planned anchor name is unused (23 Nov 2026, 00:47 IST)

Saved to `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-anchor-unused-check.txt`.

```text
$ sudo pfctl -a com.apple/900.cn-phase2-a -sr
pfctl: DIOCGETRULES: Invalid argument
$ sudo pfctl -a com.apple -s Anchors
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
```

`DIOCGETRULES: Invalid argument` is what PF returns for an anchor that does not exist. The name `com.apple/900.cn-phase2-a` is free, and the query did not create it: the child-anchor list is unchanged.

The `900.` prefix sorts after `200.` and `250.`, so this anchor is evaluated after Apple's anchors. The rules use `quick` and only match TCP port 3001, so they do not interfere with AirDrop or the Application Firewall.

### Rules loaded into anchor `com.apple/900.cn-phase2-a`, PF still disabled (23 Nov 2026, 00:48 IST)

Saved to `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-anchor-load.txt`.

```text
$ sudo pfctl -a com.apple/900.cn-phase2-a -f evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-candidate.pf
load_exit=0
$ sudo pfctl -a com.apple/900.cn-phase2-a -sr
pass in quick on en0 inet proto tcp from 10.7.2.253 to 10.7.12.140 port = 3001 flags S/SA keep state
block drop in quick on en0 inet proto tcp from any to 10.7.12.140 port = 3001
$ sudo pfctl -s info | grep Status:
Status: Disabled
$ sudo pfctl -sr          (main ruleset unchanged)
scrub-anchor "com.apple/*" all fragment reassemble
anchor "com.apple/*" all
$ sudo pfctl -a com.apple -s Anchors
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
  com.apple/900.cn-phase2-a
```

Result: the rules are **staged but not enforcing**, because PF is still `Disabled`. Apple's anchors and the main ruleset are intact, `/etc/pf.conf` was not edited, and Backend A still answers 200.

- **To enforce (needs Rajat's firewall GO):** `sudo pfctl -E`. Record the token it prints.
- **Rollback:** `sudo pfctl -a com.apple/900.cn-phase2-a -F rules`, then `sudo pfctl -X <token>` if `-E` was used.

### PF enabled: firewall rule now enforcing (23 Nov 2026, 00:49:54 IST)

The token is saved to `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-enable-token.txt`.

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

Local checks after enabling: Backend A direct gives HTTP 200, and 4 requests through the standby gave A B A B, all 200.

These local requests travel over loopback (`lo0`), and the rules only filter `en0`. So the local checks show that the standby edge keeps working. They do **not** show the block itself.

**PENDING (PF5):**
- Rajat: `curl --connect-timeout 3 http://10.7.12.140:3001/api/status` must fail or time out.
- Anand: the same command must return 200.

**Rollback (PF6):**
1. `sudo pfctl -a com.apple/900.cn-phase2-a -F rules`
2. `sudo pfctl -X 9529331583969757262`
3. Check that `Status: Disabled` is shown.

### PF active: rule counters (23 Nov 2026, 00:52:48 IST, about 3 minutes after enable)

Saved to `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-active-counters.txt`.

```text
Status: Enabled for 0 days 00:02:54
@0 pass in quick on en0 inet proto tcp from 10.7.2.253 to 10.7.12.140 port = 3001 flags S/SA keep state
  [ Evaluations: 22305     Packets: 24        Bytes: 2055        States: 2     ]
@1 block drop in quick on en0 inet proto tcp from any to 10.7.12.140 port = 3001
  [ Evaluations: 9227      Packets: 9         Bytes: 576         States: 0     ]
=== BACKEND A STILL HEALTHY ===   (curl http://127.0.0.1:3001/api/status)
HTTP/1.1 200 OK
X-Backend: A
{"backend":"A","status":"ok"}
```

What the counters show, seen from Rajdeep's Mac:

- **Pass rule (@0):** 24 packets and 2 states were created for `10.7.2.253`. Anand's edge has made allowed TCP connections to port 3001 since PF was enabled.
- **Block rule (@1):** 9 packets (576 bytes) were dropped, from a source other than `10.7.2.253`. That is consistent with repeated SYN attempts from a blocked client, such as Rajat's PF5 test. The counters do not record the source IP, so who sent them must come from the PF5 outputs on Rajat's and Anand's Macs.
- `Evaluations` counts every packet checked against the anchor, not only port 3001 traffic.
- Backend A on loopback: 200. `lo0` is not filtered.

### PF6 rollback (23 Nov 2026, 00:56:41 IST)

Saved to `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-rollback.txt`.

```text
$ sudo pfctl -a com.apple/900.cn-phase2-a -F rules
rules cleared
flush_exit=0
$ sudo pfctl -X 9529331583969757262
pf disabled
release_exit=0
$ sudo pfctl -s info | grep Status:
Status: Disabled for 0 days 00:00:00
$ sudo pfctl -a com.apple/900.cn-phase2-a -sr
(no rules)
$ sudo pfctl -sr
scrub-anchor "com.apple/*" all fragment reassemble
anchor "com.apple/*" all
$ sudo pfctl -a com.apple -s Anchors
  com.apple/200.AirDrop
  com.apple/250.ApplicationFirewall
  com.apple/900.cn-phase2-a
$ sudo pfctl -s References
No pf starter references held
Backend A: HTTP 200
Standby: HTTP/1.1 200 OK X-Backend: A
$ diff /etc/pf.conf ~/cn-phase2-backups/pf.conf.before
pf.conf identical to backup
```

Result: **ROLLBACK PASS.** PF is back to `Disabled`, and no enable tokens are still held. The main ruleset and Apple's anchors match the pre-test baseline, and `/etc/pf.conf` is byte-for-byte identical to the backup. Backend A and the standby edge both still return 200.

The anchor name `com.apple/900.cn-phase2-a` still shows in the anchor list, but it is **empty** and PF is disabled, so it has no effect. macOS clears it on the next reboot.

### Omved's Backend B firewall: test from Rajdeep's Mac (23 Nov 2026, 01:04:58 IST)

Saved to `evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-backend-b-pf-active.txt`.

```text
=== RAJDEEP TO BACKEND B ===
HTTP/1.1 200 OK
X-Backend: B
{"backend":"B","status":"ok"}rajdeep_b_exit=0
=== STANDBY NGINX HTTPS ===
HTTP/1.1 200 OK
X-Backend: B
{"backend":"B","status":"ok"}standby_https_exit=0
```

Result: Rajdeep's Mac (`10.7.12.140`) **reached Backend B directly**, with HTTP 200. The standby edge also reached B.

If Omved's rule were active and matched Rajdeep's design (allow only `10.7.2.253`), the direct request should have been blocked. Either Omved's PF was not enabled at 01:04:58, or his rule also allows `10.7.12.140`.

**Not determined from this Mac.** Omved's own `pfctl -s info` and rule counters must settle it. This is not marked as an isolation PASS or FAIL for Backend B.

### Original activation plan (superseded)

The actual activation used the child anchor `com.apple/900.cn-phase2-a` and the two-rule candidate set, as recorded above. `/etc/pf.conf` was never edited. The plan below is kept for history.

#### Activation plan (needs approval and the sudo password dialog; only after Tests D/A/E/B)

The runbook's method is PF3 + PF4:

```bash
sudo cp config/firewall/backend-a.pf /etc/pf.anchors/cn_phase2
sudo cp /etc/pf.conf "$HOME/cn-phase2-backups/pf.conf.before"
# append: anchor "cn_phase2" + load anchor "cn_phase2" from "/etc/pf.anchors/cn_phase2"
sudo pfctl -nf /etc/pf.conf      # must pass before the next line
sudo pfctl -f /etc/pf.conf
sudo pfctl -E                    # RECORD the token it prints
sudo pfctl -a cn_phase2 -sr
```

PF4 has a risk. `pfctl -f /etc/pf.conf` reloads the main ruleset, and macOS warns that this can flush rules that system services added at runtime.

A less invasive alternative needs team agreement before use. Load the rule into a child anchor that the existing `anchor "com.apple/*"` already evaluates, so `/etc/pf.conf` is never edited:

```bash
sudo pfctl -a com.apple/cn_phase2 -f config/firewall/backend-a.pf
sudo pfctl -E                    # RECORD the token
sudo pfctl -a com.apple/cn_phase2 -sr
```

### Rollback

1. Runbook method: `sudo cp ~/cn-phase2-backups/pf.conf.before /etc/pf.conf`, then `sudo pfctl -nf /etc/pf.conf`, then `sudo pfctl -f /etc/pf.conf`, then `sudo pfctl -a cn_phase2 -F rules`. Alternative method: `sudo pfctl -a com.apple/cn_phase2 -F rules`.
2. PF was Disabled before the exercise, so release **only our own** enable reference with `sudo pfctl -X <token from pfctl -E>`. Do not run a global `pfctl -d`.
3. Check with `sudo pfctl -s info | head -3`, which should show `Status: Disabled`. Then confirm `curl http://10.7.12.140:3001/api/status` returns 200 from Anand's Mac.

## Issues found

1. **Certificate paths in the runbook (R4/N2).** nginx resolves relative `ssl_certificate` paths against the config file's folder (`config/nginx/`), not the `-p` prefix. Anand found this first. `nginx-standby.conf` therefore uses `../tls/team1-server.crt` and `../tls/team1-server.key`.
2. **Old Phase 1 nginx occupied port 8443.** A Homebrew service (`sh.brew.nginx`, running since 17 Nov) listened on `*:8443` using `/opt/homebrew/etc/nginx/nginx.conf`. It still had the old upstreams `10.253.140.169:3001` and `10.253.140.1:3002` and certificates from `~/cn-project/certs/`. It would have answered for 10.7.12.140:8443 with errors and blocked R5. As the runbook's N3 note directs, it was stopped with `brew services stop nginx`. Afterwards, `lsof` showed nothing on 8443 and no nginx process was running. To restore it: `brew services start nginx`.
3. **Certificate SAN contains an old IP (`10.253.140.31`).** This is harmless, because all tests use the hostname `app.team1.test` through `--resolve` or DNS. A test against a bare IP such as `https://10.7.12.140:8443` would fail hostname validation, and that failure would be expected.
4. **Ordering dependency.** After Omved's Backend B rule is active, only `10.7.2.253` can reach `10.7.26.0:3002`. The standby edge at `10.7.12.140` would lose Backend B. Extension C must therefore run after the standby demo (Test 3 through Test 7), which is the order the runbook already uses.

## Standby-side evidence of DNS migration (Extension E)

`/tmp/cn-nginx-standby-access.log` was copied unchanged to `evidence/phase2/teammates/rajdeep/E-edge/rajdeep-standby-access-log.txt`. Requests by client IP:

```text
  18 10.7.10.96    (Rajat: remote --resolve tests from 21:26 IST onward)
  29 10.7.12.140   (Rajdeep: local tests)
   1 10.7.2.253    (Anand: 23/Nov/2026:00:09:15 +0530 "GET /api/status" 200)
```

The single request from Anand's Mac reached the standby edge and got a 200, which fits the Signal 4C window. This log does not show whether Anand used normal DNS or `--resolve`. That proof is in Anand's `anand-https-after-cutover`/`anand-standby-https` evidence.

## Restoration (end of session)

Snapshot at 02:41 IST, read-only. Saved to `evidence/phase2/teammates/rajdeep/final/rajdeep-final-state.txt`.

| Item | State |
|---|---|
| Backend A | Running, PID 96309; `curl http://10.7.12.140:3001/api/status` gives 200, `X-Backend: A` |
| Standby nginx | Still running on `10.7.12.140:8443` (PID 80671), as the Signal 4 runbook says ("Rajdeep leaves standby nginx running unless the leader requests a separate shutdown"); HTTPS 200 with trusted CA, no `-k`. To stop: `nginx -s quit -p "$PWD/" -c "$PWD/config/nginx/nginx-standby.conf"` |
| PF | Disabled, anchor `com.apple/900.cn-phase2-a` empty, no tokens held, `/etc/pf.conf` identical to backup (02:06 IST check and 00:56 rollback) |
| Rajdeep's Wi-Fi DNS | `There aren't any DNS Servers set on Wi-Fi.` (automatic; J4 was never applied on this Mac) |
| Primary DNS `10.7.10.96` | app and api resolve to `10.7.2.253` (restored) |
| Backup DNS `10.7.26.0` | No answer at 02:41: `connection timed out`. Omved's Mac did not answer ping (100% loss), so it was offline. Restoration proof is in Omved's own evidence. |
| Main edge `10.7.2.253:8443` | No answer at 02:41: `Connection timed out`; ping 100% loss, so Anand's Mac was offline. Restoration proof is in Anand's own evidence. |
| Old Phase 1 Homebrew nginx | Still stopped (`brew services` state `none`). To re-enable if ever needed: `brew services start nginx` |
| Private key | `config/tls/team1-server.key` stays local only (mode 600, ignored by git), and is **not** in this contribution |

Because Backend B was unreachable at 02:41, the standby served `X-Backend: A` only at that time. That is expected passive failover, not a fault on this Mac.

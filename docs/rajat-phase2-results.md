# Rajat’s Phase 2 results

## R0 and R1

[Timestamped preflight and command exits](../evidence/phase2/network-baseline/rajat-preflight-20261122-211724.txt)

- **R0 PASS** — The local branch is `phase2`, the Git index has no unmerged entries, and both diff checks passed. The staged DNS resolution and other preparation edits are present. Rollback was unnecessary for these read-only checks.
- **R1 configuration PASS** — `dnsmasq --test` passed. The config listens on `10.7.10.96:53` on `en0`. Both names point to `10.7.2.253` with `local-ttl=30`.
- **R1 sandboxed network checks BLOCKED** — macOS and sandbox restrictions prevented the network and process queries. ICMP send errors in the log do not establish packet loss on the LAN. The [existing baseline](../evidence/phase2/network-baseline/README.md) records Rajat’s earlier `/19`, gateway `10.7.0.1`, and successful ping sample.

- **R1 live LAN PASS** — The read-only retry at 21:18 IST confirmed `en0` at `10.7.10.96`, mask `255.255.224.0`, and gateway `10.7.0.1`. All four destinations returned 3/3 ping replies from Rajat’s Mac. Average RTTs in inventory order were 0.693, 32.492, 33.908, and 37.878 ms. See the [live network log](../evidence/phase2/network-baseline/rajat-network-20261122-211850.txt).
- **R2 existing service check FAIL** — No port 53 listener or dnsmasq process was visible to the current account. Both direct DNS queries timed out (exit 9). A successful config syntax check does not establish a running service.

- **R2 startup attempt BLOCKED** — After Rajat approved startup, `sudo -n /opt/homebrew/sbin/dnsmasq --no-daemon --conf-file="$PWD/config/dnsmasq/primary.conf"` exited 1 with `sudo: a password is required`. Startup requires interactive sudo in Rajat’s Terminal. The attempt did not launch dnsmasq.

- **R2 live primary DNS PASS** — Rajat started dnsmasq in a dedicated foreground Terminal. His initial queries timed out. The 21:23 IST retry found the process running with the repository config, and both names returned `10.7.2.253` with TTL 30 over UDP. The app record also passed over TCP. The initial timeout's cause was undetermined. See the [DNS diagnosis log](../evidence/phase2/network-baseline/rajat-dns-diagnosis-20261122-212338.txt). Stop this instance using Ctrl+C in the dedicated Terminal when the coordinated test calls for it.
- **R3 backend HTTP and edge TLS PASS** — Both direct backends returned HTTP 200. Four certificate-validated HTTPS requests with the edge pinned returned HTTP 200 and showed both backend identities. **R3 normal client DNS BLOCKED** — The ordinary HTTPS request exited 6 because the macOS resolver could not resolve `app.team1.test`. See the [R3 log](../evidence/phase2/network-baseline/rajat-r3-20261122-212353.txt).

## Acceptance and restoration

| Runbook step | Status | Required observation and restoration |
|---|---|---|
| R2 Primary DNS | PASS | Foreground instance is running. Both names returned the expected address and TTL. |
| R3 Phase 1 live baseline | PARTIAL | Backend HTTP and trusted edge HTTPS passed. Normal client DNS awaits an approved temporary resolver test. |
| R4 D — Backend HA | BLOCKED | Capture the A/B baseline, B-only responses during the coordinated A outage, and A/B after Rajdeep restores A. |
| R5 A — Backup DNS | BLOCKED | Confirm both resolvers and the client’s resolver setup. With team readiness and approval, stop only Rajat’s primary, verify normal client HTTPS via backup, then restart the primary and verify both records. |
| R6 B — TTL and E — Edge migration | BLOCKED | Confirm standby HTTPS, both resolvers, cache readiness, and approval. Capture old cached and new direct answers and observed TTL, then restore both DNS records to Anand on both resolvers and prove trusted HTTPS on the original edge. |
| R7 C — Isolation | BLOCKED | After cutover restoration, capture Rajat’s denied direct connections alongside Anand’s successful upstream and HTTPS checks. Backend owners restore their agreed firewall state. |
| R8 F — Fault diagnosis | BLOCKED | Wait for a real faculty-injected fault. Record the affected layer, symptoms, fix, and proof of recovery. |
| R9 Final acceptance | BLOCKED | All six extensions require live evidence. Teammate results are pending. |

Rajat started the primary DNS manually. No cutover was attempted. The runbook contains the commands for the gated tests. Add timestamped command results and restoration evidence as each test runs.

## 22 November 2026 readiness retest

| Check | Status | Evidence and interpretation |
|---|---|---|
| Temporary macOS resolver and restoration | BLOCKED | Both `/etc/resolver` and `/etc/resolver/team1.test` were absent (`ls` exit 1). Approved `sudo -n -v` exited 1 with `sudo: a password is required`. No resolver was created. The recorded `scutil --dns` baseline has no scoped team resolver. |
| Primary and backup DNS | PASS | Both resolvers answered both hostnames with `10.7.2.253`, TTL 30, and dig exit 0. Direct queries establish agreement. Client failover remains untested. |
| Anand main nginx | PASS | Initial certificate-validated HTTPS returned HTTP 200. All six repeat requests exited 0, returned HTTP 200, and alternated B/A. curl pinned the hostname to `10.7.2.253`. |
| Normal macOS DNS-based HTTPS | BLOCKED | Baseline `dscacheutil` exited 0 with no host result. Ordinary curl exited 6 with “Could not resolve host”. The approved scoped test needs interactive sudo on Rajat’s Mac. |
| Rajdeep standby nginx | PASS | TCP port 8443 responded. The initial certificate-validated HTTPS request and all six repeats exited 0 and returned HTTP 200. Repeat requests alternated B/A. The standby was reached by pinning `10.7.12.140`; both DNS servers continued to return Anand’s IP during readiness checks. |

The [main edge and DNS log](../evidence/phase2/network-baseline/rajat-readiness-20261122-212600.txt) and [standby edge and macOS resolver log](../evidence/phase2/E-edge/rajat-standby-20261122-212617.txt) contain exact commands, timestamps, outputs, and exit codes.

| Signal | Readiness |
|---|---|
| 2 — Backend HA | Baseline passed. Coordinate with Rajdeep, Omved, and Anand and obtain the explicit execution signal. |
| 3 — Backup DNS | Both resolvers agree. Pending Anand’s dual-resolver client setup and team readiness to stop and restore primary DNS. |
| 4 — TTL and migration | Both edges passed trusted HTTPS. Pending Anand’s primed cache forwarder, Omved’s synchronized record changes, and agreement on cutover and rollback. |
| 5 — PF isolation | Pending approved backend-owner PF rules and completion and restoration of migration. |
| 6 — Troubleshooting | Pending a real faculty-injected fault and restoration verification. |

### Separate normal DNS-based HTTPS repeat

At 21:35:36 IST, macOS returned no host entry for `app.team1.test` and
`/etc/resolver/team1.test` was absent. The separate certificate-verifying
HTTPS request through the system resolver exited 6 before connecting.
**BLOCKED** pending the interactive scoped resolver test on Rajat’s Mac.
[Exact command and output](../evidence/phase2/network-baseline/rajat-normal-https-repeat-20261122-213536.txt)

Full end-to-end Phase 2 completion remains unverified. A passing repeat must
show a connection to `10.7.2.253:8443`, certificate verification, HTTP 200,
and a backend identifier using ordinary macOS DNS.

### Subsequent normal HTTPS and Signal 3 evidence

- **Normal DNS-based HTTPS PASS on Rajat’s Mac at 21:36 IST.** With the
  temporary scoped resolver, ordinary curl connected to `10.7.2.253:8443`,
  verified the certificate, returned HTTP 200 with `X-Backend: B`, and exited
  0. Cleanup removed the resolver and recorded the restored DNS state.
  [Rajat’s system DNS evidence](../evidence/phase2/network-baseline/rajat-system-dns-20261122-213623.txt)
- **Signal 3 client HTTPS PASS in Anand’s supplied terminal transcript.**
  The 22:12 baseline and 22:15 run after the shown cache-flush commands
  both connected to `10.7.2.253:8443` through ordinary hostname lookup,
  verified TLS, returned HTTP 200 with `X-Backend: A`, and exited 0.
  The separately reported 22:16 run included a primary timeout and a
  direct backup answer of `10.7.2.253` with TTL 30. Its HTTPS request
  may have used a cached answer. The Anand evidence files named in the
  handoff were not present in this checkout.
- **Omved’s supplied packet excerpt confirms traffic from Anand
  (`10.7.2.253`) to the backup resolver (`10.7.26.0:53`).** The excerpt
  shows other domains. Project hostname traffic for the HTTPS run still
  needs a matching capture or resolver log before attributing that
  request’s DNS answer to Omved.
- **Signal 3 restoration pending verification.** Rajat’s direct
  queries for both project names still timed out at 22:19 IST.
  [Primary DNS recheck](../evidence/phase2/A-backup-dns/rajat-primary-recheck-20261122-221959.txt)

Full Phase 2 acceptance remains open.

## Signal 4 PREPARE — Rajat’s Mac, 22 November 2026

- **PASS — Git and running primary DNS.** No unmerged paths. Both diff checks passed. Process 17088 was running foreground dnsmasq with the repository’s exact `config/dnsmasq/primary.conf` path. Before backup, the config showed listener `10.7.10.96`, both project records at `10.7.2.253`, and TTL 30. The syntax check passed.
- **PASS — Live DNS.** Both resolvers answered both names over UDP with `10.7.2.253` and TTL 30. Both also returned the expected app record over TCP.
- **PASS — Backends and edges.** Direct Backend A and B requests returned HTTP 200. Both nginx edges each returned four HTTP 200 responses through certificate-verified HTTPS, with both backend identities observed on each. These requests pinned each edge and did not test ordinary macOS DNS.
- **PASS — Rollback backup.** Copied the primary config without overwriting an existing file to `/Users/rajat/cn-phase2-backups/primary-before-signal4.conf`. The exact content comparison exited 0 and mode, owner/group, and modification time matched.
- **READY for coordinated 4A staging on Rajat’s Mac.** The 4A team gate remains pending explicit approval to stage the two records, Omved’s staging confirmation, and Anand’s positive-TTL cache confirmation. No record was edited and no daemon was restarted. Cutover was not executed.

[Preflight commands and outputs](../evidence/phase2/E-edge/rajat-prepare-20261122-233804.zWvCm2) · [Rollback backup verification](../evidence/phase2/B-ttl/rajat-primary-backup-20261122-233858.DkKyDh)

## Signal 4 outcome — 23 November 2026

**Extension E (standby edge migration) — PASS.** The result combines Rajat’s
local command logs with Anand’s client-side results relayed by Rajat.

| Source | Verified outcome |
|---|---|
| Rajat’s Mac, 00:05:24 IST | Primary DNS (`10.7.10.96`) and backup DNS (`10.7.26.0`) both returned `10.7.12.140` with TTL 30 for `app.team1.test` and `api.team1.test`. [Cutover DNS output](../evidence/phase2/E-edge/rajat-cutover-dns-verified.txt) |
| Anand’s Mac, teammate result relayed by Rajat | During cutover, normal DNS-based HTTPS connected to `10.7.12.140:8443`, verified TLS, and returned HTTP 200. |
| Rajat’s Mac, 00:23:12 IST | After rollback, both DNS servers returned `10.7.2.253` with TTL 30 for both names. [Rollback DNS output](../evidence/phase2/E-edge/rajat-after-rollback.txt) |
| Anand’s Mac, teammate result relayed by Rajat | After rollback, normal DNS-based HTTPS again reached `10.7.2.253:8443` with verified TLS and HTTP 200. Anand restored automatic Wi-Fi DNS and stopped his temporary caching resolver. |
| Rajat’s Mac, 00:26:25 IST | Both DNS servers still returned the restored address. Direct checks of Backend A and Backend B each returned HTTP 200 with the expected backend identifier. [Final health output](../evidence/phase2/E-edge/rajat-final-health.txt) |

Anand’s raw client logs are not present in this checkout. The normal HTTPS
and client-restoration results above are teammate results relayed by Rajat.

**Extension B (DNS TTL and cache) — PARTIAL PASS.** Rajat’s direct DNS
queries confirmed a 30-second advertised TTL at cutover and after rollback.
Anand demonstrated caching and the TTL countdown on his temporary resolver,
as relayed by Rajat. The test did not capture the cached IP transitioning
from `10.7.2.253` to `10.7.12.140` after the authoritative DNS change.

## Final integration outcome

The earlier status tables and Signal 4 partial TTL result record the state at those checkpoints. Anand’s later isolated probe used cache port 5533 and upstream port 1053. The cache retained `10.7.12.140` with a decreasing TTL after the upstream switched to `10.7.2.253`, and eventually refreshed to `10.7.2.253`. **Extension B passed in the isolated follow-up.** [Cache change](../evidence/phase2/B-ttl/anand-final-cache-change-proof.txt) · [Expiry](../evidence/phase2/B-ttl/anand-cache-expiry-final-proof.txt)

Anand’s raw [standby HTTPS](../evidence/phase2/E-edge/anand-standby-https.txt), [main edge restoration](../evidence/phase2/E-edge/anand-original-edge-restored.txt), and [client restoration](../evidence/phase2/E-edge/anand-client-restored.txt) logs are now integrated. Rajat’s separately [recorded final check](../evidence/phase2/final/rajat-all-services-restored.txt) shows both DNS servers restored and all four HTTP/HTTPS services healthy at 02:25:45 IST on 23 November. See the [final report](phase2-final-report.md) for all six extensions and the remaining PR #1 evidence gap.

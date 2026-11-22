# Private Network Service Platform — Phase 2 final report

Rajat, Anand, Rajdeep, and Omved built and tested a private service platform across four Macs. Phase 1 established LAN connectivity, private DNS, trusted HTTPS, HTTP caching, and reverse-proxy load balancing. Phase 2 tested DNS failover, DNS caching, backend isolation and availability, standby edge migration, and fault recovery. See the [evidence index](../evidence/phase2/README.md) for the terminal records and their provenance.

## Topology and responsibilities

| Member | Service | Address and protocol |
|---|---|---|
| Rajat | Team integration, primary dnsmasq and cutover coordination | `10.7.10.96:53` DNS over UDP/TCP |
| Anand | Main nginx, client checks, and isolated cache tests | `10.7.2.253:8443` HTTPS, local DNS cache `127.0.0.1:5533` |
| Rajdeep | Backend A, standby nginx and Backend A firewall tests | `10.7.12.140:3001` HTTP, `10.7.12.140:8443` HTTPS |
| Omved | Backup DNS, Backend B and Backend B firewall tests | `10.7.26.0:53` DNS over UDP/TCP, `10.7.26.0:3002` HTTP |

Clients resolve `app.team1.test` and `api.team1.test` to the active edge, then open a separate HTTPS connection. nginx terminates TLS using a certificate trusted through the project CA and proxies HTTP to the two Node.js backends. Both DNS servers normally return Anand’s address with TTL 30. Rajat verified `10.7.0.0/19` on his Mac. See the [machine inventory](machine-inventory.md).

## Test method and results

The team captured baseline, fault or cutover, and recovery outputs from the relevant Macs. Direct DNS queries identify the answering resolver, ordinary HTTPS exercises client DNS and TLS, and pinned HTTPS isolates edge behavior. Backend identifiers and PF counters distinguish successful upstream requests from denied direct client traffic.

| Extension | Result | Observed behavior |
|---|---|---|
| A — DNS failover | PASS in lab | During the primary outage, Anand observed the backup resolver answering and successful HTTPS. The primary was restored. [Outage](../evidence/phase2/A-backup-dns/anand-final-primary-down.txt), [primary restored](../evidence/phase2/A-backup-dns/rajat-after-restore.txt), [Omved’s outage log](../evidence/phase2/teammates/omved/A-backup-dns/omved-primary-down.txt), [backup restored](../evidence/phase2/teammates/omved/final/omved-backup-dns-restored.txt) |
| B — TTL and caching | PASS in isolated lab | The original migration checkpoint captured a countdown only. In the later `ttl-probe.team1.test` experiment, the cache on 5533 retained `10.7.12.140` at TTL 22 and 21 while the upstream on 1053 returned `10.7.2.253`. After expiry the cache returned `10.7.2.253` at TTL 30, then 14 after 16 seconds. [Divergence](../evidence/phase2/B-ttl/anand-final-cache-change-proof.txt), [refresh](../evidence/phase2/B-ttl/anand-cache-expiry-final-proof.txt) |
| C — Firewall isolation | PASS in lab | Rajat’s direct requests were blocked while Anand’s allowed requests succeeded. Rajdeep’s PF rollback shows Disabled and Backend A healthy. On Omved’s Mac, the experimental rules were cleared, the PF enable reference was released, and PF returned to Disabled. Backend B later returned HTTP 200 on localhost and the LAN. [Allowed A](../evidence/phase2/C-isolation/anand-backend-a-pf-active.txt), [allowed B](../evidence/phase2/C-isolation/anand-backend-b-pf-active.txt), [A rollback](../evidence/phase2/teammates/rajdeep/C-isolation/rajdeep-pf-rollback.txt), [B rollback](../evidence/phase2/teammates/omved/C-isolation/omved-pf-rollback.txt), [B health](../evidence/phase2/teammates/omved/F-troubleshooting/omved-backend-b-restored.txt) |
| D — Backend availability | PASS in lab | A and B served baseline responses. During the planned A outage B continued serving. A returned after restart. [Baseline](../evidence/phase2/D-ha/rajat-before.txt), [outage](../evidence/phase2/D-ha/rajat-a-stopped.txt), [recovery](../evidence/phase2/D-ha/rajat-after-recovery.txt) |
| E — Standby migration | PASS in lab | Both DNS servers switched both names to Rajdeep’s edge. Anand’s normal HTTPS verified TLS and returned HTTP 200 there and again at the original edge after DNS rollback. Anand’s client DNS was restored to automatic. [Cutover](../evidence/phase2/E-edge/rajat-cutover-dns-verified.txt), [standby](../evidence/phase2/E-edge/anand-standby-https.txt), [rollback](../evidence/phase2/E-edge/rajat-after-rollback.txt), [main](../evidence/phase2/E-edge/anand-original-edge-restored.txt), [client](../evidence/phase2/E-edge/anand-client-restored.txt) |
| F — Troubleshooting | PASS in lab | The team separated DNS resolution and edge HTTPS from backend reachability, identified the missing Backend A service at port 3001, then verified service recovery. [Fault](../evidence/phase2/F-troubleshooting/rajat-port-fault-diagnosis.txt), [backend diagnosis](../evidence/phase2/teammates/rajdeep/F-troubleshooting/rajdeep-backend-a-diagnosis.txt), [recovery](../evidence/phase2/F-troubleshooting/rajat-final-recovery.txt) |

## Final health and limitations

Rajat’s recorded check at 02:25:45 IST on 23 November 2026 showed both DNS servers returning the original address with TTL 30, both backends returning HTTP 200, and both HTTPS edges returning HTTP 200. These results are recorded lab observations. Integration review did not rerun the production services on teammates’ Macs. [Final verification](../evidence/phase2/final/rajat-all-services-restored.txt)

Client fallback depends on resolver behavior and cutover can leave clients using the previous edge until cache expiry. The isolated TTL result uses a test record and isolated ports. Role-specific nginx configurations require local certificate and key paths. PR #5 integrated Omved’s [backup DNS configuration](../config/dnsmasq/backup.conf) and project evidence. PR #1 was closed and its broad packet capture and unrelated DNS transcripts were excluded from the integration history.

The experiments demonstrate all six Phase 2 behaviors, including owner-side PF rollback on both backends. Earlier incomplete attempts remain in [Rajat’s results](rajat-phase2-results.md).

# Phase 2 evidence index

Dates are 22–23 November 2026, IST. Raw logs retain their recorded timestamps, including HTTP dates in GMT.

| Extension | Producer and recording time | Evidence |
|---|---|---|
| A — DNS failover | Anand, Rajat, and Omved, 22 November outage and 23 November restoration | [Client during outage](A-backup-dns/anand-final-primary-down.txt), [client DNS restoration](A-backup-dns/anand-dns-restored.txt), [primary restoration](A-backup-dns/rajat-after-restore.txt), [backup during outage](teammates/omved/A-backup-dns/omved-primary-down.txt), [backup restored](teammates/omved/final/omved-backup-dns-restored.txt) |
| B — TTL | Anand, 23 November 01:48 and 01:50 | [Cache and upstream diverge](B-ttl/anand-final-cache-change-proof.txt), [cache refresh and countdown](B-ttl/anand-cache-expiry-final-proof.txt) |
| C — Isolation | Rajat, Anand, Rajdeep, and Omved, 23 November isolation session | [Rajat blocked on A](C-isolation/rajat-backend-a-pf-active.txt), [Rajat blocked on B](C-isolation/rajat-backend-b-pf-active-retest.txt), [Anand allowed on A](C-isolation/anand-backend-a-pf-active.txt), [Anand allowed on B](C-isolation/anand-backend-b-pf-active.txt), [A counters](teammates/rajdeep/C-isolation/rajdeep-pf-active-counters.txt), [A rollback](teammates/rajdeep/C-isolation/rajdeep-pf-rollback.txt), [B counters](teammates/omved/C-isolation/omved-pf-active-counters.txt), [B rollback at 01:07](teammates/omved/C-isolation/omved-pf-rollback.txt), [B restored health at 02:19](teammates/omved/F-troubleshooting/omved-backend-b-restored.txt) |
| D — Backend HA | Rajat and Rajdeep, 22 November outage session | [Before](D-ha/rajat-before.txt), [A stopped](D-ha/rajat-a-stopped.txt), [A restored](D-ha/rajat-after-recovery.txt), [Backend A process recovery](teammates/rajdeep/D-ha/rajdeep-backend-a-restored.txt) |
| E — Edge migration | Rajat and Anand, 23 November 00:05–00:26 | [Both DNS servers cut over](E-edge/rajat-cutover-dns-verified.txt), [standby HTTPS](E-edge/anand-standby-https.txt), [DNS rollback](E-edge/rajat-after-rollback.txt), [main HTTPS restored](E-edge/anand-original-edge-restored.txt), [client restoration](E-edge/anand-client-restored.txt) |
| F — Troubleshooting | Rajat and Rajdeep, 23 November diagnosis and recovery | [Port diagnosis](F-troubleshooting/rajat-port-fault-diagnosis.txt), [Backend A diagnosis](teammates/rajdeep/F-troubleshooting/rajdeep-backend-a-diagnosis.txt), [recovery](F-troubleshooting/rajat-final-recovery.txt) |
| Final health | Rajat, 23 November 02:25:45 | [Both resolvers, backends and edges](final/rajat-all-services-restored.txt) |

See the [final report](../../docs/phase2-final-report.md) for evidence limits and the integration history.

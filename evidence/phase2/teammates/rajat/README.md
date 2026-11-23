# Rajat’s Phase 2 contributions

Rajat operated primary DNS at `10.7.10.96:53`, coordinated the DNS cutover and rollback, and recorded client-side availability, isolation, troubleshooting, and final recovery checks.

| Contribution | Recorded evidence |
|---|---|
| Primary DNS and restoration | [Primary configuration](../../../../config/dnsmasq/primary.conf), [DNS restoration](../../A-backup-dns/rajat-after-restore.txt) |
| Isolated TTL experiment | [Rajat’s upstream switch](../../B-ttl/rajat-final-switch-proof.txt) and [Anand’s cache observation](../../B-ttl/anand-final-cache-change-proof.txt) |
| Backend isolation | [Direct access to A blocked](../../C-isolation/rajat-backend-a-pf-active.txt), [direct access to B blocked on retest](../../C-isolation/rajat-backend-b-pf-active-retest.txt) |
| Backend availability | [Baseline](../../D-ha/rajat-before.txt), [Backend A outage](../../D-ha/rajat-a-stopped.txt), [recovery](../../D-ha/rajat-after-recovery.txt) |
| Standby edge migration | [DNS cutover](../../E-edge/rajat-cutover-dns-verified.txt), [DNS rollback](../../E-edge/rajat-after-rollback.txt) |
| Troubleshooting and recovery | [Wrong-port diagnosis](../../F-troubleshooting/rajat-port-fault-diagnosis.txt), [final service checks](../../final/rajat-all-services-restored.txt) |

See [Rajat’s full Phase 2 results](../../../../docs/rajat-phase2-results.md) for commands, observations, and limitations.

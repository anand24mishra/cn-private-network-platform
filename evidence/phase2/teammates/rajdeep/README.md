# Rajdeep's Phase 2 Evidence

**Machine:** Rajdeep's Mac, `10.7.12.140` (en0 Wi-Fi, /19, gateway `10.7.0.1`).
**Roles:** Backend A (`10.7.12.140:3001`), standby nginx HTTPS edge (`10.7.12.140:8443`), PF isolation for Backend A.
**When:** 22 Nov 2026, 20:57 IST, to 23 Nov 2026, 02:42 IST.

Every file here is raw terminal output captured on Rajdeep's Mac, copied with its original modification time. The full narrative, with PASS/FAIL per step, is in [`docs/rajdeep-phase2-results.md`](../../../../docs/rajdeep-phase2-results.md). The chronological console log of every command is in [`rajdeep-console-log.md`](rajdeep-console-log.md); the evidence paths written inside that log are the original local paths, before the move into `teammates/rajdeep/`.

## Results at a glance

| Extension | Rajdeep's part | Result | Evidence |
|---|---|---|---|
| Checkpoint 0/1 | IP, subnet, reachability, PF backup | PASS | `checkpoint0-rajdeep.txt`, `C-isolation/rajdeep-pf-prep.txt` |
| D: HA | Backend A baseline, then stop (Signal 2), then restart | PASS: A refused while down; A returns 200 after restart; A/B balancing resumes on both edges | `D-ha/rajdeep-backend-a-before.txt`, `-stopped.txt`, `-restored.txt` |
| D: HA | Main-edge baseline (6× 200, A/B alternating) | PASS | `D-ha/rajat-before.txt` (**run on Rajdeep's Mac**; file name was given in the instruction) |
| E: Standby edge | Readiness: cert verify, key/cert match, `nginx -t` | PASS | `E-edge/rajdeep-standby-readiness.txt` |
| E: Standby edge | R5 start, trusted HTTPS (TLSv1.3, no `-k`), A/B through standby | PASS | `E-edge/rajdeep-standby-r5.txt` |
| E: Standby edge | Signal 4 preflight (section 1C) | PASS | `E-edge/rajdeep-before-cutover.txt`, `E-edge/rajdeep-signal4-preflight-extra.txt` |
| E: Standby edge | Standby-side request log: Rajat's remote tests; Anand `10.7.2.253` at 00:09:15 got 200 | Observed | `E-edge/rajdeep-standby-access-log.txt` |
| C: Isolation | Baseline, candidate rules, dry-run, anchor preflight | PASS | `C-isolation/pf-before.txt`, `rajdeep-pf-candidate*.{pf,txt}`, `rajdeep-anchor-preflight.txt`, `rajdeep-anchor-unused-check.txt` |
| C: Isolation | Load into `com.apple/900.cn-phase2-a`, then `pfctl -E` | DONE | `C-isolation/rajdeep-anchor-load.txt`, `rajdeep-pf-enable-token.txt` |
| C: Isolation | Rule counters while active: pass 24 packets / 2 states from `10.7.2.253`; block dropped 9 packets | PASS (host side) | `C-isolation/rajdeep-pf-active-counters.txt` |
| C: Isolation | Rollback: rules flushed, token released, PF Disabled, `/etc/pf.conf` identical to backup | PASS | `C-isolation/rajdeep-pf-rollback.txt` |
| C: Isolation | Rajdeep to Omved's Backend B while "PF active": **not blocked** (200) | **Undetermined**: Omved's PF state must settle it | `C-isolation/rajdeep-backend-b-pf-active.txt` |
| F: Troubleshooting | Backend A layer check: PF off, listener, loopback and LAN 200 | PASS | `F-troubleshooting/rajdeep-backend-a-diagnosis.txt`, `rajdeep-final-backend-check.txt` |
| Final | End-of-session snapshot | Rajdeep's services healthy; Anand's and Omved's Macs offline at 02:41 | `final/rajdeep-final-state.txt` |

## Notes

- **PF method.** The runbook's PF4 step (`pfctl -f /etc/pf.conf`) was not used. macOS had added runtime anchors (`com.apple/200.AirDrop`, `com.apple/250.ApplicationFirewall`) that such a reload could flush. The rules went into the child anchor `com.apple/900.cn-phase2-a` instead, so `/etc/pf.conf` was never edited.
- **Loopback.** Local curls to `10.7.12.140:3001` travel over `lo0` and are not filtered by the `en0` rules. The block itself is proven by the rule counters here and by Rajat's and Anand's PF5 outputs on their own Macs.
- **PF token.** `rajdeep-pf-enable-token.txt` records the PF enable reference. It is not a secret, and it was released during rollback.
- **Not included.** The TLS private key (`config/tls/team1-server.key`) stays on Rajdeep's Mac only.

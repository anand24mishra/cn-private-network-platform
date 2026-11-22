# Omved's Phase 2 Evidence

**Contributor:** Omved Nagre  
**Node IP:** `10.7.26.0`  
**Recorded:** 2026-11-22 / 2026-11-23 IST

> **Note:** This is a scrubbed replacement for a previous contribution (PR #1) which
> contained full packet captures and unrelated third-party DNS traffic. All files here
> contain only project-relevant data and have passed a credential and privacy scan.

---

## Included Files

| Folder | File | Contents |
|---|---|---|
| `config/dnsmasq/` | `backup.conf` | Backup DNS config: port 53 on `10.7.26.0`, resolves `app.team1.test` and `api.team1.test` → `10.7.2.253`, TTL 30 s, forwards public DNS to `8.8.8.8` |
| `A-backup-dns/` | `omved-before.txt` | Pre-outage baseline: backup DNS resolving both hostnames; Backend B HTTP 200 |
| `A-backup-dns/` | `omved-primary-down.txt` | Failover proof: primary (`10.7.10.96`) timed out (`exit=9`); backup (`10.7.26.0`) answered NOERROR in 7 ms for both `app` and `api` hostnames |
| `A-backup-dns/` | `omved-project-dns-packets.txt` | 13 tcpdump lines — `app.team1.test` A/AAAA queries to `10.7.26.0:53`; project-only traffic |
| `C-isolation/` | `pf-before.txt` | PF disabled baseline with full state-table and counter dump |
| `C-isolation/` | `pf-staging-inspection.txt` | `/etc/pf.conf` reviewed; PF still Disabled before rules applied |
| `C-isolation/` | `omved-anchor-preflight.txt` | Backend B listener confirmed (node `*:3002`); firewall candidate syntax-check exit=0 |
| `C-isolation/` | `omved-pf-candidate.pf` | PF ruleset: allow port 3002 from `10.7.2.253` and `10.7.12.140`; block all others |
| `C-isolation/` | `omved-pf-enable-token.txt` | First PF enable token (kernel session handle) |
| `C-isolation/` | `omved-pf-enable-token-final.txt` | Final PF enable token |
| `C-isolation/` | `omved-pf-active-counters.txt` | PF state counters while isolation anchor `com.apple/900.cn-phase2-b` was active |
| `C-isolation/` | `omved-backend-b-healthy.txt` | Backend B HTTP 200 (local + LAN) while PF isolation was active |
| `C-isolation/` | `omved-pf-rollback.txt` | Rollback: rules cleared (`flush_exit=0`), PF disabled (`release_exit=0`), only Apple system anchors remain |
| `D-ha/` | `omved-backend-b-before.txt` | HTTP 200 / `X-Backend: B` pre-outage baseline |
| `F-troubleshooting/` | `omved-backend-b-restart.txt` | Backend B restart confirmation (`listening on 0.0.0.0:3002`) |
| `F-troubleshooting/` | `omved-backend-b-restored.txt` | Backend B restored: node PID 13690 on `*:3002`; HTTP 200 on localhost and LAN at 02:19 IST 23 Nov |
| `final/` | `omved-backup-dns-diagnosis.txt` | Pre-restore check: dnsmasq not running, dig timed out — failure history preserved |
| `final/` | `omved-backup-dns-restored.txt` | Final restored state: dnsmasq PID 15774, port 53 bound, `app` + `api` → `10.7.2.253`; Backend B still healthy |
| `final/` | `rajat-restored-health.txt` | Cross-teammate snapshot: primary DNS, Backend A, main HTTPS all HTTP 200 |

---

## Explicitly Excluded from This Contribution

| File | Reason |
|---|---|
| `signal3-backup-dns.pcap` | Binary packet capture containing third-party DNS queries — excluded from public repo |
| `omved-client-dns-summary.txt` | 2,041 lines; ~733 lines of unrelated third-party DNS traffic (chatgpt.com, brave.com, Azure, etc.) |
| `omved-client-dns-traffic.txt` | 2,521 lines; ~868 lines of unrelated third-party DNS traffic |
| `omved-backend-b-diagnosis.txt` | `ps aux \| grep node` output exposed personal application paths (Adobe CC, ChatGPT, Codex, Expo/StyleMate project directories) |

---

## Rollback Verification (`omved-pf-rollback.txt`)

The rollback log demonstrates all four required states:

1. ✅ **PF experimental rules cleared** — `rules cleared`, `flush_exit=0`
2. ✅ **PF enable token released** — `pf disabled`, `release_exit=0`
3. ✅ **PF status: Disabled** — `Status: Disabled for 0 days 00:00:00`
4. ✅ **Backend B HTTP 200** — confirmed in `omved-backend-b-restored.txt` (`local_exit=0`, `lan_exit=0`)

---

## Evidence Gaps

| Gap | Reason |
|---|---|
| HTTPS load-balancing | nginx ran on Rajat's node — see `evidence/phase2/E-edge/` |
| TTL-switching (Signal 4a/4b) | Covered by Rajat's `evidence/phase2/B-ttl/` |
| Backend A | Not Omved's node — Rajat's `D-ha/` covers it |

# Omved's Phase 2 Evidence

**Contributor:** Omved Nagre  
**Node IP:** `10.7.26.0`  
**Recorded:** 2026-11-22 / 2026-11-23 IST  
**Backup DNS PID at time of restoration:** 15774 (historical — not a permanent identifier)

---

## Summary

This folder contains Omved's local evidence for Phase 2 of the CN Private Network Platform project. All files are genuine captures from Omved's machine (`10.7.26.0`) during the Phase 2 session on 22–23 November 2026.

---

## Folder Layout

| Folder | Contents |
|---|---|
| `A-backup-dns/` | Backup DNS startup, pre-outage baseline, failover during primary outage, project DNS packet captures, client DNS traffic log, pcap |
| `C-isolation/` | PF firewall baseline, staging inspection, anchor preflight, backend-B diagnosis & health, PF candidate rules, enable tokens, active counters, rollback |
| `D-ha/` | Backend B pre-HA baseline (HTTP 200 before outage) |
| `F-troubleshooting/` | Backend B restart log, restored state verification |
| `final/` | Backup DNS diagnosis (pre-restore), final restored state (`omved-backup-dns-restored.txt`, `omved-backend-b-restored.txt` via `F-troubleshooting/`), Rajat's shared restoration snapshot |

---

## Key Evidence Points

### A — Backup DNS (`10.7.26.0:53`)
- **Config:** `config/dnsmasq/backup.conf` — listens on `10.7.26.0:53`, resolves both `app.team1.test` and `api.team1.test` → `10.7.2.253`, TTL 30 s
- **Pre-outage (`omved-before.txt`):** Backup DNS already up and resolving correctly; Backend B returning HTTP 200
- **During primary outage (`omved-primary-down.txt`):** Primary DNS (`10.7.10.96`) timed out; backup answered both hostnames correctly with NOERROR, 7 ms response time
- **Resolution verification:** `app.team1.test → 10.7.2.253` (TTL 30 IN A), `api.team1.test → 10.7.2.253` (TTL 30 IN A)
- **Packet captures:** `omved-project-dns-packets.txt` — project hostname queries against backup DNS; `signal3-backup-dns.pcap` — full pcap; `omved-client-dns-traffic.txt` — real client traffic forwarded through backup DNS

### C — PF Firewall Isolation
- **Baseline (`pf-before.txt`):** PF disabled pre-experiment; only Apple system anchors present
- **Staging (`pf-staging-inspection.txt`):** System `/etc/pf.conf` reviewed; PF still disabled before rules applied
- **Candidate rules (`omved-pf-candidate.pf`):** Allow port 3002 from `10.7.2.253` and `10.7.12.140`; block all others
- **Preflight (`omved-anchor-preflight.txt`):** Backend B confirmed listening (node PID 57757 on `*:3002`); syntax check exit=0
- **Active (`omved-pf-active-counters.txt`, `omved-pf-enable-token*.txt`):** PF enabled with anchor `com.apple/900.cn-phase2-b`; Backend B healthy under firewall
- **Rollback (`omved-pf-rollback.txt`):** Rules cleared (`flush_exit=0`), PF disabled (`release_exit=0`); only Apple anchors remain

### D — HA / Backend B Baseline
- **`omved-backend-b-before.txt`:** HTTP 200, `X-Backend: B`, `{"backend":"B","status":"ok"}` at session start

### F — Troubleshooting / Restoration
- **`omved-backend-b-restart.txt`:** Backend B restarted, confirmed listening on `0.0.0.0:3002`
- **`omved-backend-b-restored.txt`:** Node PID 13690 on `*:3002`; HTTP 200 from both localhost and LAN (`10.7.26.0:3002`) at 2026-11-23 02:19 IST

### Final State
- **`omved-backup-dns-diagnosis.txt`:** Pre-restore check — dnsmasq not running, dig timed out
- **`omved-backup-dns-restored.txt`:** dnsmasq PID 15774 running; both records verified (`app` + `api` → `10.7.2.253`); Backend B still healthy
- **`rajat-restored-health.txt`:** Cross-verified by Rajat — primary DNS healthy, Backend A HTTP 200, main HTTPS 200

---

## Configuration File

**`config/dnsmasq/backup.conf`** (Omved's machine-specific backup DNS config):
- Port 53, interface `en0`, listen-address `10.7.26.0`
- Resolves project hostnames to `10.7.2.253` with TTL 30 s
- Forwards public DNS to `8.8.8.8`
- Logs to `/tmp/cn-dnsmasq-backup.log`

> **Note:** This is Omved's local backup DNS config. The team's shared primary DNS config is `config/dnsmasq/primary.conf` (Rajat's node) and is not modified here.

---

## What Is Not Included

- No HTTPS load-balancing captures from Omved's node (nginx ran on Rajat's node; Rajat's `E-edge/` evidence covers this)
- No TTL-switching evidence (Rajat's `B-ttl/` covers Signal 4a/4b)
- Failed-test history preserved: `omved-backup-dns-diagnosis.txt` records the state before restoration (dnsmasq not yet running)

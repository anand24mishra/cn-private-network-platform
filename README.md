# Private Network Service Platform

Computer Networks Course Project — Phase 1 and Phase 2

## Team

- Anand
- Rajat
- Rajdeep
- Omved

## Phase 1

- Task A — Private LAN
- Task B — Private DNS
- Task C — Backend Services
- Task D — Reverse Proxy + Load Balancing
- Task E — HTTPS / TLS
- Task F — HTTP Caching
- Task G — Complete Protocol Flow + Packet Analysis

## Architecture

The client queries Rajat's primary DNS (`10.7.10.96:53`) for
`app.team1.test` or `api.team1.test`. DNS returns Anand's edge IP
(`10.7.2.253`). The client then makes a separate HTTPS connection to
Anand's nginx edge on port `8443`. nginx proxies the request to
Rajdeep's Backend A (`10.7.12.140:3001`) or Omved's Backend B
(`10.7.26.0:3002`).

## Phase 2

The service configurations now use the team's current `10.7.x.x` addresses.
Rajat verified the `10.7.0.0/19` network and the `10.7.0.1` default gateway
on his Mac. The subnet masks, gateways, and MAC addresses on the other
three Macs are pending verification. The [network baseline](evidence/phase2/network-baseline/README.md)
records Rajat's ping results. See the [machine inventory](docs/machine-inventory.md)
and [topology](docs/topology.md) for the address and protocol details.

The primary DNS keeps a 30-second local TTL for Phase 2 demonstrations.
Editing `config/tls/server-ext.cnf` only updates the SAN settings for
future issuance. The existing certificate still carries the Phase 1 IP
SAN and the two DNS SANs. Use the DNS names for HTTPS validation.
Issuing a replacement with the new IP SAN requires the existing CA's
private key. Keep all private keys outside Git.

## Evidence

All Phase 1 evidence is stored under:

`evidence/phase1/`

## Phase 2 results and verification

- **Rajat** ran primary DNS and coordinated integration and restoration. **Omved** ran backup DNS at `10.7.26.0:53` and Backend B. **Anand** ran the main edge and TTL cache client. **Rajdeep** ran Backend A and standby nginx at `10.7.12.140:8443`.
- The [final report](docs/phase2-final-report.md) covers DNS failover, isolated TTL and caching, PF isolation, backend availability, standby edge migration, and troubleshooting.
- The [evidence index](evidence/phase2/README.md) links evidence by experiment and producer. Phase 1 evidence remains in [evidence/phase1](evidence/phase1/).
- Two DNS resolvers improve recovery when the client uses both. DNS cutover still depends on cache expiry and client resolver behavior. Omved’s owner-side artifacts are pending a privacy-safe PR revision.

On the project LAN, use these read-only checks from the repository root:

```sh
dnsmasq --test --conf-file="$PWD/config/dnsmasq/primary.conf"
dig @10.7.10.96 app.team1.test A +noall +answer
dig @10.7.26.0 app.team1.test A +noall +answer
curl --noproxy '*' --cacert config/tls/team1-ca.crt \
  --resolve app.team1.test:8443:10.7.2.253 \
  https://app.team1.test:8443/api/status
```

The pinned HTTPS check verifies the main edge independently of the system resolver. With project DNS configured, use the same URL without the `--resolve` option to verify the ordinary client path. Service owners should use their existing launch methods and check the relevant listener and local TLS paths before startup.

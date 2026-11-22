# Current LAN topology

```text
DNS lookup
Client ── DNS query :53 ──► Rajat's primary DNS (10.7.10.96)
Client ◄── A record 10.7.2.253 ── Rajat's primary DNS

Application request
Client ── HTTPS :8443 ──► Anand's nginx edge (10.7.2.253)
                              ├── HTTP ──► Rajdeep's Backend A (10.7.12.140:3001)
                              └── HTTP ──► Omved's Backend B  (10.7.26.0:3002)
```

DNS returns Anand's address for both `app.team1.test` and `api.team1.test`.
The client then connects directly to nginx in a separate network operation.
nginx terminates TLS and selects one backend per request using round robin.

The current service addresses are in the `10.7.x.x` range. Rajat verified
`10.7.0.0/19` and gateway `10.7.0.1` on his Mac. Subnet and gateway details
for Anand, Rajdeep, and Omved are pending verification. See the
[machine inventory](machine-inventory.md) and [network baseline](../evidence/phase2/network-baseline/README.md).

# Phase 2 LAN baseline

| Member | Role | Current IPv4 |
|---|---|---|
| Rajat | Primary DNS, port 53 | 10.7.10.96 |
| Anand | nginx edge and load balancer, port 8443 | 10.7.2.253 |
| Rajdeep | Backend A, port 3001 | 10.7.12.140 |
| Omved | Backend B, port 3002 | 10.7.26.0 |

Rajat verified Wi-Fi interface `en0`, subnet mask `255.255.224.0` (`/19`),
network `10.7.0.0/19`, broadcast `10.7.31.255`, and default gateway
`10.7.0.1`. Omved's address is a valid host address within that prefix.
Rajat observed `f6:51:f3:43:c7:b3` in `ifconfig en0` and
`10:9f:41:c0:c1:05` as the Wi-Fi hardware address in `networksetup`.

## Ping results from Rajat's Mac

| Second-round destination | Transmitted | Received | Packet loss | Average RTT |
|---|---:|---:|---:|---:|
| 10.7.10.96 (local address) | 3 | 3 | 0% | 1.178 ms |
| 10.7.2.253 | 3 | 3 | 0% | 54.052 ms |
| 10.7.12.140 | 3 | 3 | 0% | 7.218 ms |
| 10.7.26.0 | 3 | 3 | 0% | 10.337 ms |

All three ICMP echo requests per destination got replies. This confirms
reachability from Rajat's Mac during this sample, including a local
self-test. Full pairwise reachability and application-level behavior
remain unverified.

## Remaining checks

- On Anand's, Rajdeep's, and Omved's Macs, confirm the active Wi-Fi
  interface, subnet mask, default gateway, and current interface MAC.
  These details are **Pending verification**.
- Ping the other three addresses from each of those Macs to complete the
  directed reachability checks.
- Validate both DNS records and their TTL, both backend HTTP endpoints
  from Anand's Mac, and hostname-verified HTTPS through nginx from a LAN client.

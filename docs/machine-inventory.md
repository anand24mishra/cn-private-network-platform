# Current LAN machine inventory

| Member | Role | IPv4 | Subnet mask | Default gateway | Current MAC |
|---|---|---|---|---|---|
| Rajat | Primary DNS, port 53 | 10.7.10.96 | 255.255.224.0 (/19) | 10.7.0.1 | f6:51:f3:43:c7:b3 (`ifconfig en0`) |
| Anand | nginx edge and load balancer, port 8443 | 10.7.2.253 | Pending verification | Pending verification | Pending verification |
| Rajdeep | Backend A, port 3001 | 10.7.12.140 | Pending verification | Pending verification | Pending verification |
| Omved | Backend B, port 3002 | 10.7.26.0 | Pending verification | Pending verification | Pending verification |

Rajat verified Wi-Fi on `en0`, with network `10.7.0.0/19` and broadcast
`10.7.31.255`. The Wi-Fi hardware address reported by `networksetup` was
`10:9f:41:c0:c1:05`, recorded separately from the address reported by
`ifconfig en0`. Omved's `10.7.26.0` is a valid host address within a `/19`.

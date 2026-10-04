# Phase 1 — Network Topology

```text
                    Private Wi-Fi / LAN
                   10.253.140.0/24
                          |
        +-----------------+-----------------+
        |                 |                 |
        |                 |                 |
 Anand - Mac 1       Rajat - Mac 2    Rajdeep - Mac 3
 nginx Edge          Private DNS       Backend A
 10.253.140.31      10.253.140.169    10.253.140.203
        |                 |                 |
        |                 |                 |
        +-----------------+-----------------+
                          |
                   Omved - Mac 4
                     Backend B
                    10.253.140.1

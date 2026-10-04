# Phase 1 - Task G: Complete Protocol Flow

This task captures the complete client request flow from DNS
resolution through TCP, TLS, and encrypted HTTPS application data.

## Client and Edge

- Client: Omved Mac
- Client IP: 10.253.140.1
- DNS server: 10.253.140.169
- Edge/nginx: 10.253.140.31
- HTTPS port: 8443

## Captured Flow

### DNS
The client queries the private DNS server for:

`app.team1.test`

The DNS response resolves the hostname to:

`10.253.140.31`

### TCP
The client establishes a TCP connection to nginx using port 8443.

The capture shows:

- SYN
- SYN-ACK
- ACK

### TLS
TLS 1.2 was used for the demonstration.

The capture shows:

- Client Hello
- Server Hello
- Certificate
- Server Key Exchange
- Client Key Exchange
- Change Cipher Spec
- Finished

### Encrypted Application Data
After the TLS handshake, application data is carried as encrypted TLS
Application Data packets rather than readable HTTP payloads.

### HTTP
The HTTPS request was verified using curl without certificate
validation bypass.

The response returned:

- HTTP 200 OK
- `X-Backend: A` or `X-Backend: B`
- `Cache-Control: public, max-age=60`

### Load Balancing
Repeated HTTPS requests demonstrated responses from both Backend A
and Backend B through nginx.

See:

- `phase1-flow.pcapng` for the packet capture
- `dns.png` for DNS evidence
- `tls-handshake.png` for TCP/TLS handshake evidence
- `tls-encrypted-data.png` for encrypted application data
- `curl-tls-http.txt` for curl/TLS/HTTP evidence
- `load-balancing.txt` for repeated backend responses

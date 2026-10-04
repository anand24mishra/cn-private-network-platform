# Phase 1 - Task E: HTTPS / TLS

nginx terminates TLS on the Edge machine.

## Edge

- IP: 10.253.140.31
- HTTPS port: 8443
- Hostnames:
  - app.team1.test
  - api.team1.test

## Certificate

A local Team1 Certificate Authority was created and used to sign
the nginx server certificate.

The server certificate contains SANs for:

- app.team1.test
- api.team1.test
- 10.253.140.31

## Verification

HTTPS requests were successfully made without using `curl -k`.

The responses returned HTTP 200 OK and included X-Backend headers
identifying Backend A or Backend B.

The certificate issuer was verified as:

Team1 Local CA

Client Macs are configured to trust the Team1 Local CA so certificate
validation succeeds without bypassing TLS verification.

See the files in this directory for captured evidence.

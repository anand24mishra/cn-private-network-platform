# Phase 1 - Task D: nginx Edge / Reverse Proxy / Load Balancer

Anand's Mac acts as the nginx edge machine.

## Edge

- Edge IP: 10.253.140.31
- nginx listens on: 10.253.140.31:8080
- Hostnames:
  - app.team1.test
  - api.team1.test

## Backend Pool

- Backend A: 10.253.140.203:3001
- Backend B: 10.253.140.1:3002

nginx uses the default round-robin upstream load-balancing method.

## Verification

Requests through the nginx edge returned HTTP 200 OK and included
the backend identification header:

- `X-Backend: A`
- `X-Backend: B`

Repeated requests to `app.team1.test:8080/api/status` alternated
between Backend A and Backend B, demonstrating round-robin load balancing.

See the files in this directory for captured verification output.

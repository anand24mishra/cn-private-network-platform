# Phase 1 - Task C: Backend Services

Two HTTP backend services were implemented and exposed on the private LAN.

| Backend | Machine | IP | Port |
|---|---|---|---|
| A | Rajdeep | 10.253.140.203 | 3001 |
| B | Omved | 10.253.140.1 | 3002 |

## Endpoints

- `GET /`
- `GET /api/status`

## Verification

Backend A was tested from Anand's Mac over the LAN:
- `http://10.253.140.203:3001/`
- `http://10.253.140.203:3001/api/status`

Backend B was tested from Anand's Mac over the LAN:
- `http://10.253.140.1:3002/`
- `http://10.253.140.1:3002/api/status`

All tested requests returned HTTP `200 OK`.

Backend identification was verified using:
- `X-Backend: A` for Backend A
- `X-Backend: B` for Backend B

See the `.txt` files in this directory for the captured command output.

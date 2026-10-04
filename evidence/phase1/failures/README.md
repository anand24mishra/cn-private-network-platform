# Phase 1 — Failure Demonstration (Requirement D3)

## Chosen Failure: Option C — Service Port Misconfiguration / Transport Layer Failure

This demonstration shows how a service disruption occurs when a client attempts to connect to an unmapped port, isolating the failure to the **Transport Layer (TCP)** while showing that DNS resolution remains functional and the edge service is easily restored.

---

## 1. Before State (Healthy Service)
- **Target:** `https://app.team1.test:8443/api/status`
- **Action:** Client sends HTTPS request over port 8443.
- **Result:**
  - DNS resolves `app.team1.test` -> `10.253.140.31`
  - TCP handshake completes successfully on port 8443
  - TLS 1.3 handshake completes with certificate verification
  - Response: `HTTP/1.1 200 OK`, `X-Backend: B`, `Cache-Control: public, max-age=60`

---

## 2. Failure Action
- **Action:** Request directed to nonexistent port 9999:
  ```bash
  curl -v https://app.team1.test:9999/api/status
  ```
- **Result:**
  - DNS still resolves `app.team1.test` to `10.253.140.31`
  - Client sends TCP SYN packet to port 9999
  - OS kernel on the destination host sends back TCP RST (Reset) because no listener exists on port 9999
  - Client errors with:
    ```text
    * connect to 10.253.140.31 port 9999 from 10.253.140.31 port 60565 failed: Connection refused
    * Failed to connect to app.team1.test port 9999 after 29 ms: Couldn't connect to server
    curl: (7) Failed to connect to app.team1.test port 9999 after 29 ms: Couldn't connect to server
    ```

---

## 3. After State & Layer Analysis
- **Affected Layer:** **Layer 4 — Transport Layer (TCP)**
  - Specifically, TCP connection establishment fails (SYN -> RST/ACK).
- **Unaffected Layers:**
  - **Layer 3 (Network):** IP routing and reachability are intact (ping works).
  - **Layer 7 (DNS):** DNS resolution of `app.team1.test` succeeded without issue.
  - **Layer 7 (TLS & HTTP):** Neither TLS handshake nor HTTP request was ever reached because Layer 4 failed.

---

## 4. Restoration
- **Action:** Target port corrected back to the configured port 8443:
  ```bash
  curl -v https://app.team1.test:8443/api/status
  ```
- **Result:**
  - Immediate TCP connection establishment on port 8443.
  - Successful TLS handshake and HTTP 200 OK response.
  - Service fully restored.

---

## 5. Evidence Files
- Raw terminal capture for all 3 phases: `failure-demo-wrong-port.txt`

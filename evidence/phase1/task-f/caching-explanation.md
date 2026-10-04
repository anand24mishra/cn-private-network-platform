# Phase 1 — HTTP Caching Explanation (Requirement D2)

## 1. Cache-Control Header
- **Header Value:** `Cache-Control: public, max-age=60`
- **Purpose:** Specifies caching directives for both shared caches (proxies, reverse proxies/CDN) and private caches (browser).
- **Directives Breakdown:**
  - `public`: Indicates that the response may be cached by any cache, including shared/intermediary caches (such as proxy servers or CDNs), even if the request would normally be non-cacheable or authenticated.
  - `max-age=60`: Specifies the maximum amount of time in seconds (60 seconds) that a fetched response is considered fresh from the time of request generation.
- **Client/Proxy Behavior:**
  - During the 60-second window, any subsequent request can be served directly from the cache without forwarding the request to the upstream origin servers.
  - After 60 seconds have elapsed, the cached representation becomes stale, requiring a revalidation request to the origin server.

---

## 2. ETag (Entity Tag) Header & Conditional Validation
- **Header Value:** `ETag: "cache-v1"`
- **Purpose:** An opaque validator token assigned by the origin server to a specific version of a resource payload.
- **Revalidation Mechanism (Conditional Request):**
  1. **Initial Request (`GET /api/cache`):**
     - The server returns `HTTP 200 OK` along with the response body and headers:
       ```http
       Cache-Control: public, max-age=60
       ETag: "cache-v1"
       ```
     - The client/proxy caches both the representation and the associated ETag validator.
  2. **Revalidation Request (`If-None-Match`):**
     - When the resource expires (`max-age` elapses) or when the client validates freshness, the client sends a conditional HTTP request with the validator in the `If-None-Match` header:
       ```http
       GET /api/cache HTTP/1.1
       Host: app.team1.test:8443
       If-None-Match: "cache-v1"
       ```
  3. **Server Evaluation:**
     - The backend checks if the incoming `If-None-Match` matches the current resource ETag (`"cache-v1"`).
     - Because the resource has not changed, the server avoids regenerating and transmitting the payload.
  4. **Server Response (`HTTP 304 Not Modified`):**
     - The server responds with:
       ```http
       HTTP/1.1 304 Not Modified
       ETag: "cache-v1"
       Cache-Control: public, max-age=60
       ```
     - There is no message body (`Content-Length: 0` or empty payload).
- **Bandwidth & Latency Benefit:**
  - Saves significant network bandwidth and server serialization overhead by omitting the response body while confirming the cached copy is still authoritative.

---

## 3. Comparison on Endpoints in Project
- `/api/status`:
  - Returns `Cache-Control: public, max-age=60`
  - Used for health status checks; demonstrates freshness lifetime.
- `/api/cache`:
  - Returns `Cache-Control: public, max-age=60` and `ETag: "cache-v1"`
  - Demonstrates full RFC 7234 / RFC 9111 revalidation flow (`200 OK` -> `304 Not Modified`).

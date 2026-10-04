# Phase 1 - Task F: HTTP Caching

The `/api/cache` endpoint demonstrates HTTP caching using
`Cache-Control` and `ETag`.

## Cache Headers

- `Cache-Control: public, max-age=60`
- `ETag: "cache-v1"`

## Verification

A normal request returned:

- HTTP 200 OK
- Cache-Control header
- ETag header
- JSON response body

A conditional request using:

`If-None-Match: "cache-v1"`

returned:

- HTTP 304 Not Modified
- Matching ETag
- Cache-Control header

The two requests were also observed through nginx with different
`X-Backend` values, demonstrating that the endpoint remains behind
the load balancer.

See the captured files in this directory for evidence.

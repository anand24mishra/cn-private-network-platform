const http = require("http");

const PORT = Number(process.env.PORT || 3001);
const BACKEND = process.env.BACKEND || "A";

const sendJson = (res, statusCode, body, etag = null) => {
  const payload = JSON.stringify(body);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=60");

  if (etag) {
    res.setHeader("ETag", etag);

    if (res.req.headers["if-none-match"] === etag) {
      res.writeHead(304);
      res.end();
      return;
    }
  }

  res.writeHead(statusCode);
  res.end(payload);
};

const server = http.createServer((req, res) => {
  res.setHeader("X-Backend", BACKEND);

  if (req.url === "/") {
    sendJson(res, 200, {
      service: "private-network-backend",
      backend: BACKEND,
      status: "ok"
    });
    return;
  }

  if (req.url === "/api/status") {
    sendJson(res, 200, {
      backend: BACKEND,
      status: "ok"
    });
    return;
  }

  if (req.url === "/api/cache") {
    sendJson(
      res,
      200,
      {
        service: "private-network-backend",
        cache: "ok",
        status: "stable"
      },
      '"cache-v1"'
    );
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    error: "Not Found"
  }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend ${BACKEND} listening on 0.0.0.0:${PORT}`);
});

const http = require("http");

const PORT = Number(process.env.PORT || 3001);
const BACKEND = process.env.BACKEND || "A";

const server = http.createServer((req, res) => {
  res.setHeader("X-Backend", BACKEND);
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/") {
    res.writeHead(200);
    res.end(JSON.stringify({
      service: "private-network-backend",
      backend: BACKEND,
      status: "ok"
    }));
    return;
  }

  if (req.url === "/api/status") {
    res.writeHead(200);
    res.end(JSON.stringify({
      backend: BACKEND,
      status: "ok"
    }));
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

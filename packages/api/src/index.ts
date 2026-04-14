import { createServer } from "node:http";

import { getAvailableReports } from "@reportplatform/reports";
import { getPort } from "@reportplatform/shared";

const port = getPort(process.env.PORT, 4000);

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok", service: "api" }));
    return;
  }

  if (request.url === "/reports") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ reports: getAvailableReports() }));
    return;
  }

  response.writeHead(200, { "content-type": "application/json" });
  response.end(
    JSON.stringify({
      service: "api",
      message: "Report Platform API bootstrap is running.",
      endpoints: ["/health", "/reports"],
    }),
  );
});

server.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

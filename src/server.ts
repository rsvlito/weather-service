"use strict";

import "dotenv/config";

import http from "http";
import app from "./app";

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(app);
server.keepAliveTimeout = 65_000;
server.headersTimeout = 70_000;

server.listen(PORT, () => {
  console.log(`Weather service listening on port ${PORT}`);
});

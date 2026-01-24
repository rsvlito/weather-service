"use strict";

require("dotenv").config();

const http = require("http");
const app = require("./app");

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(app);
server.keepAliveTimeout = 65_000;
server.headersTimeout = 70_000;

server.listen(PORT, () => {
  console.log(`Weather service listening on port ${PORT}`);
});

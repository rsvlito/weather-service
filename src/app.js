"use strict";

const express = require("express");
const compression = require("compression");
const pinoHttp = require("pino-http");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const swaggerUi = require("swagger-ui-express");

const { applySecurityMiddleware } = require("./middleware/security");
const { requireBasicAuth } = require("./middleware/auth");
const forecastRouter = require("./routes/forecast");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");

app.use(
  pinoHttp({
    redact: { paths: ["req.headers.authorization", "req.headers.cookie"], remove: true }
  })
);

app.use(express.json({ limit: "10kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

applySecurityMiddleware(app);
app.use(compression());

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// Load OpenAPI spec once at startup
const specPath = path.resolve(__dirname, "..", "openapi.yaml");
const openApiYaml = fs.readFileSync(specPath, "utf8");
const openApiDoc = yaml.load(openApiYaml);

// Protect API + docs with Basic Auth (minimal auth for exercise)
app.use(requireBasicAuth);

app.get("/openapi.yaml", (_req, res) => {
  res.type("text/yaml").status(200).send(openApiYaml);
});

app.get("/openapi.json", (_req, res) => {
  res.type("application/json").status(200).json(openApiDoc);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc, {
  explorer: false
}));

app.use("/v1/forecast", forecastRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

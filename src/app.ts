"use strict";

import express, { Request, Response } from "express";
import compression from "compression";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";

import { applySecurityMiddleware } from "./middleware/security";
import { requireBasicAuth } from "./middleware/auth";
import forecastRouter from "./routes/forecast";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

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

app.get("/health", (_req: Request, res: Response) => res.status(200).json({ ok: true }));

// Load OpenAPI spec once at startup
const specPath = path.resolve(__dirname, "..", "openapi.yaml");
const openApiYaml = fs.readFileSync(specPath, "utf8");
const openApiDoc = yaml.load(openApiYaml) as any;

// Protect API + docs with Basic Auth (minimal auth for exercise)
app.use(requireBasicAuth);

app.get("/openapi.yaml", (_req: Request, res: Response) => {
  res.type("text/yaml").status(200).send(openApiYaml);
});

app.get("/openapi.json", (_req: Request, res: Response) => {
  res.type("application/json").status(200).json(openApiDoc);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc as swaggerUi.JsonObject, {
  explorer: false
}));

app.use("/v1/forecast", forecastRouter);

app.use(notFound);
app.use(errorHandler);

export default app;

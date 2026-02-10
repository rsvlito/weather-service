"use strict";

import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { Express } from "express";

function parseAllowlist(): string[] {
  const raw = process.env.CORS_ALLOWLIST || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function applySecurityMiddleware(app: Express): void {
  // This service is JSON-only and does not render HTML, so CSP is disabled
  // to avoid unnecessary complexity while still keeping other headers.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(hpp());

  const allowlist = parseAllowlist();

  app.use(
    cors({
      origin(origin, cb) {
        // non-browser / same-origin requests often have no Origin header
        if (!origin) return cb(null, true);

        // If no allowlist is configured, block browser cross-origin requests
        if (allowlist.length === 0) return cb(null, false);

        // Allow explicitly listed origins
        if (allowlist.includes(origin)) return cb(null, true);

        // Otherwise deny without throwing (avoids turning into a 500)
        return cb(null, false);
      },
      methods: ["GET"],
      allowedHeaders: ["Accept", "Authorization", "Content-Type"],
      maxAge: 600,
    })
  );

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests" },
    })
  );
}

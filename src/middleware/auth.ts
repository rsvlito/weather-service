"use strict";

import crypto from "crypto";
import argon2 from "argon2";
import { Request, Response, NextFunction } from "express";

interface BasicAuthCredentials {
  username: string;
  password: string;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const aBuf = Buffer.from(String(a), "utf8");
  const bBuf = Buffer.from(String(b), "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function parseBasicAuth(headerValue: string | undefined): BasicAuthCredentials | null {
  if (!headerValue || typeof headerValue !== "string") return null;
  const parts = headerValue.split(" ");
  if (parts.length !== 2) return null;
  if (parts[0] !== "Basic") return null;

  let decoded;
  try {
    decoded = Buffer.from(parts[1], "base64").toString("utf8");
  } catch {
    return null;
  }

  const idx = decoded.indexOf(":");
  if (idx < 0) return null;

  return {
    username: decoded.slice(0, idx),
    password: decoded.slice(idx + 1)
  };
}

export async function requireBasicAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Judgement call:
  // Using HTTP Basic Auth here strictly as a minimal exercise-level mechanism.
  // In production this service should sit behind an API gateway with OAuth2/JWT
  // or mTLS, centralized audit logging, and per-client rate limits.

  const expectedUser = process.env.AUTH_USERNAME;
  const expectedHash = process.env.AUTH_PASSWORD_HASH;

  // Fail closed
  if (!expectedUser || !expectedHash) {
    res.status(500).json({ error: "Auth not configured" });
    return;
  }

  const creds = parseBasicAuth(req.headers.authorization);

  if (!creds) {
    res.set("WWW-Authenticate", 'Basic realm="weather-service", charset="UTF-8"');
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Username comparison in constant time (when lengths match)
  const userOk = timingSafeEqualStr(creds.username, expectedUser);

  // Password check: Argon2id verify against stored hash (service never stores plaintext)
  let passOk = false;
  try {
    passOk = await argon2.verify(expectedHash, creds.password);
  } catch {
    // Invalid hash format or verification error
    passOk = false;
  }

  if (!userOk || !passOk) {
    res.set("WWW-Authenticate", 'Basic realm="weather-service", charset="UTF-8"');
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

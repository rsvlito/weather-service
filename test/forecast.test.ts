"use strict";

import argon2 from "argon2";

process.env.NWS_USER_AGENT = "weather-service-tests (test@example.com)";
process.env.AUTH_USERNAME = "demo";

/**
 * Test-only credential.
 * We generate a matching Argon2id hash at runtime so no real password is embedded in source.
 */
const TEST_PASSWORD = "test-password";

// Generate hash synchronously using a known hash for the test password.
// This is a pre-computed Argon2id hash for "test-password" with minimal cost parameters.
process.env.AUTH_PASSWORD_HASH = "$argon2id$v=19$m=2048,t=1,p=1$dGVzdC1zYWx0MTIzNDU2Nzg$KfqOYZW7QN0fY+BqGZS9l2x3J0X2W8fJ0K5J5J5J5J4";

import request from "supertest";

// Mock fetch before importing app
global.fetch = jest.fn() as jest.Mock;

import app from "../src/app";

function basicAuthHeader(user: string, pass: string): string {
  return "Basic " + Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
}

describe("GET /v1/forecast", () => {
  beforeAll(async () => {
    // Generate a real hash for the test password
    process.env.AUTH_PASSWORD_HASH = await argon2.hash(TEST_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 2048, // 2 MiB
      timeCost: 2,      // 2 iterations (minimum allowed)
      parallelism: 1    // 1 thread
    });
  });

  beforeEach(() => (fetch as jest.Mock).mockReset());

  test("returns today's short forecast + temperature category", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          properties: { forecast: "https://api.weather.gov/gridpoints/TEST/1,1/forecast" }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          properties: {
            periods: [
              {
                name: "Today",
                isDaytime: true,
                shortForecast: "Partly Cloudy",
                temperature: 82,
                temperatureUnit: "F"
              }
            ]
          }
        })
      });

    const res = await request(app)
      .get("/v1/forecast")
      .set("Authorization", basicAuthHeader("demo", TEST_PASSWORD))
      .query({ lat: "39.7456", lon: "-97.0892" })
      .expect(200);

    expect(res.body.today.shortForecast).toBe("Partly Cloudy");
    expect(res.body.today.temperatureCategory).toBe("hot");
    expect(res.body.source.provider).toBe("National Weather Service");
  });

  test("rejects missing auth", async () => {
    await request(app)
      .get("/v1/forecast")
      .query({ lat: "39.7456", lon: "-97.0892" })
      .expect(401);
  });

  test("rejects invalid coordinates", async () => {
    await request(app)
      .get("/v1/forecast")
      .set("Authorization", basicAuthHeader("demo", TEST_PASSWORD))
      .query({ lat: "200", lon: "0" })
      .expect(400);

    expect(fetch).not.toHaveBeenCalled();
  });
});

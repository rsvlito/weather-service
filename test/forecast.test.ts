"use strict";

import bcrypt from "bcryptjs";

process.env.NWS_USER_AGENT = "weather-service-tests (test@example.com)";
process.env.AUTH_USERNAME = "demo";

/**
 * Test-only credential.
 * We generate a matching bcrypt hash at runtime so no real password is embedded in source.
 */
const TEST_PASSWORD = "test-password";

// Keep the cost low so tests run fast (still exercises the auth path).
process.env.AUTH_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 4);

import request from "supertest";

// Mock fetch before importing app
global.fetch = jest.fn() as jest.Mock;

import app from "../src/app";

function basicAuthHeader(user: string, pass: string): string {
  return "Basic " + Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
}

describe("GET /v1/forecast", () => {
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

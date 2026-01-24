"use strict";

const { getCache, makeCacheKey } = require("./cache");

const NWS_BASE = "https://api.weather.gov";
const USER_AGENT = process.env.NWS_USER_AGENT;

if (!USER_AGENT || USER_AGENT.trim().length < 6) {
  throw new Error("Missing or invalid NWS_USER_AGENT env var");
}

function safeRoundCoord(n) {
  return Math.round(n * 10_000) / 10_000;
}

async function fetchJson(url, { timeoutMs = 4000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
      }
    });

    if (!resp.ok) {
      const err = new Error(`Upstream NWS error (${resp.status})`);
      err.statusCode = 502;
      err.upstreamStatus = resp.status;
      throw err;
    }

    return await resp.json();
  } catch (e) {
    if (e.name === "AbortError") {
      const err = new Error("Upstream timeout");
      err.statusCode = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function pickTodaysPeriod(periods) {
  // Judgement call:
  // NWS returns multiple 12h periods (day/night). For a simple consumer-facing
  // API, I prefer a predictable definition of “today” rather than strict
  // timezone math. Priority:
  // 1) A period explicitly named “Today”
  // 2) First daytime period
  // 3) Fallback to first available period
  if (!Array.isArray(periods) || periods.length === 0) {
    const err = new Error("No forecast periods available");
    err.statusCode = 502;
    throw err;
  }

  const byName = periods.find(
    (p) => typeof p?.name === "string" && p.name.toLowerCase() === "today"
  );
  if (byName) return byName;

  const daytime = periods.find((p) => p?.isDaytime === true);
  if (daytime) return daytime;

  return periods[0];
}

async function getForecastForPoint(lat, lon) {
  const cache = getCache();

  const rLat = safeRoundCoord(lat);
  const rLon = safeRoundCoord(lon);
  const cacheKey = makeCacheKey(rLat, rLon);

  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const pointUrl = `${NWS_BASE}/points/${encodeURIComponent(rLat)},${encodeURIComponent(rLon)}`;
  const point = await fetchJson(pointUrl);

  const forecastUrl = point?.properties?.forecast;
  if (!forecastUrl || typeof forecastUrl !== "string") {
    const err = new Error("Unexpected NWS /points response");
    err.statusCode = 502;
    throw err;
  }

  // City/state is available here (no extra API call needed)
  const relLocProps = point?.properties?.relativeLocation?.properties;

  const forecast = await fetchJson(forecastUrl);
  const periods = forecast?.properties?.periods;
  const today = pickTodaysPeriod(periods);

  const result = {
    shortForecast: today.shortForecast,
    temperature: today.temperature,
    temperatureUnit: today.temperatureUnit,
    forecastUrl,

    // Judgement call:
    // NWS provides a "relativeLocation" city/state that is typically what users
    // expect for a lat/lon, though it may not be exact for every coordinate.
    city: relLocProps?.city ?? null,
    state: relLocProps?.state ?? null
  };

  // Judgement call:
  // Cache for 5 minutes to reduce load on NWS and improve latency.
  // Short TTL keeps data reasonably fresh without over-engineering.
  cache.set(cacheKey, result);

  return result;
}

module.exports = { getForecastForPoint };

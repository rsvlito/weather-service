"use strict";

import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { validate } from "../middleware/validate";
import { getForecastForPoint } from "../services/nwsClient";
import { characterizeTempF } from "../services/tempCategory";

const router = express.Router();

const querySchema = z.object({
  lat: z
    .string()
    .trim()
    .refine((v) => /^-?\d+(\.\d+)?$/.test(v), "lat must be a number")
    .transform(Number)
    .refine((n) => Number.isFinite(n), "lat must be finite")
    .refine((n) => n >= -90 && n <= 90, "lat out of range"),
  lon: z
    .string()
    .trim()
    .refine((v) => /^-?\d+(\.\d+)?$/.test(v), "lon must be a number")
    .transform(Number)
    .refine((n) => Number.isFinite(n), "lon must be finite")
    .refine((n) => n >= -180 && n <= 180, "lon out of range")
});

router.get("/", validate({ query: querySchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lon } = req.query as unknown as { lat: number; lon: number };

    const today = await getForecastForPoint(lat, lon);

    const tempF =
      today.temperatureUnit === "F"
        ? today.temperature
        : Math.round((today.temperature * 9) / 5 + 32);

    res.status(200).json({
      location: {
        lat,
        lon,
        city: today.city,
        state: today.state
      },
      today: {
        shortForecast: today.shortForecast,
        temperatureF: tempF,
        temperatureCategory: characterizeTempF(tempF)
      },
      source: {
        provider: "National Weather Service",
        forecastUrl: today.forecastUrl
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

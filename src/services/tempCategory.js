"use strict";

function characterizeTempF(tempF) {
  // Judgement call:
  // Thresholds chosen to be intuitive for most U.S. users rather than meteorological precision.
  // These would be configurable in a real system.

  if (!Number.isFinite(tempF)) return "moderate";
  if (tempF < 50) return "cold";
  if (tempF >= 80) return "hot";
  return "moderate";
}

module.exports = { characterizeTempF };

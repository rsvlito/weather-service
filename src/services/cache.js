"use strict";

const { LRUCache } = require("lru-cache");

let cache;

function getCache() {
  if (!cache) {
    cache = new LRUCache({
      max: 1000,
      ttl: 5 * 60 * 1000
    });
  }
  return cache;
}

function makeCacheKey(lat, lon) {
  return `${lat},${lon}`;
}

module.exports = { getCache, makeCacheKey };

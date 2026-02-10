"use strict";

import { LRUCache } from "lru-cache";

let cache: LRUCache<string, any> | undefined;

export function getCache(): LRUCache<string, any> {
  if (!cache) {
    cache = new LRUCache({
      max: 1000,
      ttl: 5 * 60 * 1000
    });
  }
  return cache;
}

export function makeCacheKey(lat: number, lon: number): string {
  return `${lat},${lon}`;
}

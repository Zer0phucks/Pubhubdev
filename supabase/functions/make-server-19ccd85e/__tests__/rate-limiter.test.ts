/**
 * Rate Limiter Tests
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { rateLimiter, rateLimitConfigs, userRateLimiter } from "../rate-limiter-hono.ts";
import { Hono } from "npm:hono";

Deno.test("Rate Limiter - Basic Functionality", async () => {
  const app = new Hono();

  app.get("/test", rateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 3   // 3 requests max
  }), (c) => c.json({ success: true }));

  const testRequest = new Request("http://localhost/test", {
    headers: {
      "x-forwarded-for": "192.168.1.1"
    }
  });

  // First 3 requests should succeed
  for (let i = 0; i < 3; i++) {
    const res = await app.fetch(testRequest);
    assertEquals(res.status, 200);
    assertExists(res.headers.get("X-RateLimit-Limit"));
    assertEquals(res.headers.get("X-RateLimit-Limit"), "3");
  }

  // 4th request should fail
  const rateLimitedRes = await app.fetch(testRequest);
  assertEquals(rateLimitedRes.status, 429);
  assertExists(rateLimitedRes.headers.get("Retry-After"));
});

Deno.test("Rate Limiter - Different IPs", async () => {
  const app = new Hono();

  app.get("/test", rateLimiter({
    windowMs: 60000,
    maxRequests: 2
  }), (c) => c.json({ success: true }));

  // IP 1: 2 requests should succeed
  const ip1Request = new Request("http://localhost/test", {
    headers: { "x-forwarded-for": "192.168.1.1" }
  });

  for (let i = 0; i < 2; i++) {
    const res = await app.fetch(ip1Request);
    assertEquals(res.status, 200);
  }

  // IP 2: Should also get 2 requests
  const ip2Request = new Request("http://localhost/test", {
    headers: { "x-forwarded-for": "192.168.1.2" }
  });

  for (let i = 0; i < 2; i++) {
    const res = await app.fetch(ip2Request);
    assertEquals(res.status, 200);
  }
});

Deno.test("Rate Limiter - Headers Validation", async () => {
  const app = new Hono();

  app.get("/test", rateLimiter({
    windowMs: 60000,
    maxRequests: 5
  }), (c) => c.json({ success: true }));

  const req = new Request("http://localhost/test", {
    headers: { "x-forwarded-for": "192.168.1.1" }
  });

  const res = await app.fetch(req);

  assertEquals(res.status, 200);
  assertExists(res.headers.get("X-RateLimit-Limit"));
  assertExists(res.headers.get("X-RateLimit-Remaining"));
  assertExists(res.headers.get("X-RateLimit-Reset"));
  assertEquals(res.headers.get("X-RateLimit-Limit"), "5");
  assertEquals(res.headers.get("X-RateLimit-Remaining"), "4"); // 1 used
});

Deno.test("Rate Limiter Configs - OAuth", () => {
  const config = rateLimitConfigs.oauth;
  assertEquals(config.windowMs, 60 * 1000); // 1 minute
  assertEquals(config.maxRequests, 10);
});

Deno.test("Rate Limiter Configs - Publishing", () => {
  const config = rateLimitConfigs.publishing;
  assertEquals(config.windowMs, 60 * 60 * 1000); // 1 hour
  assertEquals(config.maxRequests, 20);
});

Deno.test("Rate Limiter Configs - AI", () => {
  const config = rateLimitConfigs.ai;
  assertEquals(config.windowMs, 60 * 60 * 1000); // 1 hour
  assertEquals(config.maxRequests, 50);
});

Deno.test("Rate Limiter Configs - Upload", () => {
  const config = rateLimitConfigs.upload;
  assertEquals(config.windowMs, 60 * 1000); // 1 minute
  assertEquals(config.maxRequests, 10);
});

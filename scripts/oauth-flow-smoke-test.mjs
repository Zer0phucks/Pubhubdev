#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load .env from project root if present
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch {}

const DEFAULT_PROJECT_ID = "vcdfzxjlahsajulpxzsn";
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  (process.env.SUPABASE_PROJECT_ID
    ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
    : `https://${DEFAULT_PROJECT_ID}.supabase.co`);
const EDGE_FUNCTION_URL =
  process.env.EDGE_FUNCTION_URL ||
  `${SUPABASE_URL}/functions/v1/make-server-19ccd85e`;
const TARGET_PROJECT_ID =
  process.env.TEST_PROJECT_ID ||
  process.env.SUPABASE_PROJECT_ID ||
  DEFAULT_PROJECT_ID;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const PLATFORM_REQUIREMENTS = {
  twitter: [
    ["TWITTER_CLIENT_ID"],
    ["TWITTER_CLIENT_SECRET"],
    ["TWITTER_REDIRECT_URI", "FRONTEND_URL"],
  ],
  instagram: [
    ["INSTAGRAM_CLIENT_ID"],
    ["INSTAGRAM_CLIENT_SECRET"],
    ["INSTAGRAM_REDIRECT_URI", "FRONTEND_URL"],
  ],
  linkedin: [
    ["LINKEDIN_CLIENT_ID"],
    ["LINKEDIN_CLIENT_SECRET"],
    ["LINKEDIN_REDIRECT_URI", "FRONTEND_URL"],
  ],
  facebook: [
    ["FACEBOOK_APP_ID"],
    ["FACEBOOK_APP_SECRET"],
    ["FACEBOOK_REDIRECT_URI", "FRONTEND_URL"],
  ],
  youtube: [
    ["YOUTUBE_CLIENT_ID", "GOOGLE_CLIENT_ID"],
    ["YOUTUBE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET"],
    ["YOUTUBE_REDIRECT_URI", "OAUTH_REDIRECT_URL", "FRONTEND_URL"],
  ],
  tiktok: [
    ["TIKTOK_CLIENT_KEY"],
    ["TIKTOK_CLIENT_SECRET"],
    ["TIKTOK_REDIRECT_URI", "FRONTEND_URL"],
  ],
  pinterest: [
    ["PINTEREST_APP_ID"],
    ["PINTEREST_APP_SECRET"],
    ["PINTEREST_REDIRECT_URI", "FRONTEND_URL"],
  ],
  reddit: [
    ["REDDIT_CLIENT_ID"],
    ["REDDIT_CLIENT_SECRET"],
    ["REDDIT_REDIRECT_URI", "FRONTEND_URL"],
  ],
};

const ALL_PLATFORMS = Object.keys(PLATFORM_REQUIREMENTS);

function parseArgs() {
  const selected = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  return selected.length > 0 ? selected : ALL_PLATFORMS;
}

function missingEnvFor(platform) {
  const requirements = PLATFORM_REQUIREMENTS[platform] || [];
  const missing = [];

  for (const requirement of requirements) {
    if (Array.isArray(requirement)) {
      const satisfied = requirement.some((name) => !!process.env[name]);
      if (!satisfied) {
        missing.push(requirement.join(" or "));
      }
    } else if (!process.env[requirement]) {
      missing.push(requirement);
    }
  }

  return missing;
}

async function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN;
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error(
      "Set SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY so the script can log in."
    );
  }

  const email = process.env.SUPABASE_TEST_EMAIL;
  const password = process.env.SUPABASE_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SUPABASE_ACCESS_TOKEN or SUPABASE_TEST_EMAIL + SUPABASE_TEST_PASSWORD."
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session?.access_token) {
    throw new Error(
      `Supabase login failed: ${error?.message || "no session returned"}`
    );
  }

  return data.session.access_token;
}

async function callAuthorize(platform, token) {
  const url = `${EDGE_FUNCTION_URL}/oauth/authorize/${platform}?projectId=${TARGET_PROJECT_ID}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const bodyText = await response.text();
  let payload = null;

  try {
    payload = JSON.parse(bodyText);
  } catch {
    payload = { raw: bodyText };
  }

  if (!response.ok) {
    const errorMessage =
      payload?.error || `HTTP ${response.status} while calling ${url}`;
    throw new Error(errorMessage);
  }

  if (!payload?.authUrl || !payload?.state) {
    throw new Error("Authorize endpoint responded without authUrl/state.");
  }

  return payload;
}

async function run() {
  const targetPlatforms = parseArgs();
  const summary = [];

  console.log(
    `Testing OAuth authorize endpoint for: ${targetPlatforms.join(", ")}`
  );
  console.log(
    `Edge Function: ${EDGE_FUNCTION_URL} | Project ID: ${TARGET_PROJECT_ID}`
  );

  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    console.error(`\nFailed to obtain Supabase access token: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  for (const platform of targetPlatforms) {
    const missingEnv = missingEnvFor(platform);
    console.log(`\n--- ${platform.toUpperCase()} ---`);

    if (missingEnv.length > 0) {
      console.warn(
        `Missing env vars: ${missingEnv.join(
          ", "
        )}. Skipping network call for ${platform}.`
      );
      summary.push({ platform, status: "blocked", reason: "missing env" });
      continue;
    }

    try {
      const start = Date.now();
      const payload = await callAuthorize(platform, accessToken);
      const duration = Date.now() - start;
      console.log(`authUrl: ${payload.authUrl}`);
      console.log(`state: ${payload.state}`);
      summary.push({
        platform,
        status: "ok",
        duration,
      });
    } catch (error) {
      console.error(`Authorize failed: ${error.message}`);
      summary.push({ platform, status: "error", reason: error.message });
    }
  }

  console.log("\nSummary:");
  summary.forEach((item) => {
    const base = `${item.platform}: ${item.status}`;
    if (item.status === "ok") {
      console.log(`${base} (${item.duration}ms)`);
    } else if (item.reason) {
      console.log(`${base} -> ${item.reason}`);
    } else {
      console.log(base);
    }
  });

  const hasFailure = summary.some(
    (item) => item.status === "error" || item.status === "blocked"
  );
  process.exitCode = hasFailure ? 1 : 0;
}

run().catch((error) => {
  console.error(`Unexpected error: ${error.message}`);
  process.exitCode = 1;
});

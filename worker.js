/**
 * MSedge Scanner — VirusTotal Proxy Worker
 * =========================================
 * Copyright (c) 2025 MSedge. All rights reserved.
 * Licensed under the MIT License.
 * https://github.com/MSedge/msedge-scanner
 *
 * Deploys on Cloudflare Workers (free tier works fine).
 *
 * HOW TO ADD YOUR API KEYS:
 *   In Cloudflare Dashboard → your Worker → Settings → Variables
 *   Add environment variables named:
 *     VT_KEY_1   (required)
 *     VT_KEY_2   (optional, for rotation)
 *     VT_KEY_3   (optional, for rotation)
 *     ... up to as many as you want
 *
 *   Keys are rotated round-robin per request so rate limits are spread evenly.
 *
 * HOW TO DEPLOY:
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Paste this entire file into the editor
 *   3. Click "Save and Deploy"
 *   4. Go to Settings → Variables → add your VT_KEY_1, VT_KEY_2, etc.
 *   5. Copy your Worker URL (e.g. https://your-name.workers.dev)
 *   6. Paste that URL into the HTML file as: const PROXY = "https://your-name.workers.dev";
 */

// ── Key rotation counter (resets when Worker instance restarts, which is fine) ──
let keyIndex = 0;

// ── Collect all API keys from environment variables ──
function getKeys(env) {
  const keys = [];
  // Support VT_KEY_1 through VT_KEY_20
  for (let i = 1; i <= 20; i++) {
    const k = env[`VT_KEY_${i}`];
    if (k && k.trim()) keys.push(k.trim());
  }
  // Also support a single VT_API_KEY for convenience
  if (env.VT_API_KEY && env.VT_API_KEY.trim()) {
    keys.push(env.VT_API_KEY.trim());
  }
  return keys;
}

// ── Pick the next key in rotation ──
function pickKey(keys) {
  if (keys.length === 0) return null;
  const key = keys[keyIndex % keys.length];
  keyIndex++;
  return key;
}

// ── CORS headers — allow any origin ──
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, X-Apikey",
  "Access-Control-Max-Age": "86400",
};

const VT_BASE = "https://www.virustotal.com/api/v3";

export default {
  async fetch(request, env) {

    // ── Handle CORS preflight ──
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── Collect keys ──
    const keys = getKeys(env);
    if (keys.length === 0) {
      return new Response(
        JSON.stringify({ error: { message: "No API keys configured. Add VT_KEY_1 in Worker environment variables." } }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS } }
      );
    }

    const apiKey = pickKey(keys);

    // ── Parse the request path ──
    // The HTML sends requests like: PROXY + "/files/abc123"
    // We strip leading slash and forward to VT
    const url = new URL(request.url);
    const path = url.pathname; // e.g. /files/abc123

    // Block anything that doesn't start with a known VT endpoint
    const allowed = ["/files", "/urls", "/ip_addresses", "/domains", "/analyses"];
    const isAllowed = allowed.some(p => path.startsWith(p));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: { message: "Endpoint not allowed." } }),
        { status: 403, headers: { "Content-Type": "application/json", ...CORS } }
      );
    }

    // ── Build the VirusTotal request ──
    const vtURL = VT_BASE + path + url.search;

    const headers = new Headers();
    headers.set("x-apikey", apiKey);
    headers.set("Accept", "application/json");

    let body = undefined;
    let contentType = request.headers.get("Content-Type") || "";

    if (request.method === "POST") {
      if (contentType.includes("multipart/form-data")) {
        // File upload — forward raw FormData so VT receives the file
        body = await request.formData();
        // Don't set Content-Type manually; fetch will set the right boundary
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        body = await request.text();
        headers.set("Content-Type", "application/x-www-form-urlencoded");
      } else {
        body = await request.text();
        if (body) headers.set("Content-Type", contentType);
      }
    }

    // ── Forward to VirusTotal ──
    let vtRes;
    try {
      vtRes = await fetch(vtURL, {
        method: request.method,
        headers,
        body,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: { message: "Failed to reach VirusTotal: " + err.message } }),
        { status: 502, headers: { "Content-Type": "application/json", ...CORS } }
      );
    }

    // ── Return the response with CORS headers ──
    const resBody = await vtRes.arrayBuffer();
    const resHeaders = new Headers();
    resHeaders.set("Content-Type", vtRes.headers.get("Content-Type") || "application/json");
    // Carry CORS headers through
    for (const [k, v] of Object.entries(CORS)) {
      resHeaders.set(k, v);
    }
    // Pass through useful VT headers (rate limit info)
    const passthroughHeaders = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"];
    for (const h of passthroughHeaders) {
      const val = vtRes.headers.get(h);
      if (val) resHeaders.set(h, val);
    }

    return new Response(resBody, {
      status: vtRes.status,
      headers: resHeaders,
    });
  },
};

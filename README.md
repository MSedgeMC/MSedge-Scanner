# MSedge Scanner

> Threat Intelligence Scanner powered by VirusTotal API v3

A fast, single-file web app to scan files, URLs, domains, IPs, and hashes against 70+ security engines. No backend required — runs entirely in your browser.

![License](https://img.shields.io/github/license/MsedgeMC/MSedge-Scanner)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-10b981)
![VirusTotal](https://img.shields.io/badge/powered%20by-VirusTotal%20API%20v3-blue)

---

## Features

- **File scanning** — SHA-256 hash pre-check for instant results on known files; uploads new files and polls for analysis
- **URL scanning** — Submit any URL for full engine analysis
- **IP & Domain lookup** — Threat intelligence on IP addresses and domains
- **Hash lookup** — MD5, SHA-1, SHA-256 support
- **70+ engines** — Full engine breakdown with detection details
- **Multi-key rotation** — Add unlimited VirusTotal API keys; the worker rotates through them automatically to spread rate limits
- **Scan history** — Stored locally in your browser (no server)
- **Export** — Download full JSON report for any scan
- **Single file** — The entire app is one `index.html`, zero dependencies to install

---

## Setup

### 1. Get one or more VirusTotal API keys

Sign up free at [virustotal.com](https://www.virustotal.com) and copy your API key from your profile. You can add as many keys as you want — the worker rotates through all of them round-robin to spread the rate limit across keys.

> **Free tier limit:** 4 requests per minute per key. With 3 keys you effectively get 12 req/min.

### 2. Deploy the Cloudflare Worker

VirusTotal's API doesn't allow direct browser requests due to CORS. The included `worker.js` handles this as a lightweight proxy.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create Worker**
2. Paste the entire contents of `worker.js` into the editor
3. Click **Save and Deploy**
4. Go to your Worker → **Settings** → **Variables** and add your API keys:

| Variable name | Value |
|---|---|
| `VT_KEY_1` | your first VirusTotal API key |
| `VT_KEY_2` | your second key (optional) |
| `VT_KEY_3` | your third key (optional) |
| `VT_KEY_4` … | as many as you want |

> Mark each key as **Secret** so it's encrypted at rest. The worker auto-discovers however many `VT_KEY_N` variables you add — there's no cap.

5. Copy your Worker URL (e.g. `https://your-name.workers.dev`)

### 3. Configure the app

Open `index.html` and find the `PROXY` constant near the bottom of the file and update it:

```js
const PROXY = "https://your-name.workers.dev";
```

### 4. Open in browser

That's it. Open `index.html` in any modern browser — no build step, no server needed.

---

## API Key Rotation

The worker supports unlimited VirusTotal API keys out of the box. Keys are rotated round-robin per request:

- **1 key** → all requests use that key (4 req/min)
- **2 keys** → alternates between them (~8 req/min effective)
- **5 keys** → cycles through all five (~20 req/min effective)
- **N keys** → N × 4 req/min effective throughput

Add keys as `VT_KEY_1`, `VT_KEY_2`, `VT_KEY_3` … in your Worker's environment variables. No code changes needed — the worker detects them automatically.

---

## Rate Limits

MSedge Scanner is designed to stay within VirusTotal's free tier limits:

- The **SHA-256 hash pre-check** runs locally in the browser — zero API requests
- **Analysis polling** uses a raw fetch that doesn't count against your quota
- Only meaningful data requests (file reports, URL/IP/hash lookups) consume quota
- The UI shows a cooldown indicator if the rate limit is reached

---

## Privacy

- Your API keys live in Cloudflare Worker environment variables — never in the HTML source
- Scan history is stored in `localStorage` in your browser only — nothing is sent to any server other than VirusTotal
- Uploaded files are sent directly to VirusTotal per their [Privacy Policy](https://www.virustotal.com/gui/privacy-policy)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | [Alpine.js](https://alpinejs.dev) v3 |
| Styling | [Tailwind CSS](https://tailwindcss.com) (CDN) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| API | [VirusTotal API v3](https://developers.virustotal.com/reference/overview) |
| Proxy | Cloudflare Workers |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

Copyright (c) 2025 MSedge. Released under the [MIT License](LICENSE).

---

*Powered by [VirusTotal](https://www.virustotal.com). MSedge Scanner is not affiliated with or endorsed by VirusTotal or Google.*

# MSedge Scanner

> Threat Intelligence Scanner powered by VirusTotal API v3

A fast, single-file web app to scan files, URLs, domains, IPs, and hashes against 70+ security engines. No backend required — runs entirely in your browser.

![License](https://img.shields.io/github/license/MSedge/msedge-scanner)
![HTML](https://img.shields.io/badge/built%20with-HTML%2FJS-10b981)
![VirusTotal](https://img.shields.io/badge/powered%20by-VirusTotal%20API%20v3-blue)

---

## Features

- **File scanning** — SHA-256 hash pre-check for instant results on known files; uploads new files and polls for analysis
- **URL scanning** — Submit any URL for full engine analysis
- **IP & Domain lookup** — Threat intelligence on IP addresses and domains
- **Hash lookup** — MD5, SHA-1, SHA-256 support
- **70+ engines** — Full engine breakdown with detection details
- **Scan history** — Stored locally in your browser (no server)
- **Dark / light mode** — Persistent theme preference
- **Export** — Download full JSON report for any scan
- **Single file** — The entire app is one `index.html`, zero dependencies to install

---

## Setup

### 1. Get a VirusTotal API key

Sign up free at [virustotal.com](https://www.virustotal.com) and copy your API key from your profile.

### 2. Set up a CORS proxy (Cloudflare Worker)

VirusTotal's API doesn't allow direct browser requests due to CORS. You need a proxy. The easiest way is a free Cloudflare Worker:

1. Go to [workers.cloudflare.com](https://workers.cloudflare.com) and create a free account
2. Create a new Worker and paste the following code:

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = 'https://www.virustotal.com/api/v3' + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.set('x-apikey', env.VT_API_KEY); // set in Worker env vars

    const proxied = new Request(target, {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? request.body : undefined,
    });

    const response = await fetch(proxied);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', '*');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: newHeaders });
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
};
```

3. In your Worker settings → **Variables**, add:
   - `VT_API_KEY` = your VirusTotal API key (mark as secret)
4. Deploy and copy your Worker URL (e.g. `https://your-worker.workers.dev`)

### 3. Configure the app

Open `index.html` and update the `PROXY` constant near the bottom:

```js
const PROXY = "https://your-worker.workers.dev";
```

### 4. Open in browser

That's it. Open `index.html` in any modern browser — no build step, no server needed.

---

## Rate Limits

VirusTotal's free API tier allows **4 requests per minute**. MSedge Scanner handles this automatically:

- The **hash pre-check** and **analysis polling** use a raw fetch (not rate-limited) so they don't consume your quota
- Only the final report fetch and URL/IP/hash lookups count against the limit
- The UI shows a cooldown indicator when the limit is hit

---

## Privacy

- Your API key lives in your Cloudflare Worker environment variable — never in the HTML
- Scan history is stored in `localStorage` in your browser only — nothing is sent to any external server beyond VirusTotal
- Uploaded files are sent directly to VirusTotal for analysis per their [Privacy Policy](https://www.virustotal.com/gui/privacy-policy)

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

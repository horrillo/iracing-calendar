# iRacing Calendar — Backend API

Node.js/Express backend. Scrapes **iracing.es/iracing/calendario-oficial** (public, no auth needed) to obtain live series data, and falls back to the static `calendar.json` when the scrape fails. All data is cached for **6 hours**.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Status, uptime, data source, current week, cache stats |
| `GET` | `/api/series` | All series (flat). Supports `?category`, `?license`, `?q` |
| `GET` | `/api/series/:categoria` | Series for one category, grouped by license |
| `GET` | `/api/week/:weekNumber` | All series + track for week 1–13 |
| `GET` | `/api/current-week` | Same as above, for today's active week |
| `GET` | `/api/tracks` | All unique tracks with configs |
| `GET` | `/api/special-events` | Special events (Daytona, Le Mans…) |
| `POST` | `/api/cache/clear` | Clear cache (requires `X-Admin-Key` header) |

### Category slugs

| Slug | Description |
|------|-------------|
| `road` | Road / Sports Car / Formula |
| `oval` | Oval |
| `dirt-road` | Dirt Road |
| `dirt-oval` | Dirt Oval |
| `unranked` | Unranked |

### Filter params (`/api/series`)

```
GET /api/series?category=oval&license=A&q=gt3
```

---

## Local development

```bash
cd backend
npm install
node server.js
# or with auto-reload:
node --watch server.js
```

Test endpoints:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/current-week
curl "http://localhost:3000/api/series?category=oval"
curl http://localhost:3000/api/week/5
```

The server reads `../public/data/calendar.json` and `../public/data/events.json` from the frontend folder as fallback — no separate setup needed.

---

## Deploy to Railway

### Step 1 — Create project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo**
3. Select the `horrillo/iracing-calendar` repository

### Step 2 — Set root directory

In **Settings → Build**:
- **Root Directory**: `backend`
- **Build Command**: `npm install` *(auto-detected)*
- **Start Command**: `node server.js` *(auto-detected via `railway.toml`)*

### Step 3 — Environment variables

In **Variables** add:

| Variable | Example value | Required |
|----------|---------------|----------|
| `ALLOWED_ORIGINS` | `https://iracing-calendar.vercel.app,http://localhost:3000` | ✅ |
| `CACHE_TTL_MS` | `21600000` (6 h) | optional |
| `ADMIN_KEY` | any secret string | optional |

`PORT` is set automatically by Railway — do not add it manually.

### Step 4 — Deploy

Click **Deploy Now**. After ~30 s your URL will be:
```
https://iracing-calendar-backend-production.up.railway.app
```

Verify with:
```bash
curl https://YOUR-RAILWAY-URL/health
```

### Step 5 — Connect the frontend

Open `public/js/app.js` and set:
```js
const BACKEND_URL = 'https://YOUR-RAILWAY-URL';
```

Commit and push — Vercel will redeploy automatically.

---

## How the scraper works

```
Request arrives
  └─ cache.get('calendar') ──hit──▶ respond immediately
         │
        miss
         │
         ▼
  scraper.scrapeCalendar()
    1. Check robots.txt of iracing.es
    2. GET https://iracing.es/iracing/calendario-oficial
       (with full browser headers to avoid 403)
    3. Parse HTML — 5 strategies in order:
       ① Tables (column headers → series rows)
       ② Category sections + nested series divs
       ③ Accordion / tab panels (Elementor, WPBakery…)
       ④ Broad class-name heuristics
       ⑤ Embedded JSON in <script> tags
    4. Enrich weeks with dates from SEASON_WEEKS
    5. Build structured JSON matching calendar.json schema
         │
        fail
         │
         ▼
  Read ../public/data/calendar.json (static fallback)
         │
         ▼
  cache.set('calendar', data, 6h)
         │
         ▼
  Respond to client
```

### Responsible scraping

- **Rate limit**: 1 outbound request every 6 seconds
- **robots.txt**: checked and respected before every domain
- **User-Agent**: full browser UA — clearly a legit client
- **Cache**: 6-hour TTL means at most ~4 requests/day to iracing.es
- **Fallback**: if scraping fails, always serves cached/static data

---

## Updating for a new season

Edit the `SEASON_WEEKS` array in `scraper.js`:

```js
const SEASON_WEEKS = [
  { week: 1, start: '2026-09-08', end: '2026-09-14' },
  // …13 weeks
];
```

Then clear the cache:
```bash
curl -X POST https://YOUR-RAILWAY-URL/api/cache/clear \
     -H 'X-Admin-Key: your-secret'
```

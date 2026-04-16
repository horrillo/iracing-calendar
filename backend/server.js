// ============================================
// server.js — iRacing Calendar Backend API
// Created by Horrillo | Deploy on Railway
// ============================================

import express   from 'express';
import cors      from 'cors';
import rateLimit from 'express-rate-limit';
import * as cache   from './cache.js';
import * as scraper from './scraper.js';

// ============================================
// CONFIG
// ============================================
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'https://iracing-calendar.vercel.app,http://localhost:3000,http://localhost:5173'
).split(',').map(o => o.trim());

const CACHE_TTL       = parseInt(process.env.CACHE_TTL_MS  || String(6 * 60 * 60 * 1000)); // 6 h
const ADMIN_KEY       = process.env.ADMIN_KEY || '';

// ============================================
// APP
// ============================================
const app = express();
app.set('trust proxy', 1); // needed behind Railway's proxy for rate-limit IP detection
app.use(express.json());

// ── CORS ──
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl / Postman / server-to-server
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    cb(Object.assign(new Error(`CORS: ${origin} not allowed`), { status: 403 }));
  },
  methods:     ['GET', 'OPTIONS'],
  credentials: false,
}));

// ── Global rate limiter ──
app.use(rateLimit({
  windowMs: 60_000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests — slow down.' },
}));

// Stricter limiter for endpoints that trigger live scraping
const scrapeLimiter = rateLimit({
  windowMs: 60_000,
  max:      10,
  message: { error: 'Too many scrape requests.' },
});

// ============================================
// HELPERS
// ============================================
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

/** Shared calendar loader: cache-first, then live scrape + static fallback */
async function getCalendar() {
  const CACHE_KEY = 'calendar';
  let cal = cache.get(CACHE_KEY);
  if (cal) return cal;

  const { data, source } = await scraper.getCalendarData();
  if (!data) return null;

  cal = { data, source, loadedAt: new Date().toISOString() };
  cache.set(CACHE_KEY, cal, CACHE_TTL);
  return cal;
}

// ============================================
// ROUTES
// ============================================

// ── GET /health ──────────────────────────────
app.get('/health', wrap(async (_req, res) => {
  const cal = cache.get('calendar');
  res.json({
    status:         'ok',
    uptime:         Math.round(process.uptime()) + 's',
    timestamp:      new Date().toISOString(),
    dataSource:     cal?.source ?? 'not loaded yet',
    lastLoaded:     cal?.loadedAt ?? null,
    totalSeries:    cal?.data?.meta?.totalSeries ?? null,
    currentWeek:    scraper.getCurrentWeek(),
    cache:          cache.stats(),
  });
}));

// ── GET /api/calendar ─────────────────────────
// Full calendar data in schema v2 (road/oval/dirt_oval/dirt_road + rookie/D/C/B/A)
app.get('/api/calendar', scrapeLimiter, wrap(async (_req, res) => {
  const cal = await getCalendar();
  if (!cal) return res.status(503).json({ error: 'Calendar data unavailable.' });
  res.json(cal.data);
}));

// ── GET /api/series ───────────────────────────
// All series, flat.
// ?category=road|oval|dirt_road|dirt_oval
// ?license=rookie|D|C|B|A
// ?q=search+term
app.get('/api/series', scrapeLimiter, wrap(async (req, res) => {
  const cal = await getCalendar();
  if (!cal) return res.status(503).json({ error: 'Calendar data unavailable.' });

  let series = scraper.getAllSeries(cal.data);

  // Apply filters
  const { category, license, q } = req.query;
  if (category) series = series.filter(s => s.category === category);
  if (license)  series = series.filter(s => s.license  === license.toUpperCase());
  if (q)        series = series.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));

  // Strip _weeks from list response
  const stripped = series.map(({ _weeks, weeks: _, ...s }) => s);

  res.json({
    meta: {
      source:      cal.source,
      loadedAt:    cal.loadedAt,
      season:      cal.data?.meta?.season,
      totalSeries: stripped.length,
    },
    series: stripped,
  });
}));

// ── GET /api/series/:categoria ────────────────
// Series grouped by license for one category.
// :categoria = road | oval | dirt-road | dirt-oval | unranked
app.get('/api/series/:categoria', wrap(async (req, res) => {
  const cal = await getCalendar();
  if (!cal) return res.status(503).json({ error: 'Calendar data unavailable.' });

  const { categoria } = req.params;
  const CACHE_KEY     = `series:cat:${categoria}`;

  let payload = cache.get(CACHE_KEY);
  if (!payload) {
    const list = scraper.getSeriesByCategory(cal.data, categoria);
    if (!list.length) return res.status(404).json({ error: `No series found for category "${categoria}".` });

    // Group by license for easy frontend rendering
    const byLicense = {};
    for (const s of list) {
      const lic = s.license || '?';
      if (!byLicense[lic]) byLicense[lic] = [];
      byLicense[lic].push(s);
    }

    payload = {
      meta:      { category: categoria, total: list.length, source: cal.source, loadedAt: cal.loadedAt },
      byLicense,
    };
    cache.set(CACHE_KEY, payload, CACHE_TTL);
  }

  res.json(payload);
}));

// ── GET /api/week/:weekNumber ─────────────────
// Every series + its track for a given week (1-13).
app.get('/api/week/:weekNumber', wrap(async (req, res) => {
  const cal = await getCalendar();
  if (!cal) return res.status(503).json({ error: 'Calendar data unavailable.' });

  const { weekNumber } = req.params;
  const wn = parseInt(weekNumber, 10);
  if (isNaN(wn) || wn < 1 || wn > 13) {
    return res.status(400).json({ error: 'weekNumber must be 1–13.' });
  }

  const CACHE_KEY = `week:${wn}`;
  let payload = cache.get(CACHE_KEY);
  if (!payload) {
    const entries = scraper.getSeriesForWeek(cal.data, wn);
    const weeks   = scraper.getSeasonWeeks();
    const weekMeta = weeks.find(w => w.week === wn) || {};

    payload = {
      meta: {
        week:     wn,
        start:    weekMeta.start,
        end:      weekMeta.end,
        total:    entries.length,
        source:   cal.source,
        loadedAt: cal.loadedAt,
      },
      entries,
    };
    cache.set(CACHE_KEY, payload, CACHE_TTL);
  }

  res.json(payload);
}));

// ── GET /api/current-week ─────────────────────
// Same as /api/week/:n but for today's active week.
app.get('/api/current-week', wrap(async (req, res) => {
  const cal = await getCalendar();
  if (!cal) return res.status(503).json({ error: 'Calendar data unavailable.' });

  const currentWeek = scraper.getCurrentWeek();
  if (!currentWeek) {
    return res.status(404).json({
      error:   'No active race week right now (off-season).',
      season:  cal.data?.meta?.season,
    });
  }

  const CACHE_KEY = `week:${currentWeek}`;
  let payload = cache.get(CACHE_KEY);
  if (!payload) {
    const entries  = scraper.getSeriesForWeek(cal.data, currentWeek);
    const weeks    = scraper.getSeasonWeeks();
    const weekMeta = weeks.find(w => w.week === currentWeek) || {};

    payload = {
      meta: {
        week:     currentWeek,
        start:    weekMeta.start,
        end:      weekMeta.end,
        total:    entries.length,
        source:   cal.source,
        loadedAt: cal.loadedAt,
      },
      entries,
    };
    cache.set(CACHE_KEY, payload, CACHE_TTL);
  }

  res.json(payload);
}));

// ── GET /api/tracks ───────────────────────────
app.get('/api/tracks', wrap(async (_req, res) => {
  const cal = await getCalendar();
  if (!cal) return res.status(503).json({ error: 'Calendar data unavailable.' });

  const CACHE_KEY = 'tracks';
  let payload = cache.get(CACHE_KEY);
  if (!payload) {
    const tracks = scraper.getTracksData(cal.data);
    payload = { meta: { total: tracks.length, source: cal.source }, tracks };
    cache.set(CACHE_KEY, payload, CACHE_TTL);
  }
  res.json(payload);
}));

// ── GET /api/special-events ───────────────────
app.get('/api/special-events', wrap(async (_req, res) => {
  const CACHE_KEY = 'special-events';
  let payload = cache.get(CACHE_KEY);
  if (!payload) {
    const { events, source } = await scraper.getEventsData();
    payload = { meta: { total: events.length, source }, events };
    cache.set(CACHE_KEY, payload, CACHE_TTL);
  }
  res.json(payload);
}));

// ── POST /api/cache/clear ─────────────────────
app.post('/api/cache/clear', (req, res) => {
  if (ADMIN_KEY && req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  cache.clear();
  console.log('[server] Cache cleared via API');
  res.json({ ok: true, clearedAt: new Date().toISOString() });
});

// ============================================
// ERROR HANDLERS
// ============================================
app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.status === 403 || err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('[server]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ============================================
// START
// ============================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  iRacing Calendar — Backend API              ║
║  Port : ${String(PORT).padEnd(38)}║
║  Cache: ${String(Math.round(CACHE_TTL/3600000)+'h').padEnd(38)}║
║  Source: iracing.es (+ static fallback)      ║
╚══════════════════════════════════════════════╝

  Endpoints:
    GET  /health
    GET  /api/series[?category&license&q]
    GET  /api/series/:categoria
    GET  /api/week/:weekNumber
    GET  /api/current-week
    GET  /api/tracks
    GET  /api/special-events
    POST /api/cache/clear  (X-Admin-Key required)

  Allowed origins: ${ALLOWED_ORIGINS.join(', ')}
`);
});

// ============================================
// scraper.js — iracing.es public calendar scraper
// Target: https://iracing.es/iracing/calendario-oficial
//
// Responsible scraping:
//   · Full browser headers to avoid 403
//   · Rate-limited (1 req / 6 s)
//   · robots.txt checked before each domain
//   · 6-hour cache TTL (data rarely changes mid-season)
//   · Graceful fallback to static calendar.json
// ============================================

import fetch   from 'node-fetch';
import * as ch from 'cheerio';
import fs      from 'fs';
import path    from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
// CONFIG
// ============================================
const TARGET_URL    = 'https://iracing.es/iracing/calendario-oficial';
const USER_AGENT    = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const REQUEST_DELAY = 6000;   // ms between outbound requests
const FETCH_TIMEOUT = 15000;  // ms per request

const STATIC_CALENDAR = path.join(__dirname, '../public/data/calendar.json');
const STATIC_EVENTS   = path.join(__dirname, '../public/data/events.json');

// ============================================
// SEASON WEEKS  (Season 2 · 2026)
// Update here when a new season starts.
// ============================================
const SEASON_WEEKS = [
  { week: 1,  start: '2026-03-17', end: '2026-03-23' },
  { week: 2,  start: '2026-03-24', end: '2026-03-30' },
  { week: 3,  start: '2026-03-31', end: '2026-04-06' },
  { week: 4,  start: '2026-04-07', end: '2026-04-13' },
  { week: 5,  start: '2026-04-14', end: '2026-04-20' },
  { week: 6,  start: '2026-04-21', end: '2026-04-27' },
  { week: 7,  start: '2026-04-28', end: '2026-05-04' },
  { week: 8,  start: '2026-05-05', end: '2026-05-11' },
  { week: 9,  start: '2026-05-12', end: '2026-05-18' },
  { week: 10, start: '2026-05-19', end: '2026-05-25' },
  { week: 11, start: '2026-05-26', end: '2026-06-01' },
  { week: 12, start: '2026-06-02', end: '2026-06-08' },
  { week: 13, start: '2026-06-09', end: '2026-06-15' },
];

// Category name normalisation (Spanish labels → internal keys)
const CATEGORY_MAP = {
  'road':       'road',
  'road car':   'road',
  'oval':       'oval',
  'dirt road':  'dirt-road',
  'dirt oval':  'dirt-oval',
  'unranked':   'unranked',
};

// License name normalisation
const LICENSE_MAP = {
  'rookie': 'R', 'novato': 'R',
  'd': 'D', 'clase d': 'D',
  'c': 'C', 'clase c': 'C',
  'b': 'B', 'clase b': 'B',
  'a': 'A', 'clase a': 'A',
  'pro': 'PRO', 'pro/wc': 'PRO',
};

// ============================================
// RATE LIMITER
// ============================================
let lastRequest = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function rateLimit() {
  const wait = REQUEST_DELAY - (Date.now() - lastRequest);
  if (wait > 0) {
    console.log(`[scraper] rate-limit: waiting ${wait}ms`);
    await sleep(wait);
  }
  lastRequest = Date.now();
}

// ============================================
// FETCH  with full browser headers
// ============================================
async function browserFetch(url) {
  await rateLimit();
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    console.log(`[scraper] GET ${url}`);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':                USER_AGENT,
        'Accept':                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language':           'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding':           'gzip, deflate, br',
        'Connection':                'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest':            'document',
        'Sec-Fetch-Mode':            'navigate',
        'Sec-Fetch-Site':            'none',
        'Cache-Control':             'max-age=0',
        'DNT':                       '1',
      }
    });
    clearTimeout(tid);
    console.log(`[scraper] → HTTP ${res.status} (${res.headers.get('content-type') || 'unknown'})`);
    return res;
  } catch (err) {
    clearTimeout(tid);
    console.warn(`[scraper] fetch error: ${err.message}`);
    return null;
  }
}

// ============================================
// robots.txt check (cached per domain)
// ============================================
const robotsCache = new Map();

async function isAllowed(url) {
  try {
    const { origin } = new URL(url);
    if (!robotsCache.has(origin)) {
      const res = await browserFetch(`${origin}/robots.txt`);
      const txt = res ? await res.text() : '';
      const disallowed = [];
      let match = false;
      for (const line of txt.split('\n').map(l => l.trim())) {
        if (/^User-agent:\s*\*/i.test(line) || new RegExp('User-agent:\\s*' + USER_AGENT.split('/')[0], 'i').test(line)) {
          match = true;
        } else if (/^User-agent:/i.test(line)) {
          match = false;
        } else if (match && /^Disallow:\s*/i.test(line)) {
          const p = line.replace(/^Disallow:\s*/i, '').trim();
          if (p) disallowed.push(p);
        }
      }
      robotsCache.set(origin, disallowed);
      console.log(`[scraper] robots.txt for ${origin}: ${disallowed.length} disallow rules`);
    }
    const pathname = new URL(url).pathname;
    const blocked  = robotsCache.get(origin).some(d => pathname.startsWith(d));
    if (blocked) console.warn(`[scraper] robots.txt blocks: ${url}`);
    return !blocked;
  } catch { return true; }
}

// ============================================
// STATIC FALLBACK
// ============================================
function loadStatic(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`[scraper] Cannot read ${filePath}: ${e.message}`);
    return null;
  }
}

// ============================================
// HTML PARSER — iracing.es/iracing/calendario-oficial
//
// Strategy order (tries each until data is found):
//   1. Tables  — week rows inside a <table>
//   2. Accordion / tabs  — common in WordPress page builders
//   3. Data attributes   — custom HTML5 attrs
//   4. Generic divs      — broad class-name heuristics
//   5. Embedded JSON     — window.__STATE__, __NEXT_DATA__, etc.
// ============================================

function parseHtml(html) {
  const $ = ch.load(html);
  const series = [];

  // ---------- helpers ----------

  function normCategory(raw) {
    const key = (raw || '').toLowerCase().trim().replace(/[^a-z ]/g, '');
    return CATEGORY_MAP[key] || key || 'road';
  }

  function normLicense(raw) {
    const key = (raw || '').toLowerCase().trim();
    return LICENSE_MAP[key] || raw?.toUpperCase() || '?';
  }

  function extractWeeks($el) {
    const weeks = [];
    // Look for week cells: anything containing "Semana X" or "Week X"
    $el.find('[class*="week"], [class*="semana"], [class*="round"], td, li').each((_, node) => {
      const text = $(node).text().trim();
      const mWeek  = text.match(/(?:semana|week|wk|ronda|round)[.\s#]*(\d+)/i);
      const mTrack = text.replace(/(?:semana|week|wk|ronda|round)[.\s#]*\d+/i, '').trim();
      if (mWeek && mTrack) {
        weeks.push({ week: parseInt(mWeek[1], 10), track: mTrack });
      }
    });

    // If nothing found, try sequential children
    if (!weeks.length) {
      let weekNum = 1;
      $el.find('td, li, [class*="track"], [class*="circuit"], [class*="pista"]').each((_, node) => {
        const t = $(node).text().trim();
        if (t && t.length > 2 && !t.match(/^\d+$/)) {
          weeks.push({ week: weekNum++, track: t });
        }
      });
    }
    return weeks;
  }

  // ─────────────────────────────────────────
  // STRATEGY 1 · Tables
  // Typical WordPress layout: <table> where each <tr> is a series,
  // columns: Name | Category | License | Car | Week1 | Week2 | …
  // ─────────────────────────────────────────
  let headers = [];
  $('table').each((_, table) => {
    const $table = $(table);
    const $rows  = $table.find('tr');
    if ($rows.length < 2) return;

    // Build header map from first row
    const $hdr = $($rows[0]).find('th, td');
    const localHeaders = [];
    $hdr.each((_, h) => localHeaders.push($(h).text().trim().toLowerCase()));

    if (!localHeaders.some(h => h.includes('serie') || h.includes('series') || h.includes('name') || h.includes('nombre'))) return;

    headers = localHeaders;
    console.log(`[scraper] Strategy 1 (table): headers = [${headers.join(', ')}]`);

    $rows.slice(1).each((_, tr) => {
      const $cells = $(tr).find('td');
      if ($cells.length < 2) return;

      const get = keyword => {
        const idx = headers.findIndex(h => h.includes(keyword));
        return idx >= 0 ? $($cells[idx]).text().trim() : '';
      };

      const name    = get('serie') || get('series') || get('name') || get('nombre') || $($cells[0]).text().trim();
      if (!name || name.length < 3) return;

      const weeks = [];
      headers.forEach((h, i) => {
        const mWeek = h.match(/^(?:semana|week|wk|s|w)\s*(\d+)$/i);
        if (mWeek) {
          const track = $($cells[i]).text().trim();
          if (track) weeks.push({ week: parseInt(mWeek[1], 10), track });
        }
      });

      series.push({
        name,
        category: normCategory(get('categor') || get('type') || get('tipo')),
        license:  normLicense(get('licenci') || get('license') || get('clase')),
        car:      get('coche') || get('car') || get('vehículo') || '',
        weeks,
      });
    });
  });

  if (series.length) {
    console.log(`[scraper] Strategy 1 found ${series.length} series`);
    return series;
  }

  // ─────────────────────────────────────────
  // STRATEGY 2 · Category sections + nested series
  // Pattern: <div class="category-road"> ... <div class="serie"> …
  // ─────────────────────────────────────────
  const catSelectors = [
    '[class*="categoria"], [class*="category"]',
    '[class*="road"], [class*="oval"], [class*="dirt"]',
    'section, article',
    '.tab-content > div, .tab-pane',
    '[id*="road"], [id*="oval"], [id*="dirt"]',
  ];

  for (const catSel of catSelectors) {
    $(catSel).each((_, catEl) => {
      const $cat     = $(catEl);
      const catLabel = $cat.attr('data-category') ||
                       $cat.attr('data-type')     ||
                       $cat.find('h2, h3, h4').first().text().trim() ||
                       $cat.attr('class')          ||
                       '';
      const category = normCategory(catLabel);

      // Find series within this category block
      const serieSelectors = ['[class*="serie"], [class*="series"]', '[class*="row"]:not(:first-child)', 'article', '.entry'];
      for (const sSel of serieSelectors) {
        $cat.find(sSel).each((_, sEl) => {
          const $s     = $(sEl);
          const name   = $s.find('[class*="name"], [class*="nombre"], [class*="title"], h2, h3, h4, strong').first().text().trim();
          if (!name || name.length < 3) return;

          const license = normLicense(
            $s.find('[class*="licenci"], [class*="license"], [class*="clase"]').first().text().trim()
          );
          const car     = $s.find('[class*="coche"], [class*="car"], [class*="vehicle"]').first().text().trim();
          const weeks   = extractWeeks($s);

          series.push({ name, category, license, car, weeks });
        });
      }
    });
    if (series.length) break;
  }

  if (series.length) {
    console.log(`[scraper] Strategy 2 found ${series.length} series`);
    return series;
  }

  // ─────────────────────────────────────────
  // STRATEGY 3 · Accordion / tabs (Elementor, WPBakery, Divi…)
  // Pattern: clicking a header reveals a panel with schedule
  // HTML is fully present; just hidden via CSS
  // ─────────────────────────────────────────
  const accordionPanels = [
    '[class*="accordion-content"]',
    '[class*="panel-body"]',
    '[class*="tab-content"]',
    '[class*="toggle-content"]',
    '[class*="elementor-tab-content"]',
    '[class*="vc_tta-panel-body"]',
  ];

  for (const panelSel of accordionPanels) {
    $(panelSel).each((_, panel) => {
      const $panel = $(panel);
      const title  = $panel.closest('[class*="accordion-item"], [class*="panel"], [class*="tab"]')
                           .find('[class*="title"], [class*="header"], [class*="heading"]')
                           .first().text().trim();
      if (!title) return;

      // Each row/item inside the panel is a series
      $panel.find('tr:not(:first-child), [class*="row"]:not(:first-child), li').each((_, row) => {
        const $row = $(row);
        const name = $row.find('td:first-child, [class*="name"]').text().trim() || $row.text().trim().split('\n')[0];
        if (!name || name.length < 3) return;
        const weeks = extractWeeks($row);
        series.push({
          name,
          category: normCategory(title),
          license:  '?',
          car:      '',
          weeks,
        });
      });
    });
    if (series.length) break;
  }

  if (series.length) {
    console.log(`[scraper] Strategy 3 found ${series.length} series`);
    return series;
  }

  // ─────────────────────────────────────────
  // STRATEGY 4 · Broad heuristic scan
  // Walk ALL elements; any that look like a series name
  // followed by track-like children get harvested.
  // ─────────────────────────────────────────
  $('[class]').each((_, el) => {
    const cls  = $(el).attr('class') || '';
    const text = $(el).clone().children().remove().end().text().trim();
    if (!text || text.length < 5 || text.length > 120) return;

    // Skip navigation, headers, footers, menus
    if (cls.match(/nav|menu|header|footer|logo|sidebar|widget|button|btn|icon|social|comment|breadcrumb/i)) return;

    // Looks like a series name: capitalised, no common navigation words
    if (text.match(/series|serie|cup|championship|liga|open|trophy|race|challenge/i)) {
      const category = (() => {
        // Walk up to find a parent with a category hint
        let node = el;
        for (let i = 0; i < 5; i++) {
          node = $(node).parent()[0];
          if (!node) break;
          const parentText = $(node).find('h2, h3, h4').first().text().toLowerCase();
          for (const [k, v] of Object.entries(CATEGORY_MAP)) {
            if (parentText.includes(k)) return v;
          }
        }
        return 'road';
      })();

      const $container = $(el).closest('div, article, section, li');
      const weeks = extractWeeks($container);

      if (weeks.length > 0) {
        series.push({ name: text, category, license: '?', car: '', weeks });
      }
    }
  });

  if (series.length) {
    console.log(`[scraper] Strategy 4 found ${series.length} series`);
    return series;
  }

  // ─────────────────────────────────────────
  // STRATEGY 5 · Embedded JSON in <script> tags
  // (Next.js, Nuxt, Gatsby, custom SPAs)
  // ─────────────────────────────────────────
  const jsonPatterns = [
    /window\.__(?:STATE|DATA|APP|INITIAL_STATE|NEXT_DATA)__\s*=\s*({[\s\S]+?});/,
    /__NEXT_DATA__['"]\s*type=['"]application\/json['"][^>]*>({[\s\S]+?})</,
    /var\s+(?:series|calendar|schedule|data)\s*=\s*(\[[\s\S]+?\]);/,
  ];

  let embeddedData = null;
  $('script:not([src])').each((_, el) => {
    if (embeddedData) return;
    const src = $(el).html() || '';
    for (const pat of jsonPatterns) {
      const m = src.match(pat);
      if (m) {
        try { embeddedData = JSON.parse(m[1]); break; } catch { /* skip */ }
      }
    }
  });

  if (embeddedData) {
    console.log('[scraper] Strategy 5: found embedded JSON, attempting normalisation');
    const raw = embeddedData?.props?.pageProps ?? embeddedData;
    // Try to walk common keys that might hold series data
    for (const key of ['series', 'schedule', 'calendar', 'data', 'items']) {
      const arr = raw?.[key];
      if (Array.isArray(arr) && arr.length) {
        console.log(`[scraper] Strategy 5: key "${key}" has ${arr.length} items`);
        return arr; // caller normalises
      }
    }
  }

  console.warn('[scraper] All strategies failed — no series data extracted');
  return [];
}

// ============================================
// MAIN SCRAPE FUNCTION
// ============================================
export async function scrapeCalendar() {
  if (!(await isAllowed(TARGET_URL))) {
    console.warn('[scraper] robots.txt disallows scraping target URL');
    return null;
  }

  const res = await browserFetch(TARGET_URL);
  if (!res) return null;

  if (res.status === 403) {
    console.warn('[scraper] 403 Forbidden — site may require Cloudflare bypass or cookie.');
    return null;
  }
  if (!res.ok) {
    console.warn(`[scraper] Non-OK status: ${res.status}`);
    return null;
  }

  const html   = await res.text();
  const series = parseHtml(html);

  if (!series.length) return null;

  // Enrich with week dates from SEASON_WEEKS
  for (const s of series) {
    for (const w of (s.weeks || [])) {
      const sw = SEASON_WEEKS.find(x => x.week === w.week);
      if (sw) { w.date = sw.start; }
    }
    // Fill missing weeks as "TBD" so every series has 13 entries
    const existing = new Set((s.weeks || []).map(w => w.week));
    for (const sw of SEASON_WEEKS) {
      if (!existing.has(sw.week)) {
        s.weeks.push({ week: sw.week, date: sw.start, track: 'TBD' });
      }
    }
    s.weeks.sort((a, b) => a.week - b.week);
  }

  return buildStructuredCalendar(series);
}

// ============================================
// BUILD STRUCTURED CALENDAR
// Returns the same shape as calendar.json so the
// rest of the codebase works without changes.
// ============================================
function buildStructuredCalendar(seriesArray) {
  const categories = {};
  for (const s of seriesArray) {
    const cat = s.category || 'road';
    const lic = s.license  || 'R';
    if (!categories[cat]) categories[cat] = { R: [], D: [], C: [], B: [], A: [], PRO: [], '?': [] };
    if (!categories[cat][lic]) categories[cat][lic] = [];
    categories[cat][lic].push({
      name:           s.name,
      fixed:          s.fixed || false,
      car:            s.car   || '',
      license_range:  s.license || '?',
      race_frequency: s.race_frequency || '',
      incidents:      s.incidents      || '',
      weeks:          s.weeks || [],
    });
  }

  return {
    meta: {
      season:      'Season 2 · 2026',
      generatedAt: new Date().toISOString(),
      source:      'iracing.es',
      totalSeries: seriesArray.length,
      weeks:       SEASON_WEEKS,
    },
    series: categories,
  };
}

// ============================================
// CURRENT WEEK HELPER
// ============================================
export function getCurrentWeek() {
  const today = new Date();
  for (const w of SEASON_WEEKS) {
    const s = new Date(w.start);
    const e = new Date(w.end); e.setHours(23, 59, 59);
    if (today >= s && today <= e) return w.week;
  }
  return null; // off-season
}

export function getSeasonWeeks() { return SEASON_WEEKS; }

// ============================================
// GETTERS (used by server.js)
// All accept an already-loaded calendarData object
// to avoid repeated disk reads.
// ============================================

/** All series, flat array with category/license metadata */
export function getAllSeries(calendarData) {
  if (!calendarData?.series) return [];
  const result = [];
  let id = 0;
  for (const [category, byLicense] of Object.entries(calendarData.series)) {
    for (const [license, list] of Object.entries(byLicense)) {
      for (const s of list) {
        result.push({ id: String(id++), ...s, category, license });
      }
    }
  }
  return result;
}

/** Series filtered by category slug */
export function getSeriesByCategory(calendarData, categorySlug) {
  const CAT_KEYS = {
    road:       'road',
    oval:       'oval',
    'dirt-road': 'dirt-road',
    'dirt-oval': 'dirt-oval',
    unranked:   'unranked',
    // Also accept static-data names
    'OVAL':       'oval',
    'SPORTS CAR': 'road',
    'FORMULA CAR':'road',
    'DIRT OVAL':  'dirt-oval',
    'DIRT ROAD':  'dirt-road',
    'UNRANKED':   'unranked',
  };
  const target = CAT_KEYS[categorySlug] || categorySlug;
  const byLicense = calendarData?.series?.[target] || calendarData?.series?.[categorySlug] || {};
  const result = [];
  let id = 0;
  for (const [license, list] of Object.entries(byLicense)) {
    for (const s of list) {
      result.push({ id: String(id++), ...s, category: target, license });
    }
  }
  return result;
}

/** All series that race in a given week */
export function getSeriesForWeek(calendarData, weekNumber) {
  const wn = parseInt(weekNumber, 10);
  if (isNaN(wn)) return [];
  const all = getAllSeries(calendarData);
  return all
    .map(s => {
      const week = (s.weeks || []).find(w => w.week === wn);
      if (!week) return null;
      return {
        id:       s.id,
        name:     s.name,
        category: s.category,
        license:  s.license,
        car:      s.car || '',
        track:    week.track,
        date:     week.date   || '',
        temp_c:   week.temp_c ?? null,
        rain:     week.rain   || 'None',
        duration: week.duration || '',
        start_type: week.start_type || '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================
// HIGH-LEVEL DATA ACCESSORS
// ============================================

/**
 * Returns calendar data.
 * Tries live scrape → static fallback.
 */
export async function getCalendarData(forceRefresh = false) {
  // Try live scrape
  try {
    const scraped = await scrapeCalendar();
    if (scraped) {
      console.log(`[scraper] Live scrape OK: ${scraped.meta.totalSeries} series`);
      return { data: scraped, source: 'live' };
    }
  } catch (err) {
    console.warn(`[scraper] Live scrape failed: ${err.message}`);
  }

  // Fall back to static file
  const staticData = loadStatic(STATIC_CALENDAR);
  if (staticData) {
    console.log('[scraper] Using static calendar.json fallback');
    return { data: staticData, source: 'static' };
  }

  return { data: null, source: 'none' };
}

/** Returns special events data (always from static file). */
export function getEventsData() {
  const events = loadStatic(STATIC_EVENTS);
  return {
    events: events?.events || [],
    source: 'static',
  };
}

/** Tracks list derived from calendar data */
export function getTracksData(calendarData) {
  const trackMap = new Map();
  for (const [, byLic] of Object.entries(calendarData?.series || {})) {
    for (const [, list] of Object.entries(byLic)) {
      for (const s of list) {
        for (const w of (s.weeks || [])) {
          if (!w.track || w.track === 'TBD') continue;
          const base = w.track.split(' - ')[0].trim();
          const cfg  = w.track.includes(' - ') ? w.track.split(' - ').slice(1).join(' - ').trim() : 'Default';
          if (!trackMap.has(base)) trackMap.set(base, { name: base, configs: new Set(), usedBy: [] });
          trackMap.get(base).configs.add(cfg);
          if (!trackMap.get(base).usedBy.includes(s.name)) trackMap.get(base).usedBy.push(s.name);
        }
      }
    }
  }
  return [...trackMap.values()]
    .map(t => ({ name: t.name, configs: [...t.configs], usedBy: t.usedBy }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

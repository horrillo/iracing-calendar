// ============================================
// scraper.js — iracing.es public calendar scraper  v3
// Target: https://iracing.es/iracing/calendario-oficial
//
// Responsible scraping:
//   · Full browser headers to avoid 403
//   · Rate-limited (1 req / 6 s)
//   · robots.txt checked and respected
//   · 6-hour cache TTL
//   · Graceful fallback to static calendar.json (schema v2)
// ============================================

import fetch            from 'node-fetch';
import * as ch          from 'cheerio';
import fs               from 'fs';
import path             from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
// CONFIG
// ============================================
const TARGET_URL    = 'https://iracing.es/iracing/calendario-oficial';
const USER_AGENT    = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const REQUEST_DELAY = 6000;
const FETCH_TIMEOUT = 20000;

const STATIC_CALENDAR = path.join(__dirname, '../public/data/calendar.json');
const STATIC_EVENTS   = path.join(__dirname, '../public/data/events.json');

// ============================================
// SEASON WEEKS  (Season 2 · 2026)
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

// ============================================
// NORMALISATION MAPS
// Spanish labels from iracing.es → internal keys
// ============================================

// How iracing.es labels categories (Spanish + English variants)
const CATEGORY_LABELS = [
  { key: 'road',      patterns: ['circuito', 'road', 'carretera', 'asfalto', 'sport', 'formula', 'sports car', 'formula car', 'gt', 'turismo'] },
  { key: 'oval',      patterns: ['oval'] },
  { key: 'dirt_road', patterns: ['tierra.*carretera', 'dirt.*road', 'tierra.*road', 'off.*road', 'rallycross', 'tierra carretera'] },
  { key: 'dirt_oval', patterns: ['tierra.*oval', 'dirt.*oval', 'tierra oval'] },
  { key: 'unranked',  patterns: ['unranked', 'sin.*ranking', 'sin clasificar'] },
];

// How iracing.es labels license levels
const LICENSE_LABELS = [
  { key: 'rookie', patterns: ['rookie', 'novato', 'principiante', 'r ('] },
  { key: 'D',      patterns: ['clase d', 'class d', '\\bd\\b', 'd ('] },
  { key: 'C',      patterns: ['clase c', 'class c', '\\bc\\b', 'c ('] },
  { key: 'B',      patterns: ['clase b', 'class b', '\\bb\\b', 'b ('] },
  { key: 'A',      patterns: ['clase a', 'class a', '\\ba\\b', 'a ('] },
];

function normCategory(raw) {
  const t = (raw || '').toLowerCase().trim();
  for (const { key, patterns } of CATEGORY_LABELS) {
    if (patterns.some(p => new RegExp(p).test(t))) return key;
  }
  return null;
}

function normLicense(raw) {
  const t = (raw || '').toLowerCase().trim();
  for (const { key, patterns } of LICENSE_LABELS) {
    if (patterns.some(p => new RegExp(p).test(t))) return key;
  }
  // Fallback: single letter
  const m = t.match(/^([rdcba])$/i);
  if (m) {
    const l = m[1].toUpperCase();
    return l === 'R' ? 'rookie' : l;
  }
  return null;
}

// ============================================
// RATE LIMITER
// ============================================
let lastRequest = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function rateLimit() {
  const wait = REQUEST_DELAY - (Date.now() - lastRequest);
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
}

// ============================================
// FETCH with full browser headers
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
    console.log(`[scraper] HTTP ${res.status}`);
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
      const txt = res?.ok ? await res.text() : '';
      const disallowed = [];
      let inBlock = false;
      for (const line of txt.split('\n').map(l => l.trim())) {
        if (/^User-agent:\s*\*/i.test(line)) { inBlock = true; }
        else if (/^User-agent:/i.test(line))  { inBlock = false; }
        else if (inBlock && /^Disallow:\s*/i.test(line)) {
          const p = line.replace(/^Disallow:\s*/i, '').trim();
          if (p) disallowed.push(p);
        }
      }
      robotsCache.set(origin, disallowed);
    }
    const pathname = new URL(url).pathname;
    return !robotsCache.get(origin).some(d => pathname.startsWith(d));
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
// EMPTY CALENDAR SKELETON
// ============================================
function emptyCalendar() {
  return {
    road:      { rookie: [], D: [], C: [], B: [], A: [] },
    oval:      { rookie: [], D: [], C: [], B: [], A: [] },
    dirt_road: { rookie: [], D: [], C: [], B: [], A: [] },
    dirt_oval: { rookie: [], D: [], C: [], B: [], A: [] },
    unranked:  { rookie: [], D: [], C: [], B: [], A: [] },
  };
}

// ============================================
// HTML PARSER — iracing.es/iracing/calendario-oficial
//
// iracing.es is a WordPress/Elementor site.
// The page organises data in one of these patterns:
//
//   A. Tabs/panels by CATEGORY, then headings by LICENSE
//      <div id="road">
//        <h2>Rookie</h2> <table>…</table>
//        <h2>Clase D</h2> <table>…</table>
//      </div>
//
//   B. Sections by LICENSE, sub-sections by CATEGORY
//      <h2>Rookie</h2>
//        <h3>Road</h3> <table>…</table>
//
//   C. Single big table with columns: Serie | Coche | Licencia | Categoría | S1 | S2 | …
//
// We try all strategies in order, take the first that yields >= 5 series.
// ============================================

function parseHtml(html) {
  const $ = ch.load(html);

  // Remove noise
  $('script, style, nav, header, footer, .sidebar, .widget, .menu, .advertisement, .ad').remove();

  // ── helpers ─────────────────────────────────────────────────────────────

  function headingCategory(text) {
    return normCategory(text);
  }
  function headingLicense(text) {
    return normLicense(text);
  }

  // Extract week→track pairs from a row/container element
  function extractWeeks($el) {
    const weeks = [];

    // Look for cells with "Semana X" or "Week X" text patterns
    $el.find('td, th, li, [class*="week"], [class*="semana"]').each((_, node) => {
      const txt = $(node).text().trim();
      const mW  = txt.match(/(?:semana|week|wk|s)[.\s#]*(\d+)[.\s:]*(.*)/i);
      if (mW) {
        const wNum   = parseInt(mW[1], 10);
        const wTrack = mW[2].trim() || $(node).next().text().trim();
        if (wNum >= 1 && wNum <= 13 && wTrack) {
          weeks.push({ week: wNum, track: wTrack });
        }
      }
    });

    if (weeks.length) return weeks;

    // Fallback: sequential non-header cells → assume they are week tracks in order
    let n = 1;
    $el.find('td').each((_, node) => {
      const txt = $(node).text().trim();
      if (txt && txt.length > 2 && txt.length < 120 && !/^[\d.]+$/.test(txt)) {
        weeks.push({ week: n++, track: txt });
        if (n > 13) return false;
      }
    });

    return weeks;
  }

  // ── STRATEGY A: Tabs by category, headings by license ───────────────────
  // WordPress tab/accordion plugins put content in divs with id= the tab slug.
  // Look for: tab panels that contain license headings and series tables.
  {
    const catPanels = [];

    // Collect all elements that carry a category hint in id/class/data-attr
    $('[id], [class*="tab"], [class*="panel"], [class*="pane"]').each((_, el) => {
      const id    = ($(el).attr('id')    || '').toLowerCase();
      const cls   = ($(el).attr('class') || '').toLowerCase();
      const hint  = id + ' ' + cls;
      const cat   = normCategory(hint);
      if (cat) catPanels.push({ cat, $el: $(el) });
    });

    if (catPanels.length) {
      const series = [];
      for (const { cat, $el } of catPanels) {
        // Look for license headings within this panel
        $el.find('h1, h2, h3, h4, h5, h6, .heading, .section-title, [class*="license"], [class*="licencia"]').each((_, hEl) => {
          const hText = $(hEl).text().trim();
          const lic   = headingLicense(hText);
          if (!lic) return;

          // Gather all series tables/rows between this heading and the next
          const $section = $(hEl).nextUntil('h1, h2, h3, h4, h5, h6');

          // Try tables first
          $section.filter('table, div').addBack('table, div').find('table').addBack('table').each((_, tbl) => {
            const $rows = $(tbl).find('tr');
            if ($rows.length < 2) return;

            const $hdrs    = $($rows[0]).find('th, td').map((_, c) => $(c).text().trim().toLowerCase()).get();
            const nameIdx  = $hdrs.findIndex(h => /serie|name|nombre/i.test(h));
            const carIdx   = $hdrs.findIndex(h => /coche|car|vehicle|veh/i.test(h));
            const fixedIdx = $hdrs.findIndex(h => /fixed|fijo/i.test(h));

            // Week columns: "s1", "semana 1", "week 1", "1"
            const weekCols = [];
            $hdrs.forEach((h, i) => {
              const m = h.match(/^(?:semana|week|s|w)\s*(\d+)$/) || h.match(/^(\d+)$/);
              if (m) weekCols.push({ col: i, week: parseInt(m[1], 10) });
            });

            $rows.slice(1).each((_, tr) => {
              const $cells = $(tr).find('td');
              if ($cells.length < 2) return;

              const cell  = i => $($cells[i])?.text().trim() || '';
              const name  = nameIdx >= 0 ? cell(nameIdx) : cell(0);
              if (!name || name.length < 3) return;

              const car   = carIdx   >= 0 ? cell(carIdx)   : '';
              const fixed = fixedIdx >= 0 ? /sí|si|yes|true|x/i.test(cell(fixedIdx)) : false;
              const weeks = weekCols.length
                ? weekCols.map(({ col, week }) => ({ week, track: cell(col) })).filter(w => w.track)
                : extractWeeks($(tr));

              series.push({ name, car, fixed, license: lic, category: cat, weeks });
            });
          });

          // If no table, look for list items / divs as rows
          if (!series.length || series[series.length - 1].license !== lic) {
            $section.filter('ul, ol').find('li').each((_, li) => {
              const text = $(li).text().trim();
              if (text.length < 3) return;
              series.push({ name: text, car: '', fixed: false, license: lic, category: cat, weeks: [] });
            });
          }
        });
      }
      if (series.length >= 5) {
        console.log(`[scraper] Strategy A (tabs by category) → ${series.length} series`);
        return series;
      }
    }
  }

  // ── STRATEGY B: Headings by license, sub-sections by category ───────────
  {
    const series = [];
    $('h1, h2, h3').each((_, hEl) => {
      const hText = $(hEl).text().trim();
      const lic   = headingLicense(hText);
      if (!lic) return;

      // Look for category sub-headings or just table rows under this license heading
      const $after = $(hEl).nextUntil('h1, h2, h3');

      // Sub-category headings within this license block
      $after.filter('h3, h4').each((_, subH) => {
        const catText = $(subH).text().trim();
        const cat     = headingCategory(catText);
        if (!cat) return;

        $(subH).nextUntil('h3, h4').filter('table').find('tr').slice(1).each((_, tr) => {
          const $c  = $(tr).find('td');
          const name = $($c[0]).text().trim();
          if (!name || name.length < 3) return;
          const weeks = extractWeeks($(tr));
          series.push({ name, car: $($c[1])?.text().trim() || '', fixed: false, license: lic, category: cat, weeks });
        });
      });

      // Direct table under license heading (use category from nearest heading context)
      $after.filter('table').each((_, tbl) => {
        // Detect category from closest ancestor or previous heading
        let cat = null;
        let node = tbl;
        for (let i = 0; i < 8 && !cat; i++) {
          const p = $(node).parent()[0];
          if (!p) break;
          const prevH = $(p).find('h1,h2,h3,h4').filter((_, h) => $(h).text() !== hText).last().text();
          cat = headingCategory(prevH);
          node = p;
        }
        cat = cat || 'road';

        $(tbl).find('tr').slice(1).each((_, tr) => {
          const $c  = $(tr).find('td');
          const name = $($c[0]).text().trim();
          if (!name || name.length < 3) return;
          const weeks = extractWeeks($(tr));
          series.push({ name, car: $($c[1])?.text().trim() || '', fixed: false, license: lic, category: cat, weeks });
        });
      });
    });

    if (series.length >= 5) {
      console.log(`[scraper] Strategy B (headings by license) → ${series.length} series`);
      return series;
    }
  }

  // ── STRATEGY C: Single big table with category/license columns ──────────
  {
    const series = [];
    $('table').each((_, tbl) => {
      const $rows   = $(tbl).find('tr');
      if ($rows.length < 3) return;

      const $hdr    = $($rows[0]).find('th, td');
      const hdrs    = $hdr.map((_, c) => $(c).text().trim().toLowerCase()).get();

      if (!hdrs.some(h => /serie|series|name|nombre/i.test(h))) return;

      const idx = {
        name:    hdrs.findIndex(h => /serie|series|name|nombre/i.test(h)),
        car:     hdrs.findIndex(h => /coche|car|vehicle/i.test(h)),
        lic:     hdrs.findIndex(h => /licen|clase|license/i.test(h)),
        cat:     hdrs.findIndex(h => /categ|tipo|type/i.test(h)),
        fixed:   hdrs.findIndex(h => /fixed|fijo/i.test(h)),
      };

      const weekCols = [];
      hdrs.forEach((h, i) => {
        const m = h.match(/^(?:semana|week|s|w)\s*(\d+)$/) || (h.match(/^(\d+)$/) && parseInt(h) <= 13 && parseInt(h) >= 1);
        if (m) weekCols.push({ col: i, week: parseInt(Array.isArray(m) ? m[1] : h, 10) });
      });

      console.log(`[scraper] Strategy C: table with ${$rows.length} rows, weekCols=${weekCols.length}`);

      $rows.slice(1).each((_, tr) => {
        const $c   = $(tr).find('td');
        const cell = i => i >= 0 && i < $c.length ? $($c[i]).text().trim() : '';
        const name = idx.name >= 0 ? cell(idx.name) : cell(0);
        if (!name || name.length < 3) return;

        const rawLic = idx.lic >= 0 ? cell(idx.lic) : '';
        const rawCat = idx.cat >= 0 ? cell(idx.cat) : '';
        const lic    = normLicense(rawLic) || 'D';
        const cat    = normCategory(rawCat) || 'road';
        const car    = idx.car >= 0 ? cell(idx.car) : '';
        const fixed  = idx.fixed >= 0 ? /sí|si|yes|true|x/i.test(cell(idx.fixed)) : false;
        const weeks  = weekCols.length
          ? weekCols.map(({ col, week }) => ({ week, track: cell(col) })).filter(w => w.track)
          : extractWeeks($(tr));

        series.push({ name, car, fixed, license: lic, category: cat, weeks });
      });
    });

    if (series.length >= 5) {
      console.log(`[scraper] Strategy C (big table) → ${series.length} series`);
      return series;
    }
  }

  // ── STRATEGY D: Elementor / WPBakery tab widget ──────────────────────────
  // These builders output data as nested divs.
  // Tab title → contains category or license label
  // Tab content → contains series rows
  {
    const series = [];

    // Elementor tabs
    const tabContents = [
      '.elementor-tab-content',
      '.e-tab-content',
      '.vc_tta-panel-body',
      '.fusion-panel-shortcode-content',
      '.wpb_tab',
    ];

    for (const sel of tabContents) {
      $(sel).each((_, panel) => {
        const $panel = $(panel);

        // Get title from the corresponding tab title element
        const titleEl = $panel
          .closest('[class*="tab"], [class*="panel"]')
          .find('[class*="tab-title"], [class*="panel-title"], [class*="tab-label"], .elementor-tab-title, .vc_tta-title-text')
          .first();
        const titleText = titleEl.text().trim() || $panel.attr('data-title') || '';

        const cat = normCategory(titleText);
        const lic = normLicense(titleText);

        if (!cat && !lic) return; // tab not relevant

        // Within the panel, look for license/category sub-headings and tables
        let currentLic = lic || 'D';
        let currentCat = cat || 'road';

        $panel.children().each((_, child) => {
          const tag  = child.tagName?.toLowerCase() || '';
          const text = $(child).text().trim();

          if (/^h[1-6]$/.test(tag)) {
            currentLic = normLicense(text) || currentLic;
            currentCat = normCategory(text) || currentCat;
            return;
          }

          if (tag === 'table') {
            $(child).find('tr').slice(1).each((_, tr) => {
              const $c  = $(tr).find('td');
              const name = $($c[0]).text().trim();
              if (!name || name.length < 3) return;
              const weeks = extractWeeks($(tr));
              series.push({ name, car: $($c[1])?.text().trim() || '', fixed: false, license: currentLic, category: currentCat, weeks });
            });
          }
        });
      });
      if (series.length >= 5) break;
    }

    if (series.length >= 5) {
      console.log(`[scraper] Strategy D (Elementor/WPBakery tabs) → ${series.length} series`);
      return series;
    }
  }

  // ── STRATEGY E: Any table that looks like a schedule ─────────────────────
  // Last resort: harvest any table that has ≥ 4 columns and ≥ 5 rows.
  // Infer category/license from nearest heading ancestor.
  {
    const series = [];
    $('table').each((_, tbl) => {
      const $rows = $(tbl).find('tr');
      if ($rows.length < 5) return;

      const maxCols = Math.max(...$rows.map((_, r) => $(r).find('td,th').length).get());
      if (maxCols < 4) return;

      // Nearest heading context
      let nearestHeading = $(tbl).closest('section, div, article').find('h1,h2,h3,h4').first().text().trim();
      if (!nearestHeading) nearestHeading = $(tbl).prevAll('h1,h2,h3,h4').first().text().trim();

      const cat = normCategory(nearestHeading) || 'road';
      const lic = normLicense(nearestHeading) || 'D';

      $rows.slice(1).each((_, tr) => {
        const $c   = $(tr).find('td');
        const name = $($c[0]).text().trim();
        if (!name || name.length < 3 || name.length > 100) return;
        const weeks = extractWeeks($(tr));
        if (!weeks.length) return;
        series.push({ name, car: $($c[1])?.text().trim() || '', fixed: false, license: lic, category: cat, weeks });
      });
    });

    if (series.length >= 3) {
      console.log(`[scraper] Strategy E (any schedule table) → ${series.length} series`);
      return series;
    }
  }

  console.warn('[scraper] All strategies exhausted — no series found in HTML');
  return [];
}

// ============================================
// BUILD STRUCTURED CALENDAR  (schema v2)
// Converts flat series array → { road:{rookie:[],…}, oval:{…}, … }
// ============================================
function buildStructuredCalendar(flatSeries) {
  const out = emptyCalendar();

  for (const s of flatSeries) {
    const cat = s.category || 'road';
    const lic = s.license  || 'D';

    if (!out[cat])      { console.warn(`[scraper] Unknown category: ${cat}`); continue; }
    if (!out[cat][lic]) out[cat][lic] = [];

    // Enrich weeks with season dates
    const weeks = (s.weeks || []).map(w => {
      const wMeta = SEASON_WEEKS.find(sw => sw.week === w.week) || {};
      return { week: w.week, track: w.track, date: wMeta.start || null };
    });

    out[cat][lic].push({
      name:     s.name,
      car:      s.car      || '',
      fixed:    s.fixed    || false,
      license:  s.rawLic   || lic,
      category: cat,
      weeks,
    });
  }

  return out;
}

// ============================================
// LIVE SCRAPE
// ============================================
export async function scrapeCalendar() {
  if (!await isAllowed(TARGET_URL)) {
    console.warn('[scraper] robots.txt blocks target — using static fallback');
    return null;
  }

  const res = await browserFetch(TARGET_URL);
  if (!res || !res.ok) {
    console.warn(`[scraper] fetch failed (${res?.status ?? 'no response'})`);
    return null;
  }

  const html = await res.text();
  if (!html || html.length < 1000) {
    console.warn('[scraper] Response too short, likely a captcha/block page');
    return null;
  }

  const flatSeries = parseHtml(html);
  if (!flatSeries.length) {
    console.warn('[scraper] Parser returned 0 series — using static fallback');
    return null;
  }

  const calendar = buildStructuredCalendar(flatSeries);
  const total    = Object.values(calendar)
    .flatMap(byLic => Object.values(byLic))
    .reduce((n, arr) => n + arr.length, 0);

  console.log(`[scraper] Live scrape OK — ${total} series across ${Object.keys(calendar).length} categories`);
  return calendar;
}

// ============================================
// PUBLIC API — getCalendarData()
// Returns { data, source }
// data is the schema-v2 object: { road, oval, dirt_road, dirt_oval, unranked }
// ============================================
export async function getCalendarData() {
  // Try live scrape first
  try {
    const live = await scrapeCalendar();
    if (live) {
      const total = Object.values(live).flatMap(v => Object.values(v)).reduce((n, a) => n + a.length, 0);
      return {
        data: {
          meta: {
            season:      'Season 2 • 2026',
            generatedAt: new Date().toISOString(),
            totalSeries: total,
            source:      'live',
            weeks:       SEASON_WEEKS,
            schema:      'v2',
          },
          ...live,
        },
        source: 'live',
      };
    }
  } catch (err) {
    console.error('[scraper] Live scrape threw:', err.message);
  }

  // Static fallback
  const staticData = loadStatic(STATIC_CALENDAR);
  if (!staticData) return { data: null, source: null };
  console.log('[scraper] Using static fallback');
  return { data: staticData, source: 'static' };
}

// ============================================
// HELPERS used by server.js
// ============================================

export function getSeasonWeeks() { return SEASON_WEEKS; }

export function getCurrentWeek() {
  const today = new Date();
  for (const w of SEASON_WEEKS) {
    const s = new Date(w.start);
    const e = new Date(w.end);
    e.setHours(23, 59, 59);
    if (today >= s && today <= e) return w.week;
  }
  return null;
}

// Flat array of all series (for /api/series)
export function getAllSeries(data) {
  const result = [];
  for (const [cat, byLic] of Object.entries(data)) {
    if (cat === 'meta') continue;
    for (const [lic, list] of Object.entries(byLic)) {
      for (const s of list) {
        result.push({ ...s, category: cat, license: lic === 'rookie' ? 'R' : lic });
      }
    }
  }
  return result;
}

// Series for a specific category (road/oval/dirt_road/dirt_oval)
export function getSeriesByCategory(data, category) {
  // Accept dash variant too (dirt-road → dirt_road)
  const key = (category || '').replace(/-/g, '_');
  const byLic = data[key];
  if (!byLic) return [];
  return Object.entries(byLic).flatMap(([lic, list]) =>
    list.map(s => ({ ...s, license: lic === 'rookie' ? 'R' : lic }))
  );
}

// All series that run in a given week
export function getSeriesForWeek(data, weekNum) {
  return getAllSeries(data)
    .map(s => {
      const w = (s.weeks || []).find(x => x.week === weekNum);
      if (!w) return null;
      return { ...s, currentWeek: { ...w } };
    })
    .filter(Boolean);
}

// Unique tracks with configs
export function getTracksData(data) {
  const seen = new Set();
  const tracks = [];
  for (const s of getAllSeries(data)) {
    for (const w of (s.weeks || [])) {
      if (w.track && !seen.has(w.track)) {
        seen.add(w.track);
        tracks.push({ name: w.track });
      }
    }
  }
  return tracks;
}

// ============================================
// SPECIAL EVENTS  (iracing.com/special-events/)
// ============================================
const SPECIAL_EVENTS_URL = 'https://www.iracing.com/special-events/';

function parseEventDate(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/(\d+)(st|nd|rd|th)/gi, '$1').trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function scrapeSpecialEventsPage() {
  if (!await isAllowed(SPECIAL_EVENTS_URL)) return null;

  const res = await browserFetch(SPECIAL_EVENTS_URL);
  if (!res?.ok) return null;

  const html = await res.text();
  const $    = ch.load(html);
  const events = [];
  const now    = new Date();

  // Strategy 1: event cards
  $('[class*="event-card"], [class*="event-item"], [class*="special-event"], article').each((_, el) => {
    const $el  = $(el);
    const name = $el.find('h1,h2,h3,h4,[class*="title"]').first().text().trim();
    if (!name || name.length < 3) return;

    const rawDate  = $el.find('[class*="date"],[datetime],[class*="time"]').first().text().trim();
    const date     = parseEventDate(rawDate);
    const circuit  = $el.find('[class*="track"],[class*="circuit"],[class*="venue"]').first().text().trim();
    const url      = $el.find('a').first().attr('href') || SPECIAL_EVENTS_URL;

    events.push({
      id:          name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      date:        date || new Date(now.getTime() + 30 * 86400000).toISOString(),
      circuit:     circuit || 'TBD',
      officialUrl: url.startsWith('http') ? url : `https://www.iracing.com${url}`,
      past:        date ? new Date(date) < now : false,
    });
  });

  if (events.length >= 2) {
    console.log(`[scraper] Special events live: ${events.length}`);
    return events.sort((a, b) => Number(a.past) - Number(b.past));
  }
  return null;
}

export async function getEventsData() {
  const staticData = loadStatic(STATIC_EVENTS);
  const base = staticData?.events || [];

  let live = null;
  try { live = await scrapeSpecialEventsPage(); } catch { /* fallback */ }

  if (!live?.length) {
    const now = new Date();
    return {
      events: base.map(e => ({ ...e, past: e.endDate ? new Date(e.endDate) < now : new Date(e.date) < now }))
                  .sort((a, b) => Number(a.past) - Number(b.past)),
      source: 'static',
    };
  }

  // Merge: live events first, then static-only ones not in live
  const liveIds = new Set(live.map(e => e.id));
  const staticOnly = base.filter(e => !liveIds.has(e.id)).map(e => {
    const now = new Date();
    return { ...e, past: e.endDate ? new Date(e.endDate) < now : new Date(e.date) < now };
  });

  return {
    events: [...live, ...staticOnly].sort((a, b) => Number(a.past) - Number(b.past)),
    source: 'live+static',
  };
}

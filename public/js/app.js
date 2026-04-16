// ============================================
// iRacing Calendar — Modern App v5
// Created by Horrillo
// ============================================
'use strict';

// ============================================
// BACKEND CONFIG
// Set BACKEND_URL to your Railway deployment.
// Leave empty ('') to always use static files.
// ============================================
const BACKEND_URL = ''; // e.g. 'https://iracing-calendar-backend.up.railway.app'

// ============================================
// CONSTANTS
// ============================================
const LICENSE_NAMES = {
  R: 'ROOKIE', D: 'CLASE D', C: 'CLASE C', B: 'CLASE B', A: 'CLASE A'
};

const CATEGORY_MAP = {
  oval: 'OVAL', sports: 'SPORTS CAR', formula: 'FORMULA CAR',
  'dirt-oval': 'DIRT OVAL', 'dirt-road': 'DIRT ROAD', unranked: 'UNRANKED'
};

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
  { week: 13, start: '2026-06-09', end: '2026-06-15' }
];

const TRACKS_DB = {
  'Circuit de Spa-Francorchamps': { km: 7.004, turns: 19, country: '🇧🇪 Bélgica' },
  'Nürburgring Combined': { km: 25.378, turns: 154, country: '🇩🇪 Alemania' },
  'Nürburgring Nordschleife': { km: 20.832, turns: 154, country: '🇩🇪 Alemania' },
  'Nürburgring Grand Prix': { km: 5.148, turns: 15, country: '🇩🇪 Alemania' },
  'Autodromo Nazionale Monza - Grand Prix': { km: 5.793, turns: 11, country: '🇮🇹 Italia' },
  'Autodromo Nazionale Monza - Combined': { km: 5.793, turns: 11, country: '🇮🇹 Italia' },
  'Silverstone Circuit - Grand Prix': { km: 5.891, turns: 18, country: '🇬🇧 UK' },
  'Suzuka International Racing Course - Grand Prix': { km: 5.807, turns: 18, country: '🇯🇵 Japón' },
  'Circuit de Barcelona Catalunya - Grand Prix': { km: 4.655, turns: 16, country: '🇪🇸 España' },
  'Sebring International Raceway': { km: 6.02, turns: 17, country: '🇺🇸 USA' },
  'Daytona International Speedway - Road Course': { km: 5.73, turns: 12, country: '🇺🇸 USA' },
  'Daytona International Speedway - Oval': { km: 4.023, turns: 4, country: '🇺🇸 USA' },
  'Indianapolis Motor Speedway - Road Course': { km: 4.17, turns: 14, country: '🇺🇸 USA' },
  'Indianapolis Motor Speedway - Oval': { km: 4.023, turns: 4, country: '🇺🇸 USA' },
  'Indianapolis Motor Speedway - Open Wheel': { km: 4.023, turns: 4, country: '🇺🇸 USA' },
  'Circuit of the Americas - Grand Prix': { km: 5.513, turns: 20, country: '🇺🇸 USA' },
  'Le Mans - 24 Hours of Le Mans': { km: 13.626, turns: 38, country: '🇫🇷 Francia' },
  'Mount Panorama Circuit': { km: 6.213, turns: 23, country: '🇦🇺 Australia' },
  'Autódromo José Carlos Pace - Grand Prix': { km: 4.309, turns: 15, country: '🇧🇷 Brasil' },
  'Autódromo Hermanos Rodríguez - Grand Prix': { km: 4.304, turns: 17, country: '🇲🇽 México' },
  'Brands Hatch Circuit - Grand Prix': { km: 3.908, turns: 9, country: '🇬🇧 UK' },
  'Brands Hatch Circuit - Indy': { km: 1.929, turns: 6, country: '🇬🇧 UK' },
  'Watkins Glen International - Boot': { km: 5.43, turns: 11, country: '🇺🇸 USA' },
  'Watkins Glen International - Classic Boot': { km: 5.43, turns: 11, country: '🇺🇸 USA' },
  'Road America - Full Course': { km: 6.515, turns: 14, country: '🇺🇸 USA' },
  'Road Atlanta - Full Course': { km: 4.088, turns: 12, country: '🇺🇸 USA' },
  'WeatherTech Raceway at Laguna Seca': { km: 3.602, turns: 11, country: '🇺🇸 USA' },
  'Fuji Speedway - Grand Prix': { km: 4.563, turns: 16, country: '🇯🇵 Japón' },
  'Hungaroring - Grand Prix': { km: 4.381, turns: 14, country: '🇭🇺 Hungría' },
  'Red Bull Ring - Grand Prix': { km: 4.318, turns: 10, country: '🇦🇹 Austria' },
  'Zandvoort - Grand Prix': { km: 4.259, turns: 14, country: '🇳🇱 Países Bajos' },
  'Algarve International Circuit - Grand Prix': { km: 4.653, turns: 15, country: '🇵🇹 Portugal' },
  'Talladega Superspeedway': { km: 4.28, turns: 4, country: '🇺🇸 USA' },
  'Charlotte Motor Speedway - Oval': { km: 2.414, turns: 4, country: '🇺🇸 USA' },
  'Charlotte Motor Speedway - Roval 2025': { km: 3.75, turns: 17, country: '🇺🇸 USA' },
  'Charlotte Motor Speedway - Legends Oval': { km: 0.4, turns: 4, country: '🇺🇸 USA' },
  'Texas Motor Speedway': { km: 2.414, turns: 4, country: '🇺🇸 USA' },
  'Bristol Motor Speedway': { km: 0.859, turns: 4, country: '🇺🇸 USA' },
  'Bristol Motor Speedway - Dirt': { km: 0.859, turns: 4, country: '🇺🇸 USA' },
  'Martinsville Speedway': { km: 0.847, turns: 4, country: '🇺🇸 USA' },
  'Richmond Raceway': { km: 1.207, turns: 4, country: '🇺🇸 USA' },
  'Darlington Raceway': { km: 2.232, turns: 4, country: '🇺🇸 USA' },
  'Dover Motor Speedway': { km: 1.609, turns: 4, country: '🇺🇸 USA' },
  'Phoenix Raceway': { km: 1.609, turns: 4, country: '🇺🇸 USA' },
  'Kansas Speedway': { km: 2.414, turns: 4, country: '🇺🇸 USA' },
  'Michigan International Speedway': { km: 3.219, turns: 4, country: '🇺🇸 USA' },
  'Las Vegas Motor Speedway - Oval': { km: 2.414, turns: 4, country: '🇺🇸 USA' },
  'Atlanta Motor Speedway': { km: 2.414, turns: 4, country: '🇺🇸 USA' },
  'Homestead Miami Speedway - Oval': { km: 2.414, turns: 4, country: '🇺🇸 USA' },
  'Iowa Speedway - Oval': { km: 1.424, turns: 4, country: '🇺🇸 USA' },
  'New Hampshire Motor Speedway - Oval': { km: 1.689, turns: 4, country: '🇺🇸 USA' },
  'Pocono Raceway': { km: 4.023, turns: 3, country: '🇺🇸 USA' },
  'Sonoma Raceway - Cup': { km: 3.862, turns: 12, country: '🇺🇸 USA' },
  'Oulton Park Circuit - Fosters': { km: 2.692, turns: 8, country: '🇬🇧 UK' },
  'Oulton Park Circuit - International': { km: 4.307, turns: 15, country: '🇬🇧 UK' },
  'Donington Park - Grand Prix': { km: 4.023, turns: 12, country: '🇬🇧 UK' },
  'Donington Park - National': { km: 3.149, turns: 9, country: '🇬🇧 UK' },
  'Snetterton Circuit - 300': { km: 4.779, turns: 12, country: '🇬🇧 UK' },
  'Knockhill Racing Circuit': { km: 2.037, turns: 9, country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia' },
  'Hockenheimring - Grand Prix': { km: 4.574, turns: 17, country: '🇩🇪 Alemania' },
  'Circuito de Navarra - Speed Circuit': { km: 3.933, turns: 15, country: '🇪🇸 España' },
  'Circuit de Lédenon': { km: 3.156, turns: 14, country: '🇫🇷 Francia' },
  'Autodrom Most': { km: 4.219, turns: 21, country: '🇨🇿 Chequia' },
  'Motorsport Arena Oschersleben - Grand Prix': { km: 3.696, turns: 14, country: '🇩🇪 Alemania' },
  'Imola - Grand Prix': { km: 4.909, turns: 19, country: '🇮🇹 Italia' },
  'Autodromo Internazionale Enzo e Dino Ferrari - Grand Prix': { km: 4.909, turns: 19, country: '🇮🇹 Italia' },
  'Okayama International Circuit - Full Course': { km: 3.703, turns: 13, country: '🇯🇵 Japón' },
  'Twin Ring Motegi - Grand Prix': { km: 4.801, turns: 14, country: '🇯🇵 Japón' },
  'Mobility Resort Motegi - Grand Prix': { km: 4.801, turns: 14, country: '🇯🇵 Japón' },
  'Mobility Resort Motegi - Oval': { km: 2.4, turns: 4, country: '🇯🇵 Japón' },
  'Eldora Speedway': { km: 0.805, turns: 4, country: '🇺🇸 USA' },
  'Knoxville Raceway': { km: 0.805, turns: 4, country: '🇺🇸 USA' },
  'Williams Grove Speedway': { km: 0.805, turns: 4, country: '🇺🇸 USA' },
  'Volusia Speedway Park': { km: 0.805, turns: 4, country: '🇺🇸 USA' },
  'Lime Rock Park - Grand Prix': { km: 2.414, turns: 7, country: '🇺🇸 USA' },
  'Lime Rock Park - Chicanes': { km: 2.414, turns: 9, country: '🇺🇸 USA' },
  'Virginia International Raceway - Full Course': { km: 5.263, turns: 24, country: '🇺🇸 USA' },
  'Virginia International Raceway - North Course': { km: 2.816, turns: 10, country: '🇺🇸 USA' },
  'Canadian Tire Motorsports Park': { km: 3.957, turns: 10, country: '🇨🇦 Canadá' },
  'Summit Point Raceway - Summit Point Raceway': { km: 3.219, turns: 10, country: '🇺🇸 USA' },
  'Adelaide Street Circuit': { km: 3.219, turns: 14, country: '🇦🇺 Australia' },
  'Long Beach Street Circuit': { km: 3.167, turns: 11, country: '🇺🇸 USA' },
  'Detroit Grand Prix at Belle Isle': { km: 3.331, turns: 14, country: '🇺🇸 USA' },
  'St. Petersburg Grand Prix - Grand Prix': { km: 2.897, turns: 14, country: '🇺🇸 USA' },
  'Chicago Street Course - 2023 Cup': { km: 3.54, turns: 12, country: '🇺🇸 USA' },
  'Nashville Superspeedway': { km: 2.089, turns: 4, country: '🇺🇸 USA' },
  'North Wilkesboro Speedway - Oval': { km: 1.017, turns: 4, country: '🇺🇸 USA' },
  'North Wilkesboro Speedway - Oval - 1987': { km: 1.017, turns: 4, country: '🇺🇸 USA' },
  'World Wide Technology Raceway (Gateway)': { km: 2.0, turns: 4, country: '🇺🇸 USA' }
};

// ============================================
// STATE
// ============================================
const state = {
  calendarData: null,
  eventsData: null,
  alertsData: null,
  currentWeek: 1,
  activeCategory: 'oval',
  activeView: 'list',
  filters: { license: 'all', search: '' },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  theme: localStorage.getItem('iracing-theme') || 'dark',
  countdownInterval: null,
  pwaInstallEvent: null
};

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.theme);
  populateTimezoneSelector();
  restoreTimezone();
  calculateCurrentWeek();
  registerServiceWorker();
  setupPWAInstall();

  showLoading();

  // Load data: backend first, static fallback
  const [calResult, evResult, alData] = await Promise.all([
    fetchWithFallback('/api/series',          '/data/calendar.json'),
    fetchWithFallback('/api/special-events',  '/data/events.json'),
    fetchJSON('/data/avisos.json')            // alerts are always local
  ]);

  // The backend /api/series response wraps data in { meta, series, calendar }
  // The static calendar.json uses { meta, series: { OVAL: {R:[...]}, ... } }
  // Normalise both shapes into the same calendarData structure the app expects.
  let calData = calResult.data;
  if (calData && calData.calendar) {
    // Backend shape: unwrap the nested calendar object
    calData = calData.calendar;
  }

  // /api/special-events → { meta, events: [...] }
  // static events.json  → { meta, events: [...] }
  // Both are the same shape — pass through as-is.
  let evData = evResult.data;

  state.calendarData = calData;
  state.eventsData   = evData;
  state.alertsData   = alData;

  // Update season badge from meta
  if (calData) {
    const badge = document.getElementById('seasonBadge');
    if (badge) badge.textContent = calData.meta?.season || 'Season 2 • 2026';
  }

  // Show data-source indicator
  updateDataSourceBadge(calResult.source, calData?.meta);

  renderAlerts();
  setupNavigation();
  setupFilters();
  setupViewToggle();
  setupThemeToggle();
  setupNotificationsBtn();
  setupGCalBtn();

  renderCategory('oval');
  startCountdowns();
});

async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ============================================
// DATA LAYER — backend with static fallback
// ============================================

/**
 * Try the backend endpoint first; if it fails or BACKEND_URL is
 * not configured, fetch the local static file instead.
 * Returns { data, source: 'backend'|'static' }
 */
async function fetchWithFallback(backendPath, staticPath) {
  if (BACKEND_URL) {
    try {
      const r = await fetch(`${BACKEND_URL}${backendPath}`, {
        headers: { 'Accept': 'application/json' },
        // 8-second timeout so a slow Railway cold-start doesn't hang the UI
        signal: AbortSignal.timeout(8000)
      });
      if (r.ok) {
        const data = await r.json();
        return { data, source: 'backend' };
      }
    } catch (e) {
      console.warn(`[app] backend ${backendPath} failed (${e.message}), using static fallback`);
    }
  }
  const data = await fetchJSON(staticPath);
  return { data, source: 'static' };
}

/**
 * Show a small indicator in the filter bar with the data source
 * and the timestamp from the backend (if available).
 */
function updateDataSourceBadge(source, meta) {
  let badge = document.getElementById('dataSourceBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'dataSourceBadge';
    badge.style.cssText = `
      font-family: var(--font-heading);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 5px;
      margin-left: auto;
      padding: 0 4px;
    `;
    const filterRow = document.querySelector('.filter-row');
    if (filterRow) filterRow.appendChild(badge);
  }

  const isLive     = source === 'backend';
  const dot        = isLive ? '🟢' : '⚪';
  const label      = isLive ? 'Live' : 'Static';
  const updatedAt  = meta?.cachedAt || meta?.generatedAt || null;
  const timeStr    = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '';

  badge.innerHTML = `${dot} ${label}${timeStr ? ` · ${timeStr}` : ''}`;
  badge.title     = isLive
    ? `Datos en vivo del backend (caché: ${timeStr})`
    : 'Usando datos estáticos (backend no disponible)';
}

function showLoading() {
  document.getElementById('mainContent').innerHTML =
    '<div class="loading-state"><div class="spinner"></div>CARGANDO CALENDARIO...</div>';
}

// ============================================
// CURRENT WEEK
// ============================================
function calculateCurrentWeek() {
  const today = new Date();
  for (const w of SEASON_WEEKS) {
    const s = new Date(w.start);
    const e = new Date(w.end);
    e.setHours(23, 59, 59);
    if (today >= s && today <= e) { state.currentWeek = w.week; return; }
  }
}

// ============================================
// THEME
// ============================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('iracing-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
}

function setupThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
}

// ============================================
// TIMEZONE
// ============================================
function populateTimezoneSelector() {
  const sel = document.getElementById('timezoneSelect');
  if (!sel) return;
  const zones = [
    'UTC',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Sao_Paulo', 'America/Buenos_Aires', 'America/Mexico_City',
    'Europe/London', 'Europe/Madrid', 'Europe/Paris', 'Europe/Berlin',
    'Europe/Rome', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Moscow',
    'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul',
    'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland'
  ];
  zones.forEach(z => {
    const opt = document.createElement('option');
    opt.value = z;
    opt.textContent = z.replace('_', ' ');
    if (z === state.timezone) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    state.timezone = sel.value;
    localStorage.setItem('iracing-tz', sel.value);
    reRender();
  });
}

function restoreTimezone() {
  const saved = localStorage.getItem('iracing-tz');
  if (saved) state.timezone = saved;
}

function formatEventDate(isoDate) {
  if (!isoDate) return '—';
  try {
    return new Date(isoDate).toLocaleString('es-ES', {
      timeZone: state.timezone,
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return isoDate; }
}

// ============================================
// ALERTS
// ============================================
function renderAlerts() {
  const c = document.getElementById('alertsContainer');
  if (!c || !state.alertsData) return;
  let html = '';
  let has = false;

  if (state.alertsData.calendario_provisional) {
    has = true;
    const m = state.alertsData.mensaje_provisional || {};
    html += `<div class="alert alert-provisional"><span>${m.es || '⚠️ Calendario provisional.'}</span><span class="alert-separator">|</span><span class="alert-lang">${m.en || ''}</span></div>`;
  }
  for (const a of (state.alertsData.avisos || [])) {
    if (a.activo) {
      has = true;
      html += `<div class="alert alert-custom"><span>${a.es || ''}</span>${a.en ? `<span class="alert-separator">|</span><span class="alert-lang">${a.en}</span>` : ''}</div>`;
    }
  }
  c.innerHTML = html;
  c.classList.toggle('has-alerts', has);
}

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      state.activeCategory = cat;
      if (cat === 'special') renderSpecialEvents();
      else renderCategory(cat);
    });
  });
}

// ============================================
// FILTERS
// ============================================
function setupFilters() {
  const licSel = document.getElementById('filterLicense');
  const search  = document.getElementById('filterSearch');
  if (licSel) licSel.addEventListener('change', () => { state.filters.license = licSel.value; reRender(); });
  if (search)  search.addEventListener('input',  () => { state.filters.search  = search.value.toLowerCase().trim(); reRender(); });
}

function reRender() {
  if (state.activeCategory === 'special') renderSpecialEvents();
  else renderCategory(state.activeCategory);
}

// ============================================
// VIEW TOGGLE
// ============================================
function setupViewToggle() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeView = btn.dataset.view;
      reRender();
    });
  });
}

// ============================================
// RENDER CATEGORY (list + calendar views)
// ============================================
function renderCategory(categoryId) {
  if (!state.calendarData) return;
  const catName  = CATEGORY_MAP[categoryId];
  const catData  = state.calendarData.series?.[catName];
  if (!catData) { document.getElementById('mainContent').innerHTML = '<div class="error-state">⚠️ Sin datos para esta categoría.</div>'; return; }

  if (state.activeView === 'calendar') {
    renderCalendarView(catData);
    return;
  }

  let html = '';
  for (const lic of ['R', 'D', 'C', 'B', 'A']) {
    let list = catData[lic] || [];
    // Apply filters
    if (state.filters.license !== 'all' && state.filters.license !== lic) continue;
    if (state.filters.search) list = list.filter(s => s.name.toLowerCase().includes(state.filters.search));
    if (!list.length) continue;

    html += `
      <div class="license-section">
        <div class="license-header ${lic}">
          <div class="license-badge ${lic}">${lic}</div>
          <span class="license-title">${LICENSE_NAMES[lic]}</span>
          <span class="license-count">${list.length} series</span>
          <button class="expand-btn" onclick="toggleAllInSection(this)">Expandir todo</button>
        </div>
        <div class="series-grid">
          ${list.map(s => renderSeriesCard(s)).join('')}
        </div>
      </div>`;
  }

  if (!html) html = '<div class="error-state">No hay series con ese filtro.</div>';
  document.getElementById('mainContent').innerHTML = html;
}

// ============================================
// SERIES CARD
// ============================================
function renderSeriesCard(series) {
  const fixedTag = series.fixed ? '<span class="series-tag">FIXED</span>' : '';

  let infoHtml = '<div class="series-info">';
  if (series.car)            infoHtml += `<div class="info-row"><span class="info-icon">🚗</span><span class="info-label">Coche:</span>&nbsp;<span class="info-value">${series.car}</span></div>`;
  if (series.license_range)  infoHtml += `<div class="info-row"><span class="info-icon">📋</span><span class="info-label">Licencia:</span>&nbsp;<span class="info-value">${series.license_range}</span></div>`;
  if (series.race_frequency) infoHtml += `<div class="info-row"><span class="info-icon">⏰</span><span class="info-label">Frecuencia:</span>&nbsp;<span class="info-value">${series.race_frequency}</span></div>`;
  if (series.incidents)      infoHtml += `<div class="info-row"><span class="info-icon">⚠️</span><span class="info-label">Incidentes:</span>&nbsp;<span class="info-value">${series.incidents}</span></div>`;
  infoHtml += '</div>';

  let weeksHtml = '<div class="weeks-list">';
  for (const w of (series.weeks || [])) {
    const isCur = w.week === state.currentWeek;
    weeksHtml += `
      <div class="week-row${isCur ? ' current-week' : ''}">
        <span class="week-num">W${w.week}${isCur ? ' <span class="current-badge">AHORA</span>' : ''}</span>
        <div class="week-track-wrap">
          <span class="week-track" title="${w.track}">${w.track}</span>
          ${getTrackInfo(w.track)}
        </div>
        <span class="week-details">
          ${w.start_type ? `<span class="week-start-type">${w.start_type}</span>` : ''}
          ${w.duration   ? `<span class="week-duration">${w.duration}</span>` : ''}
        </span>
        <span class="week-temp">${w.temp_c}°C</span>
        <span class="week-weather">${getWeatherHtml(w.rain)}</span>
      </div>`;
  }
  weeksHtml += '</div>';

  return `
    <div class="series-card">
      <div class="series-header" onclick="toggleSeries(this)">
        <span class="series-name">${series.name}</span>
        ${fixedTag}
        <div class="series-toggle">▼</div>
      </div>
      <div class="weeks-container">
        ${infoHtml}
        <div class="weeks-divider"></div>
        ${weeksHtml}
      </div>
    </div>`;
}

function getTrackInfo(name) {
  let info = TRACKS_DB[name];
  if (!info) {
    for (const [k, v] of Object.entries(TRACKS_DB)) {
      if (name.includes(k) || k.includes(name.substring(0, 20))) { info = v; break; }
    }
  }
  if (!info) return '';
  return `<span class="track-info">${info.country} • ${info.km} km • ${info.turns} curvas</span>`;
}

function getWeatherHtml(rain) {
  if (!rain || rain === 'None') return '<span class="weather-icon">☀️</span>';
  const pct = parseInt(rain);
  const cls = pct >= 50 ? 'rain-high' : pct >= 30 ? 'rain-med' : 'rain-low';
  return `<span class="weather-icon">🌧️</span><span class="rain-chance ${cls}">${rain}</span>`;
}

// ============================================
// CALENDAR (GRID) VIEW
// ============================================
function renderCalendarView(catData) {
  const weeks = 13;
  const cols  = `180px repeat(${weeks}, 1fr)`;

  let headerRow = `<div class="cal-series-row" style="grid-template-columns:${cols}">
    <div class="cal-name" style="font-size:10px;color:var(--text-dim)">SERIES</div>`;
  for (let w = 1; w <= weeks; w++) {
    headerRow += `<div class="cal-week-num${w === state.currentWeek ? ' cur' : ''}">W${w}</div>`;
  }
  headerRow += '</div>';

  let rows = '';
  for (const lic of ['R', 'D', 'C', 'B', 'A']) {
    let list = catData[lic] || [];
    if (state.filters.license !== 'all' && state.filters.license !== lic) continue;
    if (state.filters.search) list = list.filter(s => s.name.toLowerCase().includes(state.filters.search));
    for (const s of list) {
      rows += `<div class="cal-series-row" style="grid-template-columns:${cols}">
        <div class="cal-name" title="${s.name}">${s.name}</div>`;
      for (let w = 1; w <= weeks; w++) {
        const week = (s.weeks || []).find(x => x.week === w);
        const isCur = w === state.currentWeek;
        const label = week ? shortenTrack(week.track) : '';
        rows += `<div class="cal-cell${isCur ? ' cur' : ''}" title="${week ? week.track : ''}">${label}</div>`;
      }
      rows += '</div>';
    }
  }

  if (!rows) rows = '<div class="error-state">No hay series con ese filtro.</div>';

  document.getElementById('mainContent').innerHTML =
    `<div class="calendar-view">${headerRow}${rows}</div>`;
}

function shortenTrack(name) {
  if (!name) return '';
  // Take the part before ' - ' or first 12 chars
  const part = name.split(' - ')[0];
  return part.length > 14 ? part.substring(0, 13) + '…' : part;
}

// ============================================
// SPECIAL EVENTS
// ============================================
function renderSpecialEvents() {
  const events = state.eventsData?.events || [];
  if (!events.length) {
    document.getElementById('mainContent').innerHTML = '<div class="error-state">No hay eventos especiales disponibles.</div>';
    return;
  }

  const cardsHtml = events.map(ev => renderEventCard(ev)).join('');
  document.getElementById('mainContent').innerHTML = `<div class="events-grid">${cardsHtml}</div>`;
  startCountdowns();
}

function renderEventCard(ev) {
  const now    = new Date();
  const start  = new Date(ev.date);
  const end    = ev.endDate ? new Date(ev.endDate) : null;

  let statusClass, statusLabel;
  if (now < start)              { statusClass = 'upcoming'; statusLabel = 'PRÓXIMO'; }
  else if (end && now < end)    { statusClass = 'live';     statusLabel = '🔴 EN VIVO'; }
  else                          { statusClass = 'past';     statusLabel = 'FINALIZADO'; }

  const cars = (ev.cars || []).map(c => `<span class="car-tag">${c}</span>`).join('');
  const winners = (ev.winners || []).map(w =>
    `<div class="winner-row"><span class="winner-year">${w.year}</span><span class="winner-trophy">🏆</span><span>${w.driver}</span><span class="winner-car">${w.car}</span></div>`
  ).join('');

  const imgHtml = `<img class="event-hero-img" src="${ev.circuitImage}" alt="${ev.circuit}" onerror="this.style.display='none'">`;

  return `
    <div class="event-card">
      <div class="event-hero">
        ${imgHtml}
        <span class="event-status-badge ${statusClass}">${statusLabel}</span>
        <div class="event-countdown-box${statusClass === 'live' ? ' live' : statusClass === 'past' ? ' past' : ''}"
             data-event-id="${ev.id}" data-start="${ev.date}" data-end="${ev.endDate || ''}">
          ${getCountdownText(start, end, now)}
        </div>
      </div>
      <div class="event-body">
        <h2 class="event-name">${ev.name}</h2>
        <div class="event-circuit-row">
          <span class="event-circuit-icon">📍</span>
          <span>${ev.circuit} &nbsp;•&nbsp; ${ev.circuitCountry}</span>
        </div>
        <div class="event-meta">
          <div class="event-meta-item">
            <span class="meta-label">Fecha</span>
            <span class="meta-value">${formatEventDate(ev.date)}</span>
          </div>
          <div class="event-meta-item">
            <span class="meta-label">Duración</span>
            <span class="meta-value">${ev.duration}</span>
          </div>
          <div class="event-meta-item">
            <span class="meta-label">Licencia mín.</span>
            <span class="meta-value">${ev.license}</span>
          </div>
          <div class="event-meta-item">
            <span class="meta-label">Tipo</span>
            <span class="meta-value">${ev.type}</span>
          </div>
          <div class="event-meta-item">
            <span class="meta-label">Circuito</span>
            <span class="meta-value">${ev.circuitKm} km · ${ev.circuitTurns} curvas</span>
          </div>
        </div>
        <div class="event-cars">${cars}</div>
        <p class="event-desc">${ev.description}</p>
        <div class="event-actions">
          <a href="${ev.officialUrl}" target="_blank" rel="noopener" class="btn-primary">🏁 Ver en iRacing</a>
          <button class="btn-secondary" onclick="addToGoogleCalendar(${JSON.stringify(ev).replace(/"/g, '&quot;')})">📅 Calendario</button>
        </div>
        ${winners ? `<div class="event-winners"><p class="winners-title">🏆 Últimos ganadores</p>${winners}</div>` : ''}
      </div>
    </div>`;
}

// ============================================
// COUNTDOWN TIMERS
// ============================================
function getCountdownText(start, end, now) {
  if (now >= start && end && now < end) return 'EN VIVO';
  if (now >= (end || start)) return 'FINALIZADO';
  const diff = start - now;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0)  return `${d}d ${h}h ${m}m`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}

function startCountdowns() {
  if (state.countdownInterval) clearInterval(state.countdownInterval);
  state.countdownInterval = setInterval(() => {
    document.querySelectorAll('.event-countdown-box[data-start]').forEach(el => {
      const start = new Date(el.dataset.start);
      const end   = el.dataset.end ? new Date(el.dataset.end) : null;
      const now   = new Date();
      el.textContent = getCountdownText(start, end, now);
    });
  }, 30000);
}

// ============================================
// GOOGLE CALENDAR EXPORT
// ============================================
function setupGCalBtn() {
  const btn = document.getElementById('gcalBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const events = state.eventsData?.events;
    if (!events?.length) { showToast('Sin eventos', 'No hay eventos especiales para exportar.'); return; }
    const upcoming = events.filter(e => new Date(e.date) > new Date());
    if (!upcoming.length) { showToast('Sin eventos futuros', 'Todos los eventos especiales ya han finalizado.'); return; }
    // Export first upcoming event as example
    addToGoogleCalendar(upcoming[0]);
  });
}

function addToGoogleCalendar(ev) {
  try {
    const title = encodeURIComponent(`iRacing: ${ev.name}`);
    const desc  = encodeURIComponent(`${ev.description}\n\nCircuito: ${ev.circuit}\nCoches: ${(ev.cars||[]).join(', ')}\nLicencia: ${ev.license}\n\n${ev.officialUrl}`);
    const loc   = encodeURIComponent(ev.circuit);
    const start = new Date(ev.date).toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
    const end   = ev.endDate
      ? new Date(ev.endDate).toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'
      : start;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${desc}&location=${loc}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch { showToast('Error', 'No se pudo generar el enlace de Google Calendar.'); }
}

// ============================================
// BROWSER NOTIFICATIONS
// ============================================
function setupNotificationsBtn() {
  const btn = document.getElementById('notifBtn');
  if (!btn || !('Notification' in window)) { if (btn) btn.style.display = 'none'; return; }

  const updateState = () => {
    const granted = Notification.permission === 'granted';
    btn.classList.toggle('active', granted);
    btn.title = granted ? 'Notificaciones activadas' : 'Activar notificaciones';
    btn.innerHTML = granted ? '🔔' : '🔕';
  };

  updateState();

  btn.addEventListener('click', async () => {
    if (Notification.permission === 'granted') {
      showToast('Notificaciones', 'Las notificaciones ya están activadas.');
      return;
    }
    const perm = await Notification.requestPermission();
    updateState();
    if (perm === 'granted') {
      showToast('✅ Notificadas activadas', 'Te avisaremos antes de cada evento especial.');
      scheduleEventNotifications();
    }
  });
}

function scheduleEventNotifications() {
  const events = state.eventsData?.events || [];
  const now = Date.now();
  for (const ev of events) {
    const start = new Date(ev.date).getTime();
    const msToEvent = start - now;
    const msTo1h    = msToEvent - 3600000;
    if (msTo1h > 0) {
      setTimeout(() => {
        new Notification(`iRacing: ${ev.name}`, {
          body: `¡Comienza en 1 hora! ${ev.circuit}`,
          icon: '/logo.png'
        });
      }, msTo1h);
    }
  }
}

// ============================================
// INTERACTIONS (series expand/collapse)
// ============================================
function toggleSeries(header) {
  const card = header.parentElement;
  if (card.classList.contains('expanded')) { card.classList.remove('expanded'); return; }
  document.querySelectorAll('.series-card.expanded').forEach(c => c.classList.remove('expanded'));
  card.classList.add('expanded');
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
}

function toggleAllInSection(btn) {
  const section = btn.closest('.license-section');
  const cards   = section.querySelectorAll('.series-card');
  const anyOpen = [...cards].some(c => c.classList.contains('expanded'));
  cards.forEach(c => c.classList.toggle('expanded', !anyOpen));
  btn.textContent = anyOpen ? 'Expandir todo' : 'Colapsar todo';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(title, msg, duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<div class="toast-title">${title}</div><div class="toast-msg">${msg}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ============================================
// PWA
// ============================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function setupPWAInstall() {
  const prompt = document.getElementById('pwaPrompt');
  const installBtn = document.getElementById('pwaInstall');
  const dismissBtn = document.getElementById('pwaDismiss');
  if (!prompt) return;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.pwaInstallEvent = e;
    prompt.classList.remove('hidden');
  });

  installBtn?.addEventListener('click', async () => {
    if (!state.pwaInstallEvent) return;
    state.pwaInstallEvent.prompt();
    const { outcome } = await state.pwaInstallEvent.userChoice;
    if (outcome === 'accepted') showToast('✅ Instalada', 'iRacing Calendar añadida a tu pantalla de inicio.');
    state.pwaInstallEvent = null;
    prompt.classList.add('hidden');
  });

  dismissBtn?.addEventListener('click', () => prompt.classList.add('hidden'));
}

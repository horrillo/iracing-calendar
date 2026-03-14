// ============================================
// iRacing Calendar App by Horrillo
// v4 - Semana actual + Info circuitos + Coches
// ============================================

const LICENSE_NAMES = {
    R: 'ROOKIE',
    D: 'CLASE D',
    C: 'CLASE C',
    B: 'CLASE B',
    A: 'CLASE A'
};

const CATEGORY_MAP = {
    'oval': 'OVAL',
    'sports': 'SPORTS CAR',
    'formula': 'FORMULA CAR',
    'dirt-oval': 'DIRT OVAL',
    'dirt-road': 'DIRT ROAD',
    'unranked': 'UNRANKED'
};

// Base de datos de circuitos (info REAL verificada)
const TRACKS_DB = {
    "Circuit de Spa-Francorchamps": {km: 7.004, turns: 19, country: "🇧🇪 Bélgica"},
    "Nürburgring Combined": {km: 25.378, turns: 154, country: "🇩🇪 Alemania"},
    "Nürburgring Nordschleife": {km: 20.832, turns: 154, country: "🇩🇪 Alemania"},
    "Nürburgring Grand Prix": {km: 5.148, turns: 15, country: "🇩🇪 Alemania"},
    "Autodromo Nazionale Monza - Grand Prix": {km: 5.793, turns: 11, country: "🇮🇹 Italia"},
    "Autodromo Nazionale Monza - Combined": {km: 5.793, turns: 11, country: "🇮🇹 Italia"},
    "Silverstone Circuit - Grand Prix": {km: 5.891, turns: 18, country: "🇬🇧 UK"},
    "Suzuka International Racing Course - Grand Prix": {km: 5.807, turns: 18, country: "🇯🇵 Japón"},
    "Circuit de Barcelona Catalunya - Grand Prix": {km: 4.655, turns: 16, country: "🇪🇸 España"},
    "Sebring International Raceway": {km: 6.02, turns: 17, country: "🇺🇸 USA"},
    "Daytona International Speedway - Road Course": {km: 5.73, turns: 12, country: "🇺🇸 USA"},
    "Daytona International Speedway - Oval": {km: 4.023, turns: 4, country: "🇺🇸 USA"},
    "Indianapolis Motor Speedway - Road Course": {km: 4.17, turns: 14, country: "🇺🇸 USA"},
    "Indianapolis Motor Speedway - Oval": {km: 4.023, turns: 4, country: "🇺🇸 USA"},
    "Indianapolis Motor Speedway - Open Wheel": {km: 4.023, turns: 4, country: "🇺🇸 USA"},
    "Circuit of the Americas - Grand Prix": {km: 5.513, turns: 20, country: "🇺🇸 USA"},
    "Le Mans - 24 Hours of Le Mans": {km: 13.626, turns: 38, country: "🇫🇷 Francia"},
    "Mount Panorama Circuit": {km: 6.213, turns: 23, country: "🇦🇺 Australia"},
    "Autódromo José Carlos Pace - Grand Prix": {km: 4.309, turns: 15, country: "🇧🇷 Brasil"},
    "Autódromo Hermanos Rodríguez - Grand Prix": {km: 4.304, turns: 17, country: "🇲🇽 México"},
    "Autódromo Hermanos Rodríguez - Oval": {km: 2.0, turns: 4, country: "🇲🇽 México"},
    "Brands Hatch Circuit - Grand Prix": {km: 3.908, turns: 9, country: "🇬🇧 UK"},
    "Brands Hatch Circuit - Indy": {km: 1.929, turns: 6, country: "🇬🇧 UK"},
    "Watkins Glen International - Boot": {km: 5.43, turns: 11, country: "🇺🇸 USA"},
    "Watkins Glen International - Classic Boot": {km: 5.43, turns: 11, country: "🇺🇸 USA"},
    "Road America - Full Course": {km: 6.515, turns: 14, country: "🇺🇸 USA"},
    "Road Atlanta - Full Course": {km: 4.088, turns: 12, country: "🇺🇸 USA"},
    "WeatherTech Raceway at Laguna Seca": {km: 3.602, turns: 11, country: "🇺🇸 USA"},
    "Fuji Speedway - Grand Prix": {km: 4.563, turns: 16, country: "🇯🇵 Japón"},
    "Hungaroring - Grand Prix": {km: 4.381, turns: 14, country: "🇭🇺 Hungría"},
    "Red Bull Ring - Grand Prix": {km: 4.318, turns: 10, country: "🇦🇹 Austria"},
    "Zandvoort - Grand Prix": {km: 4.259, turns: 14, country: "🇳🇱 Países Bajos"},
    "Algarve International Circuit - Grand Prix": {km: 4.653, turns: 15, country: "🇵🇹 Portugal"},
    "Talladega Superspeedway": {km: 4.28, turns: 4, country: "🇺🇸 USA"},
    "Charlotte Motor Speedway - Oval": {km: 2.414, turns: 4, country: "🇺🇸 USA"},
    "Charlotte Motor Speedway - Roval 2025": {km: 3.75, turns: 17, country: "🇺🇸 USA"},
    "Charlotte Motor Speedway - Legends Oval": {km: 0.4, turns: 4, country: "🇺🇸 USA"},
    "Texas Motor Speedway": {km: 2.414, turns: 4, country: "🇺🇸 USA"},
    "Bristol Motor Speedway": {km: 0.859, turns: 4, country: "🇺🇸 USA"},
    "Bristol Motor Speedway - Dirt": {km: 0.859, turns: 4, country: "🇺🇸 USA"},
    "Martinsville Speedway": {km: 0.847, turns: 4, country: "🇺🇸 USA"},
    "Richmond Raceway": {km: 1.207, turns: 4, country: "🇺🇸 USA"},
    "Darlington Raceway": {km: 2.232, turns: 4, country: "🇺🇸 USA"},
    "Dover Motor Speedway": {km: 1.609, turns: 4, country: "🇺🇸 USA"},
    "Phoenix Raceway": {km: 1.609, turns: 4, country: "🇺🇸 USA"},
    "Kansas Speedway": {km: 2.414, turns: 4, country: "🇺🇸 USA"},
    "Michigan International Speedway": {km: 3.219, turns: 4, country: "🇺🇸 USA"},
    "Las Vegas Motor Speedway - Oval": {km: 2.414, turns: 4, country: "🇺🇸 USA"},
    "Atlanta Motor Speedway": {km: 2.414, turns: 4, country: "🇺🇸 USA"},
    "Homestead Miami Speedway - Oval": {km: 2.414, turns: 4, country: "🇺🇸 USA"},
    "Iowa Speedway - Oval": {km: 1.424, turns: 4, country: "🇺🇸 USA"},
    "New Hampshire Motor Speedway - Oval": {km: 1.689, turns: 4, country: "🇺🇸 USA"},
    "Pocono Raceway": {km: 4.023, turns: 3, country: "🇺🇸 USA"},
    "Sonoma Raceway - Cup": {km: 3.862, turns: 12, country: "🇺🇸 USA"},
    "Oulton Park Circuit - Fosters": {km: 2.692, turns: 8, country: "🇬🇧 UK"},
    "Oulton Park Circuit - International": {km: 4.307, turns: 15, country: "🇬🇧 UK"},
    "Donington Park - Grand Prix": {km: 4.023, turns: 12, country: "🇬🇧 UK"},
    "Donington Park - National": {km: 3.149, turns: 9, country: "🇬🇧 UK"},
    "Snetterton Circuit - 300": {km: 4.779, turns: 12, country: "🇬🇧 UK"},
    "Knockhill Racing Circuit": {km: 2.037, turns: 9, country: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia"},
    "Hockenheimring - Grand Prix": {km: 4.574, turns: 17, country: "🇩🇪 Alemania"},
    "Circuito de Navarra - Speed Circuit": {km: 3.933, turns: 15, country: "🇪🇸 España"},
    "Circuit de Lédenon": {km: 3.156, turns: 14, country: "🇫🇷 Francia"},
    "Autodrom Most": {km: 4.219, turns: 21, country: "🇨🇿 Chequia"},
    "Motorsport Arena Oschersleben - Grand Prix": {km: 3.696, turns: 14, country: "🇩🇪 Alemania"},
    "Imola - Grand Prix": {km: 4.909, turns: 19, country: "🇮🇹 Italia"},
    "Autodromo Internazionale Enzo e Dino Ferrari - Grand Prix": {km: 4.909, turns: 19, country: "🇮🇹 Italia"},
    "Okayama International Circuit - Full Course": {km: 3.703, turns: 13, country: "🇯🇵 Japón"},
    "Twin Ring Motegi - Grand Prix": {km: 4.801, turns: 14, country: "🇯🇵 Japón"},
    "Mobility Resort Motegi - Grand Prix": {km: 4.801, turns: 14, country: "🇯🇵 Japón"},
    "Mobility Resort Motegi - Oval": {km: 2.4, turns: 4, country: "🇯🇵 Japón"},
    "Eldora Speedway": {km: 0.805, turns: 4, country: "🇺🇸 USA"},
    "Knoxville Raceway": {km: 0.805, turns: 4, country: "🇺🇸 USA"},
    "Williams Grove Speedway": {km: 0.805, turns: 4, country: "🇺🇸 USA"},
    "Volusia Speedway Park": {km: 0.805, turns: 4, country: "🇺🇸 USA"},
    "Lime Rock Park - Grand Prix": {km: 2.414, turns: 7, country: "🇺🇸 USA"},
    "Lime Rock Park - Chicanes": {km: 2.414, turns: 9, country: "🇺🇸 USA"},
    "Virginia International Raceway - Full Course": {km: 5.263, turns: 24, country: "🇺🇸 USA"},
    "Virginia International Raceway - North Course": {km: 2.816, turns: 10, country: "🇺🇸 USA"},
    "Canadian Tire Motorsports Park": {km: 3.957, turns: 10, country: "🇨🇦 Canadá"},
    "Summit Point Raceway - Summit Point Raceway": {km: 3.219, turns: 10, country: "🇺🇸 USA"},
    "Adelaide Street Circuit": {km: 3.219, turns: 14, country: "🇦🇺 Australia"},
    "Long Beach Street Circuit": {km: 3.167, turns: 11, country: "🇺🇸 USA"},
    "Detroit Grand Prix at Belle Isle": {km: 3.331, turns: 14, country: "🇺🇸 USA"},
    "St. Petersburg Grand Prix - Grand Prix": {km: 2.897, turns: 14, country: "🇺🇸 USA"},
    "Chicago Street Course - 2023 Cup": {km: 3.54, turns: 12, country: "🇺🇸 USA"},
    "Nashville Superspeedway": {km: 2.089, turns: 4, country: "🇺🇸 USA"},
    "North Wilkesboro Speedway - Oval": {km: 1.017, turns: 4, country: "🇺🇸 USA"},
    "North Wilkesboro Speedway - Oval - 1987": {km: 1.017, turns: 4, country: "🇺🇸 USA"},
    "World Wide Technology Raceway (Gateway)": {km: 2.0, turns: 4, country: "🇺🇸 USA"},
    "World Wide Technology Raceway (Gateway) -": {km: 2.0, turns: 4, country: "🇺🇸 USA"},
};

let calendarData = null;
let alertsData = null;
let currentWeek = 1;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    calculateCurrentWeek();
    await loadAlerts();
    await loadCalendarData();
    setupNavigation();
});

// ============================================
// CALCULATE CURRENT WEEK
// ============================================
function calculateCurrentWeek() {
    const today = new Date();
    const seasonWeeks = [
        {week: 1, start: "2026-03-17", end: "2026-03-23"},
        {week: 2, start: "2026-03-24", end: "2026-03-30"},
        {week: 3, start: "2026-03-31", end: "2026-04-06"},
        {week: 4, start: "2026-04-07", end: "2026-04-13"},
        {week: 5, start: "2026-04-14", end: "2026-04-20"},
        {week: 6, start: "2026-04-21", end: "2026-04-27"},
        {week: 7, start: "2026-04-28", end: "2026-05-04"},
        {week: 8, start: "2026-05-05", end: "2026-05-11"},
        {week: 9, start: "2026-05-12", end: "2026-05-18"},
        {week: 10, start: "2026-05-19", end: "2026-05-25"},
        {week: 11, start: "2026-05-26", end: "2026-06-01"},
        {week: 12, start: "2026-06-02", end: "2026-06-08"},
        {week: 13, start: "2026-06-09", end: "2026-06-15"}
    ];
    
    for (const w of seasonWeeks) {
        const start = new Date(w.start);
        const end = new Date(w.end);
        end.setHours(23, 59, 59);
        
        if (today >= start && today <= end) {
            currentWeek = w.week;
            break;
        }
    }
    
    console.log("Semana actual:", currentWeek);
}

// ============================================
// ALERTS SYSTEM
// ============================================
async function loadAlerts() {
    try {
        const response = await fetch('/data/avisos.json');
        if (!response.ok) return;
        
        alertsData = await response.json();
        renderAlerts();
        
    } catch (error) {
        console.log('No alerts file found');
    }
}

function renderAlerts() {
    if (!alertsData) return;
    
    const container = document.getElementById('alertsContainer');
    let hasAlerts = false;
    let alertsHtml = '';
    
    if (alertsData.calendario_provisional === true) {
        hasAlerts = true;
        const msg = alertsData.mensaje_provisional || {
            es: '⚠️ Este calendario es PROVISIONAL.',
            en: '⚠️ This schedule is PROVISIONAL.'
        };
        
        alertsHtml += `
            <div class="alert alert-provisional">
                <div class="alert-text">
                    <span>${msg.es}</span>
                    <span class="alert-separator">|</span>
                    <span class="alert-lang">${msg.en}</span>
                </div>
            </div>
        `;
    }
    
    if (alertsData.avisos && alertsData.avisos.length > 0) {
        for (const aviso of alertsData.avisos) {
            if (aviso.activo === true) {
                hasAlerts = true;
                alertsHtml += `
                    <div class="alert alert-custom">
                        <div class="alert-text">
                            <span>${aviso.es || ''}</span>
                            ${aviso.en ? `<span class="alert-separator">|</span><span class="alert-lang">${aviso.en}</span>` : ''}
                        </div>
                    </div>
                `;
            }
        }
    }
    
    container.innerHTML = alertsHtml;
    container.classList.toggle('has-alerts', hasAlerts);
}

// ============================================
// CALENDAR DATA
// ============================================
async function loadCalendarData() {
    try {
        const response = await fetch('/data/calendar.json');
        if (!response.ok) throw new Error('No se pudo cargar');
        
        calendarData = await response.json();
        
        const seasonBadge = document.getElementById('seasonBadge');
        seasonBadge.textContent = calendarData.meta?.season || 'Season 2 • 2026';
        
        renderCategory('oval');
        
    } catch (error) {
        console.error('Error:', error);
        showError('No se pudo cargar el calendario.');
    }
}

function showError(message) {
    document.getElementById('mainContent').innerHTML = `
        <div class="error-message"><p>⚠️ ${message}</p></div>
    `;
}

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            if (category === 'special') {
                renderSpecialEvents();
            } else {
                renderCategory(category);
            }
        });
    });
}

// ============================================
// RENDER CATEGORY
// ============================================
function renderCategory(categoryId) {
    if (!calendarData) return;
    
    const categoryName = CATEGORY_MAP[categoryId];
    const categoryData = calendarData.series?.[categoryName];
    
    if (!categoryData) {
        showError(`No hay datos para ${categoryName}`);
        return;
    }
    
    let html = `<section class="category-section active">`;
    
    for (const license of ['R', 'D', 'C', 'B', 'A']) {
        const seriesList = categoryData[license];
        if (!seriesList || seriesList.length === 0) continue;
        
        html += `
            <div class="license-section">
                <div class="license-header ${license}">
                    <div class="license-badge ${license}">${license}</div>
                    <span class="license-title">${LICENSE_NAMES[license]}</span>
                    <span class="license-count">${seriesList.length} series</span>
                    <button class="expand-btn" onclick="toggleAllInSection(this)">Expandir todo</button>
                </div>
                <div class="series-grid">
                    ${seriesList.map(s => renderSeriesCard(s)).join('')}
                </div>
            </div>
        `;
    }
    
    html += `</section>`;
    document.getElementById('mainContent').innerHTML = html;
}

function renderSeriesCard(series) {
    const fixedTag = series.fixed ? '<span class="series-tag">FIXED</span>' : '';
    
    // Info de la serie
    let seriesInfoHtml = '<div class="series-info">';
    
    if (series.car) {
        seriesInfoHtml += `<div class="info-row"><span class="info-icon">🚗</span><span class="info-label">Coche:</span><span class="info-value">${series.car}</span></div>`;
    }
    if (series.license_range) {
        seriesInfoHtml += `<div class="info-row"><span class="info-icon">📋</span><span class="info-label">Licencia:</span><span class="info-value">${series.license_range}</span></div>`;
    }
    if (series.race_frequency) {
        seriesInfoHtml += `<div class="info-row"><span class="info-icon">⏰</span><span class="info-label">Carreras:</span><span class="info-value">${series.race_frequency}</span></div>`;
    }
    if (series.incidents) {
        seriesInfoHtml += `<div class="info-row"><span class="info-icon">⚠️</span><span class="info-label">Incidentes:</span><span class="info-value">${series.incidents}</span></div>`;
    }
    
    seriesInfoHtml += '</div>';
    
    // Semanas
    let weeksHtml = '<div class="weeks-list">';
    
    for (const week of (series.weeks || [])) {
        const isCurrentWeek = week.week === currentWeek;
        const weatherHtml = getWeatherHtml(week.rain);
        const trackInfo = getTrackInfo(week.track);
        
        const currentClass = isCurrentWeek ? 'current-week' : '';
        const currentBadge = isCurrentWeek ? '<span class="current-badge">AHORA</span>' : '';
        
        weeksHtml += `
            <div class="week-row ${currentClass}">
                <span class="week-num">W${week.week}${currentBadge}</span>
                <div class="week-track-container">
                    <span class="week-track" title="${week.track}">${week.track}</span>
                    ${trackInfo}
                </div>
                <span class="week-details">
                    ${week.start_type ? `<span class="week-start-type">${week.start_type}</span>` : ''}
                    ${week.duration ? `<span class="week-duration">${week.duration}</span>` : ''}
                </span>
                <span class="week-temp" title="Temperatura del aire">${week.temp_c}°C</span>
                <span class="week-weather">${weatherHtml}</span>
            </div>
        `;
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
                ${seriesInfoHtml}
                <div class="weeks-divider"></div>
                ${weeksHtml}
            </div>
        </div>
    `;
}

function getTrackInfo(trackName) {
    // Buscar en la base de datos
    let info = TRACKS_DB[trackName];
    
    // Intentar coincidencia parcial
    if (!info) {
        for (const [key, value] of Object.entries(TRACKS_DB)) {
            if (trackName.includes(key) || key.includes(trackName.substring(0, 20))) {
                info = value;
                break;
            }
        }
    }
    
    if (!info) return '';
    
    return `<span class="track-info">${info.country} • ${info.km}km • ${info.turns} curvas</span>`;
}

function getWeatherHtml(rain) {
    if (rain === 'None' || !rain) {
        return '<span class="weather-icon">☀️</span>';
    }
    
    const pct = parseInt(rain);
    let cls = 'rain-low';
    if (pct >= 50) cls = 'rain-high';
    else if (pct >= 30) cls = 'rain-med';
    
    return `<span class="weather-icon">🌧️</span><span class="rain-chance ${cls}">${rain}</span>`;
}

// ============================================
// SPECIAL EVENTS
// ============================================
function renderSpecialEvents() {
    const events = calendarData?.specialEvents || [];
    
    let html = `<section class="category-section active">`;
    
    if (events.length === 0) {
        html += `
            <div class="special-event-card">
                <span class="special-event-badge">EVENTO ESPECIAL</span>
                <h2 class="special-event-title">🏆 2026 12 Hours of Sebring Presented by VCO</h2>
                <div class="special-event-details">
                    <p><strong>📅 Fecha:</strong> 27-28 de Marzo 2026</p>
                    <p><strong>⏰ Horarios:</strong> 22:00 GMT | 07:00 GMT | 12:00 GMT | 16:00 GMT</p>
                    <p><strong>🏁 Circuito:</strong> Sebring International Raceway (6.02 km, 17 curvas)</p>
                    <p><strong>📋 Licencia:</strong> Class D (4.0) → Pro/WC (4.0)</p>
                    <p><strong>👥 Tipo:</strong> Team Racing</p>
                    <p><strong>👤 Entradas:</strong> Mín: 6 | Split: 60 | Drops: 0</p>
                    <p><strong>⚠️ Incidentes:</strong> Penalty at 50, every 20 after. DQ at 150</p>
                </div>
            </div>
        `;
    } else {
        for (const event of events) {
            html += `
                <div class="special-event-card">
                    <span class="special-event-badge">EVENTO ESPECIAL</span>
                    <h2 class="special-event-title">🏆 ${event.name}</h2>
                    <div class="special-event-details">
                        ${event.date ? `<p><strong>📅 Fecha:</strong> ${event.date}</p>` : ''}
                        ${event.times ? `<p><strong>⏰ Horarios:</strong> ${event.times}</p>` : ''}
                        ${event.track ? `<p><strong>🏁 Circuito:</strong> ${event.track}</p>` : ''}
                        ${event.license ? `<p><strong>📋 Licencia:</strong> ${event.license}</p>` : ''}
                        ${event.type ? `<p><strong>👥 Tipo:</strong> ${event.type}</p>` : ''}
                        ${event.min_entries ? `<p><strong>👤 Entradas:</strong> Mín: ${event.min_entries} | Split: ${event.split_at} | Drops: ${event.drops}</p>` : ''}
                        ${event.incidents ? `<p><strong>⚠️ Incidentes:</strong> ${event.incidents}</p>` : ''}
                    </div>
                </div>
            `;
        }
    }
    
    html += `</section>`;
    document.getElementById('mainContent').innerHTML = html;
}

// ============================================
// INTERACTIONS
// ============================================
function toggleSeries(header) {
    const card = header.parentElement;
    
    if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        return;
    }
    
    // Cerrar TODAS las demás
    document.querySelectorAll('.series-card.expanded').forEach(c => c.classList.remove('expanded'));
    
    card.classList.add('expanded');
    
    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function toggleAllInSection(btn) {
    const section = btn.closest('.license-section');
    const cards = section.querySelectorAll('.series-card');
    const anyExpanded = [...cards].some(c => c.classList.contains('expanded'));
    
    cards.forEach(card => {
        card.classList.toggle('expanded', !anyExpanded);
    });
    
    btn.textContent = anyExpanded ? 'Expandir todo' : 'Colapsar todo';
}

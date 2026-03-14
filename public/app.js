// ============================================
// iRacing Calendar App by Horrillo
// v3 - Con info completa y expansión única
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

let calendarData = null;
let alertsData = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadAlerts();
    await loadCalendarData();
    setupNavigation();
});

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
        console.log('No alerts file found or error loading:', error);
    }
}

function renderAlerts() {
    if (!alertsData) return;
    
    const container = document.getElementById('alertsContainer');
    let hasAlerts = false;
    let alertsHtml = '';
    
    // Check provisional calendar alert
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
    
    // Check custom alerts
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
    
    if (hasAlerts) {
        container.classList.add('has-alerts');
    } else {
        container.classList.remove('has-alerts');
    }
}

// ============================================
// CALENDAR DATA
// ============================================
async function loadCalendarData() {
    try {
        const response = await fetch('/data/calendar.json');
        if (!response.ok) throw new Error('No se pudo cargar el calendario');
        
        calendarData = await response.json();
        
        // Update season badge
        const seasonBadge = document.getElementById('seasonBadge');
        if (calendarData.meta) {
            seasonBadge.textContent = calendarData.meta.season || 'Season 2 • 2026';
        } else {
            seasonBadge.textContent = 'Season 2 • 2026';
        }
        
        // Render initial category
        renderCategory('oval');
        
    } catch (error) {
        console.error('Error loading calendar:', error);
        showError('No se pudo cargar el calendario. Asegúrate de que el archivo calendar.json existe.');
    }
}

function showError(message) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="error-message">
            <p>⚠️ ${message}</p>
        </div>
    `;
}

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active state
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Render category
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
    const categoryData = calendarData.series?.[categoryName] || calendarData[categoryName];
    
    if (!categoryData) {
        showError(`No hay datos para la categoría ${categoryName}`);
        return;
    }
    
    const mainContent = document.getElementById('mainContent');
    let html = `<section class="category-section active">`;
    
    const licenses = ['R', 'D', 'C', 'B', 'A'];
    
    for (const license of licenses) {
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
        `;
        
        for (const series of seriesList) {
            html += renderSeriesCard(series);
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += `</section>`;
    mainContent.innerHTML = html;
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
    let weeksHtml = '';
    if (series.weeks && series.weeks.length > 0) {
        weeksHtml = '<div class="weeks-list">';
        
        for (const week of series.weeks) {
            const weatherHtml = getWeatherHtml(week.rain);
            const durationHtml = week.duration ? `<span class="week-duration">${week.duration}</span>` : '';
            const startTypeHtml = week.start_type ? `<span class="week-start-type">${week.start_type}</span>` : '';
            
            weeksHtml += `
                <div class="week-row">
                    <span class="week-num">W${week.week}</span>
                    <span class="week-track" title="${week.track}">${week.track}</span>
                    <span class="week-details">
                        ${startTypeHtml}
                        ${durationHtml}
                    </span>
                    <span class="week-temp" title="Temperatura del aire">${week.temp_c}°C</span>
                    <span class="week-weather">${weatherHtml}</span>
                </div>
            `;
        }
        
        weeksHtml += '</div>';
    }
    
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

function getWeatherHtml(rain) {
    if (rain === 'None' || !rain) {
        return '<span class="weather-icon">☀️</span>';
    }
    
    const percentage = parseInt(rain.replace('%', ''));
    let rainClass = 'rain-low';
    if (percentage >= 50) rainClass = 'rain-high';
    else if (percentage >= 30) rainClass = 'rain-med';
    
    return `<span class="weather-icon">🌧️</span><span class="rain-chance ${rainClass}">${rain}</span>`;
}

// ============================================
// RENDER SPECIAL EVENTS
// ============================================
function renderSpecialEvents() {
    if (!calendarData) return;
    
    const specialEvents = calendarData.specialEvents || calendarData['SPECIAL EVENTS'] || [];
    
    const mainContent = document.getElementById('mainContent');
    
    let html = `<section class="category-section active">`;
    
    if (specialEvents.length === 0) {
        html += `
            <div class="special-event-card">
                <span class="special-event-badge">EVENTO ESPECIAL</span>
                <h2 class="special-event-title">🏆 2026 12 Hours of Sebring Presented by VCO</h2>
                <div class="special-event-details">
                    <p><strong>📅 Fecha:</strong> 27-28 de Marzo 2026</p>
                    <p><strong>⏰ Horarios:</strong> 22:00 GMT | 07:00 GMT | 12:00 GMT | 16:00 GMT</p>
                    <p><strong>🏁 Circuito:</strong> Sebring International Raceway</p>
                    <p><strong>📋 Licencia mínima:</strong> Class D (4.0) → Pro/WC (4.0)</p>
                    <p><strong>👥 Tipo:</strong> Team Racing (carreras por equipos)</p>
                    <p><strong>👤 Entradas mínimas:</strong> 6 | Split en: 60 | Drops: 0</p>
                    <p><strong>⚠️ Incidentes:</strong> Penalización cada 50 inc. y cada 20 después. DQ a 150 inc.</p>
                </div>
            </div>
        `;
    } else {
        for (const event of specialEvents) {
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
    mainContent.innerHTML = html;
}

// ============================================
// INTERACTIONS
// ============================================
function toggleSeries(header) {
    const card = header.parentElement;
    const grid = card.closest('.series-grid');
    
    // Si la tarjeta ya está expandida, solo la cerramos
    if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        return;
    }
    
    // Cerrar todas las demás tarjetas en el mismo grid
    const allCards = grid.querySelectorAll('.series-card.expanded');
    allCards.forEach(c => c.classList.remove('expanded'));
    
    // Abrir la tarjeta actual
    card.classList.add('expanded');
    
    // Scroll suave para que se vea la tarjeta
    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function toggleAllInSection(btn) {
    const section = btn.closest('.license-section');
    const cards = section.querySelectorAll('.series-card');
    const anyExpanded = [...cards].some(c => c.classList.contains('expanded'));
    
    cards.forEach(card => {
        if (anyExpanded) {
            card.classList.remove('expanded');
        } else {
            card.classList.add('expanded');
        }
    });
    
    btn.textContent = anyExpanded ? 'Expandir todo' : 'Colapsar todo';
}

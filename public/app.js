// ============================================
// iRacing Calendar App by Horrillo
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

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadCalendarData();
    setupNavigation();
});

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
                    <button class="expand-btn" onclick="toggleAllInSection(this)">Expandir</button>
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
    
    let weeksHtml = '';
    if (series.weeks && series.weeks.length > 0) {
        weeksHtml = '<div class="weeks-list">';
        
        for (const week of series.weeks) {
            const weatherHtml = getWeatherHtml(week.rain);
            
            weeksHtml += `
                <div class="week-row">
                    <span class="week-num">W${week.week}</span>
                    <span class="week-track" title="${week.track}">${week.track}</span>
                    <span class="week-temp">${week.temp_c}°C</span>
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
        // Default Sebring event if no data
        html += `
            <div class="special-event-card">
                <span class="special-event-badge">EVENTO ESPECIAL</span>
                <h2 class="special-event-title">🏆 2026 12 Hours of Sebring Presented by VCO</h2>
                <div class="special-event-details">
                    <p><strong>📅 Fecha:</strong> 27-28 de Marzo 2026</p>
                    <p><strong>⏰ Horarios:</strong> 22:00 GMT | 07:00 GMT | 12:00 GMT | 16:00 GMT</p>
                    <p><strong>🏁 Circuito:</strong> Sebring International Raceway</p>
                    <p><strong>📋 Licencia mínima:</strong> Clase D (4.0)</p>
                    <p><strong>👥 Tipo:</strong> Team Racing (carreras por equipos)</p>
                    <p><strong>⚠️ Incidentes:</strong> Penalización cada 50 inc. DQ a 150 inc.</p>
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
                        ${event.license ? `<p><strong>📋 Licencia mínima:</strong> ${event.license}</p>` : ''}
                        ${event.type ? `<p><strong>👥 Tipo:</strong> ${event.type}</p>` : ''}
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
    card.classList.toggle('expanded');
}

function toggleAllInSection(btn) {
    const section = btn.closest('.license-section');
    const cards = section.querySelectorAll('.series-card');
    const allExpanded = [...cards].every(c => c.classList.contains('expanded'));
    
    cards.forEach(card => {
        if (allExpanded) {
            card.classList.remove('expanded');
        } else {
            card.classList.add('expanded');
        }
    });
    
    btn.textContent = allExpanded ? 'Expandir' : 'Colapsar';
}

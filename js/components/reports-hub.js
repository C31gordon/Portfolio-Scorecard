/**
 * Reports Hub - Portfolio Scorecard v2
 * Central hub for all report types with property selection
 */

import { riseProperties } from '../data/rise-data.js';
import { formatPercent, formatCurrency, formatNumber } from '../utils/formatting.js';

/**
 * Report type definitions
 */
export const REPORT_TYPES = {
  executive: {
    id: 'executive',
    title: 'Executive Report',
    icon: '📊',
    description: 'Weekly performance summary with KPIs, red flags, and action items',
    color: '#6366f1'
  },
  investor: {
    id: 'investor',
    title: 'Investor Report',
    icon: '💼',
    description: 'Polished 2-page report for stakeholders and board presentations',
    color: '#8b5cf6'
  },
  daily: {
    id: 'daily',
    title: 'Daily Report',
    icon: '📅',
    description: 'Quick daily snapshot of critical metrics and urgent items',
    color: '#22c55e'
  },
  weekly: {
    id: 'weekly',
    title: 'Weekly Report',
    icon: '📆',
    description: 'Comprehensive weekly analysis with trends and comparisons',
    color: '#3b82f6'
  }
};

/**
 * Get all properties for selection
 */
function getPropertyList() {
  return riseProperties.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    rd: p.rd,
    units: p.type === 'OC' || p.type === 'STU' ? p.beds : p.units
  })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Render the Reports Hub modal
 */
export function renderReportsHub() {
  return `
    <div class="reports-hub">
      <div class="reports-hub__header">
        <h2>📋 Reports Hub</h2>
        <p class="reports-hub__subtitle">Select a report type to generate</p>
      </div>
      
      <div class="reports-hub__grid">
        ${Object.values(REPORT_TYPES).map(report => `
          <div class="report-card" data-report-type="${report.id}" style="--card-accent: ${report.color}">
            <div class="report-card__icon">${report.icon}</div>
            <div class="report-card__content">
              <h3 class="report-card__title">${report.title}</h3>
              <p class="report-card__description">${report.description}</p>
            </div>
            <div class="report-card__arrow">→</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render property selector for a report type
 */
export function renderPropertySelector(reportType) {
  const report = REPORT_TYPES[reportType];
  const properties = getPropertyList();
  
  // Group by type
  const byType = {
    'OC': properties.filter(p => p.type === 'OC'),
    'STU': properties.filter(p => p.type === 'STU'),
    'CON': properties.filter(p => p.type === 'CON'),
    '55+': properties.filter(p => p.type === '55+'),
    'BFR': properties.filter(p => p.type === 'BFR')
  };
  
  const typeLabels = {
    'OC': 'On-Campus Student',
    'STU': 'Off-Campus Student',
    'CON': 'Conventional',
    '55+': 'Active Adult (55+)',
    'BFR': 'Build-for-Rent'
  };
  
  return `
    <div class="property-selector">
      <div class="property-selector__header">
        <button class="btn btn--ghost btn--sm" data-action="back-to-hub">
          ← Back
        </button>
        <div class="property-selector__title">
          <span class="property-selector__icon" style="color: ${report.color}">${report.icon}</span>
          <h3>${report.title}</h3>
        </div>
      </div>
      
      <p class="property-selector__subtitle">Select a property or generate for entire portfolio</p>
      
      <div class="property-selector__options">
        <button class="property-option property-option--portfolio" data-generate-report="${reportType}" data-property="portfolio">
          <span class="property-option__icon">🏢</span>
          <span class="property-option__name">Entire Portfolio</span>
          <span class="property-option__meta">${properties.length} properties</span>
        </button>
        
        <div class="property-selector__divider">
          <span>Or select a property</span>
        </div>
        
        <div class="property-selector__search">
          <input type="text" class="input" placeholder="Search properties..." data-action="filter-properties">
        </div>
        
        <div class="property-selector__list" data-property-list>
          ${Object.entries(byType).filter(([_, props]) => props.length > 0).map(([type, props]) => `
            <div class="property-group">
              <div class="property-group__header">${typeLabels[type]} (${props.length})</div>
              ${props.map(p => `
                <button class="property-option" data-generate-report="${reportType}" data-property="${p.id}">
                  <span class="property-option__name">${p.name}</span>
                  <span class="property-option__meta">${p.units} ${p.type === 'OC' || p.type === 'STU' ? 'beds' : 'units'}</span>
                </button>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate Daily Report for a property
 */
export function generateDailyReport(propertyId) {
  const isPortfolio = propertyId === 'portfolio';
  const properties = isPortfolio ? riseProperties : riseProperties.filter(p => p.id === propertyId);
  const prop = properties[0];
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  if (isPortfolio) {
    return generatePortfolioDailyReport(properties, dateStr);
  }
  
  // Calculate metrics
  const occupiedUnits = Math.round((prop.physOcc || 0) * (prop.units || prop.beds || 0));
  const totalUnits = prop.units || prop.beds || 0;
  const leasedUnits = Math.round((prop.leased || 0) * totalUnits);
  
  // Determine urgent items
  const urgentItems = [];
  if (prop.physOcc < 0.90) urgentItems.push({ type: 'critical', text: `Occupancy at ${formatPercent(prop.physOcc)} - below 90% threshold` });
  if (prop.delinq > 0.03) urgentItems.push({ type: 'critical', text: `Delinquency at ${formatPercent(prop.delinq)} - exceeds 3% threshold` });
  if (prop.woSla < 0.90) urgentItems.push({ type: 'warning', text: `WO SLA at ${formatPercent(prop.woSla)} - needs attention` });
  if (prop.googleStars && prop.googleStars < 4.0) urgentItems.push({ type: 'warning', text: `Google rating ${prop.googleStars.toFixed(1)}★ - below 4.0` });
  
  return `
    <div class="daily-report">
      <div class="report-header">
        <div class="report-header__title">
          <h1>📅 Daily Report</h1>
          <h2>${prop.name}</h2>
        </div>
        <div class="report-header__meta">
          <div class="report-date">${dateStr}</div>
          <div class="report-type-badge">${prop.type}</div>
        </div>
      </div>
      
      <div class="daily-report__snapshot">
        <h3>Today's Snapshot</h3>
        <div class="snapshot-grid">
          <div class="snapshot-card">
            <div class="snapshot-card__value">${formatPercent(prop.physOcc)}</div>
            <div class="snapshot-card__label">Physical Occ.</div>
            <div class="snapshot-card__detail">${occupiedUnits} / ${totalUnits} units</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-card__value">${formatPercent(prop.leased)}</div>
            <div class="snapshot-card__label">Leased %</div>
            <div class="snapshot-card__detail">${leasedUnits} / ${totalUnits} units</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-card__value">${formatPercent(prop.delinq)}</div>
            <div class="snapshot-card__label">Delinquency</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-card__value">${formatPercent(prop.woSla)}</div>
            <div class="snapshot-card__label">WO SLA</div>
          </div>
        </div>
      </div>
      
      ${urgentItems.length > 0 ? `
        <div class="daily-report__urgent">
          <h3>⚠️ Urgent Items</h3>
          <ul class="urgent-list">
            ${urgentItems.map(item => `
              <li class="urgent-item urgent-item--${item.type}">${item.text}</li>
            `).join('')}
          </ul>
        </div>
      ` : `
        <div class="daily-report__urgent daily-report__urgent--clear">
          <h3>✅ No Urgent Items</h3>
          <p>All metrics within acceptable thresholds.</p>
        </div>
      `}
      
      <div class="daily-report__leasing">
        <h3>Leasing Activity</h3>
        <div class="leasing-stats">
          <div class="leasing-stat">
            <span class="leasing-stat__value">${prop.mtdTraffic || '—'}</span>
            <span class="leasing-stat__label">MTD Traffic</span>
          </div>
          <div class="leasing-stat">
            <span class="leasing-stat__value">${prop.mtdLeases || '—'}</span>
            <span class="leasing-stat__label">MTD Leases</span>
          </div>
          <div class="leasing-stat">
            <span class="leasing-stat__value">${formatPercent(prop.mtdClosing)}</span>
            <span class="leasing-stat__label">Closing Ratio</span>
          </div>
          <div class="leasing-stat">
            <span class="leasing-stat__value">${formatPercent(prop.leadToTour)}</span>
            <span class="leasing-stat__label">Lead-to-Tour</span>
          </div>
        </div>
      </div>
      
      <div class="report-footer">
        <p>Generated ${new Date().toLocaleString()} | RISE Portfolio Scorecard</p>
      </div>
    </div>
  `;
}

/**
 * Generate Portfolio-level Daily Report
 */
function generatePortfolioDailyReport(properties, dateStr) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp);
  
  // Calculate portfolio averages
  let totalUnits = 0, occupiedUnits = 0, leasedUnits = 0;
  let delinqSum = 0, delinqCount = 0;
  let woSlaSum = 0, woSlaCount = 0;
  
  stabilized.forEach(p => {
    const units = p.type === 'OC' || p.type === 'STU' ? p.beds : p.units;
    if (!units) return;
    totalUnits += units;
    occupiedUnits += units * (p.physOcc || 0);
    leasedUnits += units * (p.leased || 0);
    if (p.delinq != null) { delinqSum += p.delinq; delinqCount++; }
    if (p.woSla != null) { woSlaSum += p.woSla; woSlaCount++; }
  });
  
  const avgOcc = totalUnits > 0 ? occupiedUnits / totalUnits : 0;
  const avgLeased = totalUnits > 0 ? leasedUnits / totalUnits : 0;
  const avgDelinq = delinqCount > 0 ? delinqSum / delinqCount : 0;
  const avgWoSla = woSlaCount > 0 ? woSlaSum / woSlaCount : 0;
  
  // Find red flags
  const redFlags = stabilized.filter(p => {
    let redCount = 0;
    if (p.physOcc < 0.88) redCount++;
    if (p.delinq > 0.03) redCount++;
    if (p.woSla < 0.88) redCount++;
    return redCount >= 2;
  });
  
  return `
    <div class="daily-report daily-report--portfolio">
      <div class="report-header">
        <div class="report-header__title">
          <h1>📅 Daily Portfolio Report</h1>
          <h2>RISE Residential</h2>
        </div>
        <div class="report-header__meta">
          <div class="report-date">${dateStr}</div>
          <div class="report-type-badge">Portfolio</div>
        </div>
      </div>
      
      <div class="daily-report__snapshot">
        <h3>Portfolio Snapshot</h3>
        <div class="snapshot-grid">
          <div class="snapshot-card">
            <div class="snapshot-card__value">${formatPercent(avgOcc)}</div>
            <div class="snapshot-card__label">Avg. Occupancy</div>
            <div class="snapshot-card__detail">${stabilized.length} stabilized properties</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-card__value">${formatPercent(avgLeased)}</div>
            <div class="snapshot-card__label">Avg. Leased</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-card__value">${formatPercent(avgDelinq)}</div>
            <div class="snapshot-card__label">Avg. Delinquency</div>
          </div>
          <div class="snapshot-card">
            <div class="snapshot-card__value">${formatPercent(avgWoSla)}</div>
            <div class="snapshot-card__label">Avg. WO SLA</div>
          </div>
        </div>
      </div>
      
      ${redFlags.length > 0 ? `
        <div class="daily-report__urgent">
          <h3>🚨 Properties Needing Attention (${redFlags.length})</h3>
          <ul class="urgent-list">
            ${redFlags.slice(0, 5).map(p => `
              <li class="urgent-item urgent-item--critical">
                <strong>${p.name}</strong>: Occ ${formatPercent(p.physOcc)}, Delinq ${formatPercent(p.delinq)}, WO SLA ${formatPercent(p.woSla)}
              </li>
            `).join('')}
            ${redFlags.length > 5 ? `<li class="urgent-item">...and ${redFlags.length - 5} more</li>` : ''}
          </ul>
        </div>
      ` : `
        <div class="daily-report__urgent daily-report__urgent--clear">
          <h3>✅ All Properties Performing Well</h3>
          <p>No properties with multiple red metrics.</p>
        </div>
      `}
      
      <div class="report-footer">
        <p>Generated ${new Date().toLocaleString()} | RISE Portfolio Scorecard</p>
      </div>
    </div>
  `;
}

/**
 * Generate Weekly Report for a property
 */
export function generateWeeklyReport(propertyId) {
  const isPortfolio = propertyId === 'portfolio';
  const properties = isPortfolio ? riseProperties : riseProperties.filter(p => p.id === propertyId);
  const prop = properties[0];
  
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() - 2); // Previous Friday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const dateRangeStr = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  if (isPortfolio) {
    return generatePortfolioWeeklyReport(properties, dateRangeStr);
  }
  
  // Generate mock WoW changes (in real app, this would come from historical data)
  const wowChanges = {
    physOcc: (Math.random() - 0.5) * 0.02,
    leased: (Math.random() - 0.5) * 0.03,
    delinq: (Math.random() - 0.5) * 0.01,
    woSla: (Math.random() - 0.5) * 0.02
  };
  
  const totalUnits = prop.units || prop.beds || 0;
  
  return `
    <div class="weekly-report">
      <div class="report-header">
        <div class="report-header__title">
          <h1>📆 Weekly Report</h1>
          <h2>${prop.name}</h2>
        </div>
        <div class="report-header__meta">
          <div class="report-date">${dateRangeStr}</div>
          <div class="report-type-badge">${prop.type}</div>
        </div>
      </div>
      
      <div class="weekly-report__summary">
        <h3>Week in Review</h3>
        <div class="summary-table">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current</th>
                <th>WoW Change</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Physical Occupancy</td>
                <td>${formatPercent(prop.physOcc)}</td>
                <td class="${wowChanges.physOcc >= 0 ? 'positive' : 'negative'}">${wowChanges.physOcc >= 0 ? '↑' : '↓'} ${formatPercent(Math.abs(wowChanges.physOcc))}</td>
                <td><span class="status-dot status-dot--${prop.physOcc >= 0.93 ? 'green' : prop.physOcc >= 0.88 ? 'yellow' : 'red'}"></span></td>
              </tr>
              <tr>
                <td>Leased %</td>
                <td>${formatPercent(prop.leased)}</td>
                <td class="${wowChanges.leased >= 0 ? 'positive' : 'negative'}">${wowChanges.leased >= 0 ? '↑' : '↓'} ${formatPercent(Math.abs(wowChanges.leased))}</td>
                <td><span class="status-dot status-dot--${prop.leased >= 0.95 ? 'green' : prop.leased >= 0.90 ? 'yellow' : 'red'}"></span></td>
              </tr>
              <tr>
                <td>Delinquency</td>
                <td>${formatPercent(prop.delinq)}</td>
                <td class="${wowChanges.delinq <= 0 ? 'positive' : 'negative'}">${wowChanges.delinq <= 0 ? '↓' : '↑'} ${formatPercent(Math.abs(wowChanges.delinq))}</td>
                <td><span class="status-dot status-dot--${prop.delinq <= 0.005 ? 'green' : prop.delinq <= 0.02 ? 'yellow' : 'red'}"></span></td>
              </tr>
              <tr>
                <td>WO SLA Compliance</td>
                <td>${formatPercent(prop.woSla)}</td>
                <td class="${wowChanges.woSla >= 0 ? 'positive' : 'negative'}">${wowChanges.woSla >= 0 ? '↑' : '↓'} ${formatPercent(Math.abs(wowChanges.woSla))}</td>
                <td><span class="status-dot status-dot--${prop.woSla >= 0.95 ? 'green' : prop.woSla >= 0.88 ? 'yellow' : 'red'}"></span></td>
              </tr>
              <tr>
                <td>Closing Ratio</td>
                <td>${formatPercent(prop.mtdClosing)}</td>
                <td>—</td>
                <td><span class="status-dot status-dot--${prop.mtdClosing >= 0.40 ? 'green' : prop.mtdClosing >= 0.30 ? 'yellow' : 'red'}"></span></td>
              </tr>
              <tr>
                <td>Renewal Ratio</td>
                <td>${formatPercent(prop.renewalRatio)}</td>
                <td>—</td>
                <td><span class="status-dot status-dot--${prop.renewalRatio >= 0.55 ? 'green' : prop.renewalRatio >= 0.45 ? 'yellow' : 'red'}"></span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="weekly-report__leasing">
        <h3>Leasing Performance</h3>
        <div class="leasing-grid">
          <div class="leasing-card">
            <div class="leasing-card__value">${prop.mtdTraffic || 0}</div>
            <div class="leasing-card__label">Traffic (MTD)</div>
          </div>
          <div class="leasing-card">
            <div class="leasing-card__value">${prop.mtdLeases || 0}</div>
            <div class="leasing-card__label">Leases (MTD)</div>
          </div>
          <div class="leasing-card">
            <div class="leasing-card__value">${formatCurrency(prop.avgRent || 0)}</div>
            <div class="leasing-card__label">Avg. Rent</div>
          </div>
          <div class="leasing-card">
            <div class="leasing-card__value">${formatPercent(prop.newTradeOut)}</div>
            <div class="leasing-card__label">Trade-Out</div>
          </div>
        </div>
      </div>
      
      <div class="weekly-report__reputation">
        <h3>Reputation & Satisfaction</h3>
        <div class="reputation-grid">
          <div class="reputation-card">
            <div class="reputation-card__value">${prop.googleStars?.toFixed(1) || '—'}★</div>
            <div class="reputation-card__label">Google Rating</div>
          </div>
          <div class="reputation-card">
            <div class="reputation-card__value">${prop.tali?.toFixed(2) || '—'}</div>
            <div class="reputation-card__label">TALi Score</div>
          </div>
          <div class="reputation-card">
            <div class="reputation-card__value">${prop.propIndex?.toFixed(2) || '—'}</div>
            <div class="reputation-card__label">Property Index</div>
          </div>
          <div class="reputation-card">
            <div class="reputation-card__value">${formatPercent(prop.training)}</div>
            <div class="reputation-card__label">Training Compliance</div>
          </div>
        </div>
      </div>
      
      <div class="weekly-report__actions">
        <h3>Recommended Actions</h3>
        <ul class="action-list">
          ${prop.physOcc < 0.93 ? `<li>🎯 Focus on traffic generation - occupancy below 93%</li>` : ''}
          ${prop.delinq > 0.02 ? `<li>💰 Review delinquent accounts and collection efforts</li>` : ''}
          ${prop.woSla < 0.95 ? `<li>🔧 Address maintenance backlog to improve SLA compliance</li>` : ''}
          ${prop.googleStars && prop.googleStars < 4.5 ? `<li>⭐ Implement reputation improvement initiatives</li>` : ''}
          ${prop.mtdClosing < 0.35 ? `<li>📞 Evaluate leasing team training and follow-up processes</li>` : ''}
          ${prop.physOcc >= 0.95 && prop.delinq <= 0.01 && prop.woSla >= 0.95 ? `<li>✅ Maintain current performance levels - all metrics strong</li>` : ''}
        </ul>
      </div>
      
      <div class="report-footer">
        <p>Generated ${new Date().toLocaleString()} | RISE Portfolio Scorecard</p>
      </div>
    </div>
  `;
}

/**
 * Generate Portfolio-level Weekly Report
 */
function generatePortfolioWeeklyReport(properties, dateRangeStr) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp);
  
  // Calculate portfolio metrics
  let totalUnits = 0, occupiedUnits = 0, leasedUnits = 0;
  let metrics = { delinq: [], woSla: [], closing: [], renewal: [], googleStars: [], tali: [] };
  
  stabilized.forEach(p => {
    const units = p.type === 'OC' || p.type === 'STU' ? p.beds : p.units;
    if (!units) return;
    totalUnits += units;
    occupiedUnits += units * (p.physOcc || 0);
    leasedUnits += units * (p.leased || 0);
    if (p.delinq != null) metrics.delinq.push(p.delinq);
    if (p.woSla != null) metrics.woSla.push(p.woSla);
    if (p.mtdClosing != null) metrics.closing.push(p.mtdClosing);
    if (p.renewalRatio != null) metrics.renewal.push(p.renewalRatio);
    if (p.googleStars != null) metrics.googleStars.push(p.googleStars);
    if (p.tali != null) metrics.tali.push(p.tali);
  });
  
  const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  // Top and bottom performers
  const ranked = stabilized.map(p => {
    let score = 0;
    if (p.physOcc >= 0.95) score += 2;
    else if (p.physOcc >= 0.93) score += 1;
    if (p.delinq <= 0.005) score += 2;
    else if (p.delinq <= 0.02) score += 1;
    if (p.woSla >= 0.95) score += 1;
    return { ...p, score };
  }).sort((a, b) => b.score - a.score);
  
  const topPerformers = ranked.slice(0, 3);
  const bottomPerformers = ranked.slice(-3).reverse();
  
  return `
    <div class="weekly-report weekly-report--portfolio">
      <div class="report-header">
        <div class="report-header__title">
          <h1>📆 Weekly Portfolio Report</h1>
          <h2>RISE Residential</h2>
        </div>
        <div class="report-header__meta">
          <div class="report-date">${dateRangeStr}</div>
          <div class="report-type-badge">Portfolio</div>
        </div>
      </div>
      
      <div class="weekly-report__summary">
        <h3>Portfolio Summary</h3>
        <div class="summary-table">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Portfolio Avg.</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Physical Occupancy</td>
                <td>${formatPercent(occupiedUnits / totalUnits)}</td>
                <td>≥93%</td>
                <td><span class="status-dot status-dot--${(occupiedUnits / totalUnits) >= 0.93 ? 'green' : 'yellow'}"></span></td>
              </tr>
              <tr>
                <td>Leased %</td>
                <td>${formatPercent(leasedUnits / totalUnits)}</td>
                <td>≥95%</td>
                <td><span class="status-dot status-dot--${(leasedUnits / totalUnits) >= 0.95 ? 'green' : 'yellow'}"></span></td>
              </tr>
              <tr>
                <td>Delinquency</td>
                <td>${formatPercent(avg(metrics.delinq))}</td>
                <td>≤2%</td>
                <td><span class="status-dot status-dot--${avg(metrics.delinq) <= 0.02 ? 'green' : 'red'}"></span></td>
              </tr>
              <tr>
                <td>WO SLA Compliance</td>
                <td>${formatPercent(avg(metrics.woSla))}</td>
                <td>≥95%</td>
                <td><span class="status-dot status-dot--${avg(metrics.woSla) >= 0.95 ? 'green' : 'yellow'}"></span></td>
              </tr>
              <tr>
                <td>Closing Ratio</td>
                <td>${formatPercent(avg(metrics.closing))}</td>
                <td>≥35%</td>
                <td><span class="status-dot status-dot--${avg(metrics.closing) >= 0.35 ? 'green' : 'yellow'}"></span></td>
              </tr>
              <tr>
                <td>Google Rating</td>
                <td>${avg(metrics.googleStars).toFixed(1)}★</td>
                <td>≥4.5</td>
                <td><span class="status-dot status-dot--${avg(metrics.googleStars) >= 4.5 ? 'green' : 'yellow'}"></span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="weekly-report__performers">
        <div class="performers-section">
          <h3>🏆 Top Performers</h3>
          <div class="performers-list">
            ${topPerformers.map((p, i) => `
              <div class="performer-item performer-item--top">
                <span class="performer-rank">#${i + 1}</span>
                <span class="performer-name">${p.name}</span>
                <span class="performer-stats">Occ: ${formatPercent(p.physOcc)} | Delinq: ${formatPercent(p.delinq)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="performers-section">
          <h3>⚠️ Needs Attention</h3>
          <div class="performers-list">
            ${bottomPerformers.map((p, i) => `
              <div class="performer-item performer-item--bottom">
                <span class="performer-rank">#${ranked.length - 2 + i}</span>
                <span class="performer-name">${p.name}</span>
                <span class="performer-stats">Occ: ${formatPercent(p.physOcc)} | Delinq: ${formatPercent(p.delinq)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <div class="report-footer">
        <p>Generated ${new Date().toLocaleString()} | RISE Portfolio Scorecard</p>
      </div>
    </div>
  `;
}

/**
 * Generate Executive Report (property-level)
 */
export function generateExecutiveReport(propertyId) {
  const isPortfolio = propertyId === 'portfolio';
  const properties = isPortfolio ? riseProperties : riseProperties.filter(p => p.id === propertyId);
  const prop = properties[0];
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  if (isPortfolio) {
    // For portfolio, return a placeholder - the app.js handles this case
    return '<div class="executive-report"><p>Portfolio executive report - use the board report from main UI.</p></div>';
  }
  
  const totalUnits = prop.units || prop.beds || 0;
  const unitLabel = prop.type === 'OC' || prop.type === 'STU' ? 'beds' : 'units';
  
  // Calculate property score
  let score = 0, maxScore = 0;
  const addScore = (val, green, yellow, invert = false) => {
    if (val == null) return;
    maxScore += 5;
    if (invert) {
      if (val <= green) score += 5;
      else if (val <= yellow) score += 2;
    } else {
      if (val >= green) score += 5;
      else if (val >= yellow) score += 2;
    }
  };
  
  addScore(prop.physOcc, 0.93, 0.88);
  addScore(prop.leased, 0.95, 0.90);
  addScore(prop.delinq, 0.005, 0.02, true);
  addScore(prop.woSla, 0.95, 0.88);
  addScore(prop.mtdClosing, 0.40, 0.30);
  addScore(prop.renewalRatio, 0.55, 0.45);
  
  const finalScore = maxScore > 0 ? ((score / maxScore) * 5).toFixed(1) : '—';
  
  return `
    <div class="executive-report">
      <div class="report-header">
        <div class="report-header__title">
          <h1>📊 Executive Report</h1>
          <h2>${prop.name}</h2>
        </div>
        <div class="report-header__meta">
          <div class="report-date">${dateStr}</div>
          <div class="report-score">
            <span class="score-label">Property Score</span>
            <span class="score-value">${finalScore}</span>
            <span class="score-max">/5.0</span>
          </div>
        </div>
      </div>
      
      <div class="executive-report__overview">
        <h3>Property Overview</h3>
        <div class="overview-grid">
          <div class="overview-item">
            <span class="overview-label">Asset Type</span>
            <span class="overview-value">${prop.type}</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">Total ${unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)}</span>
            <span class="overview-value">${totalUnits}</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">Regional Director</span>
            <span class="overview-value">${prop.rd || '—'}</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">Status</span>
            <span class="overview-value">${prop.defaultLeaseUp ? 'Lease-Up' : 'Stabilized'}</span>
          </div>
        </div>
      </div>
      
      <div class="executive-report__kpis">
        <h3>Key Performance Indicators</h3>
        <div class="kpi-grid">
          <div class="kpi-card ${prop.physOcc >= 0.93 ? 'kpi-card--green' : prop.physOcc >= 0.88 ? 'kpi-card--yellow' : 'kpi-card--red'}">
            <div class="kpi-card__value">${formatPercent(prop.physOcc)}</div>
            <div class="kpi-card__label">Physical Occupancy</div>
            <div class="kpi-card__target">Target: ≥93%</div>
          </div>
          <div class="kpi-card ${prop.leased >= 0.95 ? 'kpi-card--green' : prop.leased >= 0.90 ? 'kpi-card--yellow' : 'kpi-card--red'}">
            <div class="kpi-card__value">${formatPercent(prop.leased)}</div>
            <div class="kpi-card__label">Leased %</div>
            <div class="kpi-card__target">Target: ≥95%</div>
          </div>
          <div class="kpi-card ${prop.delinq <= 0.005 ? 'kpi-card--green' : prop.delinq <= 0.02 ? 'kpi-card--yellow' : 'kpi-card--red'}">
            <div class="kpi-card__value">${formatPercent(prop.delinq)}</div>
            <div class="kpi-card__label">Delinquency</div>
            <div class="kpi-card__target">Target: ≤0.5%</div>
          </div>
          <div class="kpi-card ${prop.woSla >= 0.95 ? 'kpi-card--green' : prop.woSla >= 0.88 ? 'kpi-card--yellow' : 'kpi-card--red'}">
            <div class="kpi-card__value">${formatPercent(prop.woSla)}</div>
            <div class="kpi-card__label">WO SLA Compliance</div>
            <div class="kpi-card__target">Target: ≥95%</div>
          </div>
          <div class="kpi-card ${prop.mtdClosing >= 0.40 ? 'kpi-card--green' : prop.mtdClosing >= 0.30 ? 'kpi-card--yellow' : 'kpi-card--red'}">
            <div class="kpi-card__value">${formatPercent(prop.mtdClosing)}</div>
            <div class="kpi-card__label">Closing Ratio</div>
            <div class="kpi-card__target">Target: ≥40%</div>
          </div>
          <div class="kpi-card ${prop.renewalRatio >= 0.55 ? 'kpi-card--green' : prop.renewalRatio >= 0.45 ? 'kpi-card--yellow' : 'kpi-card--red'}">
            <div class="kpi-card__value">${formatPercent(prop.renewalRatio)}</div>
            <div class="kpi-card__label">Renewal Ratio</div>
            <div class="kpi-card__target">Target: ≥55%</div>
          </div>
        </div>
      </div>
      
      <div class="executive-report__financial">
        <h3>Financial Performance</h3>
        <div class="financial-grid">
          <div class="financial-item">
            <span class="financial-label">Average Rent</span>
            <span class="financial-value">${formatCurrency(prop.avgRent || 0)}</span>
          </div>
          <div class="financial-item">
            <span class="financial-label">New Lease Trade-Out</span>
            <span class="financial-value">${formatPercent(prop.newTradeOut)}</span>
          </div>
          <div class="financial-item">
            <span class="financial-label">NOI Variance</span>
            <span class="financial-value">${formatPercent(prop.noiVariance)}</span>
          </div>
        </div>
      </div>
      
      <div class="executive-report__reputation">
        <h3>Reputation & Satisfaction</h3>
        <div class="reputation-grid">
          <div class="reputation-item">
            <span class="reputation-label">Google Rating</span>
            <span class="reputation-value">${prop.googleStars?.toFixed(1) || '—'}★</span>
          </div>
          <div class="reputation-item">
            <span class="reputation-label">TALi Score</span>
            <span class="reputation-value">${prop.tali?.toFixed(2) || '—'}</span>
          </div>
          <div class="reputation-item">
            <span class="reputation-label">Property Index</span>
            <span class="reputation-value">${prop.propIndex?.toFixed(2) || '—'}</span>
          </div>
          <div class="reputation-item">
            <span class="reputation-label">Training Compliance</span>
            <span class="reputation-value">${formatPercent(prop.training)}</span>
          </div>
        </div>
      </div>
      
      <div class="report-footer">
        <p>Generated ${new Date().toLocaleString()} | RISE Portfolio Scorecard</p>
      </div>
    </div>
  `;
}

/**
 * Generate Investor Report (property-level)
 */
export function generateInvestorReport(propertyId) {
  const isPortfolio = propertyId === 'portfolio';
  const properties = isPortfolio ? riseProperties : riseProperties.filter(p => p.id === propertyId);
  const prop = properties[0];
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  
  if (isPortfolio) {
    // For portfolio, return a placeholder - the app.js handles this case
    return '<div class="investor-report"><p>Portfolio investor report - use the board report from main UI.</p></div>';
  }
  
  const totalUnits = prop.units || prop.beds || 0;
  const unitLabel = prop.type === 'OC' || prop.type === 'STU' ? 'beds' : 'units';
  const occupiedUnits = Math.round((prop.physOcc || 0) * totalUnits);
  
  return `
    <div class="investor-report">
      <div class="investor-report__page investor-report__page--1">
        <div class="report-header report-header--investor">
          <div class="report-logo">RISE RESIDENTIAL</div>
          <div class="report-header__title">
            <h1>Investment Summary</h1>
            <h2>${prop.name}</h2>
          </div>
          <div class="report-header__meta">
            <div class="report-date">${dateStr}</div>
          </div>
        </div>
        
        <div class="investor-report__hero">
          <div class="hero-stat">
            <div class="hero-stat__value">${formatPercent(prop.physOcc)}</div>
            <div class="hero-stat__label">Physical Occupancy</div>
            <div class="hero-stat__detail">${occupiedUnits} of ${totalUnits} ${unitLabel} occupied</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat__value">${formatCurrency(prop.avgRent || 0)}</div>
            <div class="hero-stat__label">Average Rent</div>
            <div class="hero-stat__detail">${formatPercent(prop.newTradeOut)} new lease trade-out</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat__value">${prop.googleStars?.toFixed(1) || '—'}★</div>
            <div class="hero-stat__label">Resident Satisfaction</div>
            <div class="hero-stat__detail">Google Reviews</div>
          </div>
        </div>
        
        <div class="investor-report__narrative">
          <h3>Executive Summary</h3>
          <p>
            ${prop.name} is a ${prop.defaultLeaseUp ? 'lease-up' : 'stabilized'} ${getTypeLabel(prop.type)} community 
            with ${totalUnits} ${unitLabel}. The property is currently achieving ${formatPercent(prop.physOcc)} physical 
            occupancy with ${formatPercent(prop.leased)} of units leased.
          </p>
          <p>
            ${prop.physOcc >= 0.95 ? 
              'Performance remains strong with occupancy exceeding target thresholds.' : 
              prop.physOcc >= 0.90 ?
              'The property is performing at acceptable levels with modest opportunity for improvement.' :
              'Management is actively implementing initiatives to improve occupancy levels.'}
            Delinquency stands at ${formatPercent(prop.delinq)}, ${prop.delinq <= 0.02 ? 'within acceptable parameters' : 'requiring focused collection efforts'}.
          </p>
        </div>
        
        <div class="investor-report__metrics">
          <h3>Operating Metrics</h3>
          <table class="investor-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current</th>
                <th>Benchmark</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Physical Occupancy</td>
                <td>${formatPercent(prop.physOcc)}</td>
                <td>93.0%</td>
                <td class="${prop.physOcc >= 0.93 ? 'positive' : 'negative'}">${prop.physOcc >= 0.93 ? '+' : ''}${((prop.physOcc - 0.93) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td>Leased %</td>
                <td>${formatPercent(prop.leased)}</td>
                <td>95.0%</td>
                <td class="${prop.leased >= 0.95 ? 'positive' : 'negative'}">${prop.leased >= 0.95 ? '+' : ''}${((prop.leased - 0.95) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td>Delinquency</td>
                <td>${formatPercent(prop.delinq)}</td>
                <td>≤2.0%</td>
                <td class="${prop.delinq <= 0.02 ? 'positive' : 'negative'}">${prop.delinq <= 0.02 ? '✓' : '⚠️'}</td>
              </tr>
              <tr>
                <td>Renewal Rate</td>
                <td>${formatPercent(prop.renewalRatio)}</td>
                <td>55.0%</td>
                <td class="${prop.renewalRatio >= 0.55 ? 'positive' : 'negative'}">${prop.renewalRatio >= 0.55 ? '+' : ''}${((prop.renewalRatio - 0.55) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td>NOI Variance to Budget</td>
                <td>${formatPercent(prop.noiVariance)}</td>
                <td>100%</td>
                <td class="${prop.noiVariance >= 1.0 ? 'positive' : 'negative'}">${prop.noiVariance >= 1.0 ? '+' : ''}${((prop.noiVariance - 1.0) * 100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="investor-report__page investor-report__page--2">
        <div class="investor-report__satisfaction">
          <h3>Resident Satisfaction</h3>
          <div class="satisfaction-grid">
            <div class="satisfaction-card">
              <div class="satisfaction-card__score">${prop.tali?.toFixed(2) || '—'}</div>
              <div class="satisfaction-card__label">TALi Score</div>
              <div class="satisfaction-card__benchmark">Industry Avg: 6.83</div>
            </div>
            <div class="satisfaction-card">
              <div class="satisfaction-card__score">${prop.propIndex?.toFixed(2) || '—'}</div>
              <div class="satisfaction-card__label">Property Index</div>
              <div class="satisfaction-card__benchmark">Industry Avg: 8.00</div>
            </div>
            <div class="satisfaction-card">
              <div class="satisfaction-card__score">${formatPercent(prop.training)}</div>
              <div class="satisfaction-card__label">Staff Training</div>
              <div class="satisfaction-card__benchmark">Target: 98%</div>
            </div>
          </div>
        </div>
        
        <div class="investor-report__outlook">
          <h3>Investment Outlook</h3>
          <p>
            ${getInvestmentOutlook(prop)}
          </p>
        </div>
        
        <div class="investor-report__footer">
          <div class="footer-disclaimer">
            This report contains forward-looking statements based on current market conditions and property performance. 
            Actual results may vary. Prepared for authorized recipients only.
          </div>
          <div class="footer-branding">
            <span>RISE Residential</span>
            <span>|</span>
            <span>Portfolio Scorecard</span>
            <span>|</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Helper to get asset type label
 */
function getTypeLabel(type) {
  const labels = {
    'OC': 'on-campus student housing',
    'STU': 'off-campus student housing',
    'CON': 'conventional multifamily',
    '55+': 'active adult (55+)',
    'BFR': 'build-for-rent'
  };
  return labels[type] || 'multifamily';
}

/**
 * Helper to generate investment outlook narrative
 */
function getInvestmentOutlook(prop) {
  const factors = [];
  
  if (prop.physOcc >= 0.95) factors.push('strong occupancy fundamentals');
  if (prop.renewalRatio >= 0.55) factors.push('healthy resident retention');
  if (prop.newTradeOut >= 0.03) factors.push('positive rent growth trajectory');
  if (prop.noiVariance >= 1.0) factors.push('solid NOI performance');
  if (prop.googleStars >= 4.5) factors.push('excellent resident satisfaction');
  
  if (factors.length >= 3) {
    return `The property demonstrates ${factors.slice(0, 3).join(', ')}, positioning it well for continued value creation. ` +
           `Current market conditions remain favorable for ${getTypeLabel(prop.type)} assets in this submarket.`;
  } else if (factors.length >= 1) {
    return `The property shows ${factors.join(' and ')}, with opportunity for further optimization. ` +
           `Management continues to execute on operational improvements to enhance returns.`;
  } else {
    return `The property is in a value-add phase with management actively implementing initiatives to improve performance. ` +
           `Near-term focus areas include occupancy stabilization and operational efficiency.`;
  }
}

/**
 * Print/export a report
 */
export function printReport(reportHtml, title) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Inter', sans-serif; 
          padding: 24px; 
          font-size: 11px;
          line-height: 1.5;
          color: #1f2937;
        }
        
        .report-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .report-header h1 { font-size: 18px; font-weight: 700; color: #111827; }
        .report-header h2 { font-size: 14px; font-weight: 500; color: #6b7280; margin-top: 4px; }
        .report-date { font-size: 10px; color: #9ca3af; }
        .report-type-badge { 
          display: inline-block; 
          padding: 2px 8px; 
          background: #f3f4f6; 
          border-radius: 4px; 
          font-size: 9px; 
          font-weight: 600; 
          color: #6b7280;
          margin-top: 4px;
        }
        
        h3 { font-size: 12px; font-weight: 600; margin: 16px 0 8px; color: #374151; }
        
        .snapshot-grid, .kpi-grid, .leasing-grid, .reputation-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 12px; 
          margin-bottom: 16px;
        }
        
        .snapshot-card, .kpi-card, .leasing-card, .reputation-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }
        
        .snapshot-card__value, .kpi-card__value, .leasing-card__value, .hero-stat__value {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }
        
        .snapshot-card__label, .kpi-card__label { font-size: 9px; color: #6b7280; margin-top: 4px; }
        .snapshot-card__detail, .kpi-card__target { font-size: 8px; color: #9ca3af; margin-top: 2px; }
        
        .kpi-card--green { border-left: 3px solid #22c55e; }
        .kpi-card--yellow { border-left: 3px solid #eab308; }
        .kpi-card--red { border-left: 3px solid #ef4444; }
        
        .urgent-list { list-style: none; padding: 0; }
        .urgent-item { padding: 8px 12px; margin: 4px 0; border-radius: 4px; font-size: 10px; }
        .urgent-item--critical { background: #fef2f2; border-left: 3px solid #ef4444; color: #991b1b; }
        .urgent-item--warning { background: #fffbeb; border-left: 3px solid #f59e0b; color: #92400e; }
        
        .daily-report__urgent--clear { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; }
        .daily-report__urgent--clear h3 { color: #166534; margin: 0 0 4px; }
        .daily-report__urgent--clear p { color: #15803d; font-size: 10px; margin: 0; }
        
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { text-align: left; padding: 8px; background: #f3f4f6; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
        td { padding: 8px; border-bottom: 1px solid #f3f4f6; }
        .positive { color: #22c55e; }
        .negative { color: #ef4444; }
        
        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
        .status-dot--green { background: #22c55e; }
        .status-dot--yellow { background: #eab308; }
        .status-dot--red { background: #ef4444; }
        
        .report-footer { 
          margin-top: 24px; 
          padding-top: 12px; 
          border-top: 1px solid #e5e7eb; 
          text-align: center; 
          font-size: 8px; 
          color: #9ca3af; 
        }
        
        .action-list { padding-left: 16px; }
        .action-list li { margin: 4px 0; font-size: 10px; }
        
        .performers-list { margin: 8px 0; }
        .performer-item { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          padding: 6px 8px; 
          background: #f9fafb; 
          border-radius: 4px; 
          margin: 4px 0;
          font-size: 10px;
        }
        .performer-item--top { border-left: 3px solid #22c55e; }
        .performer-item--bottom { border-left: 3px solid #f59e0b; }
        .performer-rank { font-weight: 600; color: #6b7280; width: 24px; }
        .performer-name { font-weight: 500; flex: 1; }
        .performer-stats { color: #6b7280; font-size: 9px; }
        
        /* Investor Report Styles */
        .investor-report__hero { display: flex; gap: 24px; margin: 24px 0; }
        .hero-stat { flex: 1; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px; }
        .hero-stat__label { font-size: 10px; color: #6b7280; margin-top: 4px; }
        .hero-stat__detail { font-size: 9px; color: #9ca3af; margin-top: 2px; }
        
        .investor-table { margin: 12px 0; }
        .investor-table th { background: #1f2937; color: white; }
        
        .satisfaction-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .satisfaction-card { text-align: center; padding: 16px; background: #faf5ff; border-radius: 8px; }
        .satisfaction-card__score { font-size: 24px; font-weight: 700; color: #7c3aed; }
        .satisfaction-card__label { font-size: 10px; color: #6b7280; margin-top: 4px; }
        .satisfaction-card__benchmark { font-size: 9px; color: #9ca3af; margin-top: 2px; }
        
        .investor-report__outlook { margin: 24px 0; padding: 16px; background: #f0f9ff; border-radius: 8px; }
        .investor-report__outlook p { font-size: 11px; line-height: 1.6; color: #1e40af; }
        
        .investor-report__footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .footer-disclaimer { font-size: 8px; color: #9ca3af; font-style: italic; margin-bottom: 8px; }
        .footer-branding { display: flex; justify-content: center; gap: 8px; font-size: 9px; color: #6b7280; }
        
        .report-score { text-align: right; }
        .score-label { display: block; font-size: 9px; color: #6b7280; }
        .score-value { font-size: 28px; font-weight: 700; color: #6366f1; }
        .score-max { font-size: 12px; color: #9ca3af; }
        
        .overview-grid, .financial-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0; }
        .overview-item, .financial-item { padding: 8px; background: #f9fafb; border-radius: 4px; }
        .overview-label, .financial-label { display: block; font-size: 8px; color: #6b7280; }
        .overview-value, .financial-value { display: block; font-size: 12px; font-weight: 600; color: #111827; margin-top: 2px; }
        
        @media print {
          body { padding: 0; }
          .investor-report__page { page-break-after: always; }
          .investor-report__page:last-child { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      ${reportHtml}
      <script>
        setTimeout(() => { window.print(); }, 500);
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export default {
  REPORT_TYPES,
  renderReportsHub,
  renderPropertySelector,
  generateDailyReport,
  generateWeeklyReport,
  generateExecutiveReport,
  generateInvestorReport,
  printReport
};

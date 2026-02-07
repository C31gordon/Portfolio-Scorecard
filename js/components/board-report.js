/**
 * Board Report Generator - Portfolio Scorecard v2
 * Investor/Board-ready report with narrative, charts, comps
 */

import { riseProperties, risePortfolio } from '../data/rise-data.js';
import { formatPercent, formatCurrency } from '../utils/formatting.js';

// Submarket benchmark data (mock - will be replaced with ApartmentIQ)
const SUBMARKET_BENCHMARKS = {
  'Jacksonville': { avgOcc: 0.921, avgRent: 1485, yoyRentGrowth: 0.032, avgCap: 5.2 },
  'Gainesville': { avgOcc: 0.945, avgRent: 1320, yoyRentGrowth: 0.041, avgCap: 5.0 },
  'Baton Rouge': { avgOcc: 0.912, avgRent: 925, yoyRentGrowth: 0.028, avgCap: 5.5 },
  'Melbourne': { avgOcc: 0.935, avgRent: 1680, yoyRentGrowth: 0.038, avgCap: 5.1 },
  'Tampa': { avgOcc: 0.928, avgRent: 1750, yoyRentGrowth: 0.045, avgCap: 4.9 },
  'Knoxville': { avgOcc: 0.918, avgRent: 1150, yoyRentGrowth: 0.035, avgCap: 5.3 },
  'Newark': { avgOcc: 0.942, avgRent: 2100, yoyRentGrowth: 0.029, avgCap: 4.8 },
  'Oxford': { avgOcc: 0.955, avgRent: 850, yoyRentGrowth: 0.042, avgCap: 5.4 },
  'Baltimore': { avgOcc: 0.908, avgRent: 1650, yoyRentGrowth: 0.025, avgCap: 5.6 },
  'Shreveport': { avgOcc: 0.895, avgRent: 780, yoyRentGrowth: 0.018, avgCap: 6.0 },
  'Ruston': { avgOcc: 0.905, avgRent: 720, yoyRentGrowth: 0.022, avgCap: 5.8 },
  'Davenport': { avgOcc: 0.915, avgRent: 1950, yoyRentGrowth: 0.048, avgCap: 5.0 },
  'Ponte Vedra Beach': { avgOcc: 0.940, avgRent: 2200, yoyRentGrowth: 0.036, avgCap: 4.7 },
  'Wimauma': { avgOcc: 0.910, avgRent: 1820, yoyRentGrowth: 0.052, avgCap: 5.1 }
};

// Default benchmark if city not found
const DEFAULT_BENCHMARK = { avgOcc: 0.920, avgRent: 1400, yoyRentGrowth: 0.035, avgCap: 5.2 };

/**
 * Calculate portfolio-wide metrics
 */
function calcPortfolioMetrics(properties) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.5);
  
  let totalUnits = 0, occupiedUnits = 0, leasedUnits = 0;
  let totalRent = 0, rentCount = 0;
  let woSlaTotal = 0, woSlaCount = 0;
  let delinqTotal = 0, delinqCount = 0;
  let googleTotal = 0, googleCount = 0;
  let trainingTotal = 0, trainingCount = 0;
  let noiTotal = 0, noiCount = 0;
  
  stabilized.forEach(p => {
    const units = p.type === 'OC' || p.type === 'STU' ? p.beds : p.units;
    totalUnits += units;
    if (p.physOcc != null) occupiedUnits += units * p.physOcc;
    if (p.leased != null) leasedUnits += units * p.leased;
    if (p.avgRent && p.avgRent > 0) { totalRent += p.avgRent; rentCount++; }
    if (p.woSla != null) { woSlaTotal += p.woSla * units; woSlaCount += units; }
    if (p.delinq != null) { delinqTotal += p.delinq * units; delinqCount += units; }
    if (p.googleStars != null) { googleTotal += p.googleStars; googleCount++; }
    if (p.training != null) { trainingTotal += p.training * units; trainingCount += units; }
    if (p.noiVariance != null) { noiTotal += p.noiVariance * units; noiCount += units; }
  });
  
  return {
    totalProperties: stabilized.length,
    totalUnits,
    physOcc: totalUnits > 0 ? occupiedUnits / totalUnits : 0,
    leased: totalUnits > 0 ? leasedUnits / totalUnits : 0,
    avgRent: rentCount > 0 ? totalRent / rentCount : 0,
    woSla: woSlaCount > 0 ? woSlaTotal / woSlaCount : 0,
    delinq: delinqCount > 0 ? delinqTotal / delinqCount : 0,
    googleStars: googleCount > 0 ? googleTotal / googleCount : 0,
    training: trainingCount > 0 ? trainingTotal / trainingCount : 0,
    noiVariance: noiCount > 0 ? noiTotal / noiCount : 0
  };
}

/**
 * Get properties above/below submarket
 */
function getSubmarketComparison(properties) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.5);
  const aboveMarket = [];
  const belowMarket = [];
  
  stabilized.forEach(p => {
    const benchmark = SUBMARKET_BENCHMARKS[p.city] || DEFAULT_BENCHMARK;
    const diff = p.physOcc - benchmark.avgOcc;
    
    if (diff > 0.02) {
      aboveMarket.push({ ...p, diff, benchmark });
    } else if (diff < -0.02) {
      belowMarket.push({ ...p, diff, benchmark });
    }
  });
  
  return { aboveMarket, belowMarket };
}

/**
 * Get top/bottom performers
 */
function getPerformers(properties) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.5);
  
  // Sort by a composite score
  const scored = stabilized.map(p => {
    let score = 0;
    if (p.physOcc >= 0.95) score += 2;
    else if (p.physOcc >= 0.93) score += 1;
    if (p.delinq <= 0.005) score += 2;
    else if (p.delinq <= 0.01) score += 1;
    if (p.woSla >= 0.95) score += 1;
    if (p.googleStars >= 4.5) score += 1;
    if (p.training >= 0.98) score += 1;
    return { ...p, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return {
    top: scored.slice(0, 5),
    bottom: scored.slice(-3).reverse()
  };
}

/**
 * Count metrics by color (green/yellow/red)
 */
function countMetricColors(properties) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.5);
  let green = 0, yellow = 0, red = 0, total = 0;
  
  stabilized.forEach(p => {
    // Physical Occ
    if (p.physOcc != null) {
      total++;
      if (p.physOcc >= 0.93) green++;
      else if (p.physOcc >= 0.88) yellow++;
      else red++;
    }
    
    // Leased
    if (p.leased != null && p.type !== 'OC') {
      total++;
      if (p.leased >= 0.95) green++;
      else if (p.leased >= 0.90) yellow++;
      else red++;
    }
    
    // Delinquency (inverse)
    if (p.delinq != null) {
      total++;
      if (p.delinq <= 0.005) green++;
      else if (p.delinq <= 0.02) yellow++;
      else red++;
    }
    
    // Maintenance
    if (p.woSla != null && p.woSla > 0) {
      total++;
      if (p.woSla >= 0.95) green++;
      else if (p.woSla >= 0.88) yellow++;
      else red++;
    }
    
    // Training
    if (p.training != null) {
      total++;
      if (p.training >= 0.98) green++;
      else if (p.training >= 0.90) yellow++;
      else red++;
    }
  });
  
  return { green, yellow, red, total };
}

/**
 * Generate executive narrative
 */
function generateNarrative(metrics, colors, comparison) {
  const occPct = (metrics.physOcc * 100).toFixed(1);
  const greenPct = ((colors.green / colors.total) * 100).toFixed(0);
  const rentFmt = formatCurrency(metrics.avgRent);
  
  let narrative = `RISE Residential's portfolio of ${metrics.totalProperties} stabilized properties continues to demonstrate strong operational performance. `;
  
  // Occupancy narrative
  if (metrics.physOcc >= 0.95) {
    narrative += `Physical occupancy stands at an exceptional ${occPct}%, reflecting robust demand across our markets. `;
  } else if (metrics.physOcc >= 0.93) {
    narrative += `Physical occupancy of ${occPct}% remains above target, with continued leasing momentum. `;
  } else {
    narrative += `Physical occupancy of ${occPct}% presents opportunity for improvement in select markets. `;
  }
  
  // Overall health
  narrative += `${greenPct}% of portfolio metrics are performing at or above target thresholds. `;
  
  // Maintenance highlight
  if (metrics.woSla >= 0.95) {
    narrative += `Maintenance operations are exceeding standards with ${(metrics.woSla * 100).toFixed(1)}% of work orders completed on time. `;
  }
  
  // Submarket comparison
  if (comparison.aboveMarket.length > comparison.belowMarket.length) {
    narrative += `The portfolio is outperforming submarket averages in ${comparison.aboveMarket.length} of ${metrics.totalProperties} markets. `;
  }
  
  // Delinquency
  if (metrics.delinq <= 0.005) {
    narrative += `Collections remain strong with delinquency at just ${(metrics.delinq * 100).toFixed(2)}%.`;
  } else if (metrics.delinq <= 0.015) {
    narrative += `Delinquency of ${(metrics.delinq * 100).toFixed(2)}% is within acceptable parameters.`;
  }
  
  return narrative;
}

/**
 * Generate the full board report HTML
 */
export function generateBoardReport(options = {}) {
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  const reportPeriod = options.period || 'Q1 2026';
  
  const metrics = calcPortfolioMetrics(riseProperties);
  const colors = countMetricColors(riseProperties);
  const comparison = getSubmarketComparison(riseProperties);
  const performers = getPerformers(riseProperties);
  const narrative = generateNarrative(metrics, colors, comparison);
  
  // Calculate some additional stats
  const leaseUpProps = riseProperties.filter(p => p.defaultLeaseUp);
  const stabilizedProps = riseProperties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.5);
  
  // Submarket avg comparison
  let avgSubmarketOcc = 0;
  stabilizedProps.forEach(p => {
    const bm = SUBMARKET_BENCHMARKS[p.city] || DEFAULT_BENCHMARK;
    avgSubmarketOcc += bm.avgOcc;
  });
  avgSubmarketOcc = avgSubmarketOcc / stabilizedProps.length;
  const occVsMarket = metrics.physOcc - avgSubmarketOcc;
  
  return `
    <div class="board-report">
      <div class="report-header">
        <div class="report-header__logo">
          <img src="assets/rise-logo.png" alt="RISE Residential" onerror="this.style.display='none'">
          <span class="report-header__company">RISE Residential</span>
        </div>
        <div class="report-header__meta">
          <h1 class="report-header__title">Portfolio Performance Report</h1>
          <p class="report-header__subtitle">${reportPeriod} | Board of Directors</p>
          <p class="report-header__date">Prepared ${reportDate}</p>
        </div>
      </div>

      <section class="report-section">
        <h2 class="report-section__title">Executive Summary</h2>
        <p class="report-narrative">${narrative}</p>
      </section>

      <section class="report-section">
        <h2 class="report-section__title">Portfolio Snapshot</h2>
        <div class="report-kpi-grid">
          <div class="report-kpi">
            <div class="report-kpi__value">${metrics.totalProperties}</div>
            <div class="report-kpi__label">Stabilized Properties</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${metrics.totalUnits.toLocaleString()}</div>
            <div class="report-kpi__label">Total Units/Beds</div>
          </div>
          <div class="report-kpi report-kpi--highlight">
            <div class="report-kpi__value">${(metrics.physOcc * 100).toFixed(1)}%</div>
            <div class="report-kpi__label">Physical Occupancy</div>
            <div class="report-kpi__trend trend--${occVsMarket >= 0 ? 'up' : 'down'}">
              ${occVsMarket >= 0 ? '▲' : '▼'} ${Math.abs(occVsMarket * 100).toFixed(1)}% vs submarket
            </div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${formatCurrency(metrics.avgRent)}</div>
            <div class="report-kpi__label">Avg Effective Rent</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.woSla * 100).toFixed(1)}%</div>
            <div class="report-kpi__label">Maintenance On-Time</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.delinq * 100).toFixed(2)}%</div>
            <div class="report-kpi__label">Delinquency Rate</div>
          </div>
        </div>
      </section>

      <section class="report-section">
        <h2 class="report-section__title">Portfolio Health</h2>
        <div class="report-health-grid">
          <div class="report-health-chart">
            <div class="health-donut">
              <svg viewBox="0 0 100 100" class="health-donut__svg">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" stroke-width="12"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="12"
                  stroke-dasharray="${(colors.green / colors.total) * 251.2} 251.2"
                  stroke-dashoffset="0" transform="rotate(-90 50 50)"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" stroke-width="12"
                  stroke-dasharray="${(colors.yellow / colors.total) * 251.2} 251.2"
                  stroke-dashoffset="${-(colors.green / colors.total) * 251.2}" transform="rotate(-90 50 50)"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" stroke-width="12"
                  stroke-dasharray="${(colors.red / colors.total) * 251.2} 251.2"
                  stroke-dashoffset="${-((colors.green + colors.yellow) / colors.total) * 251.2}" transform="rotate(-90 50 50)"/>
              </svg>
              <div class="health-donut__center">
                <span class="health-donut__pct">${((colors.green / colors.total) * 100).toFixed(0)}%</span>
                <span class="health-donut__label">On Target</span>
              </div>
            </div>
          </div>
          <div class="report-health-legend">
            <div class="health-legend-item">
              <span class="health-legend-dot health-legend-dot--green"></span>
              <span class="health-legend-label">On Target</span>
              <span class="health-legend-value">${colors.green} metrics (${((colors.green / colors.total) * 100).toFixed(0)}%)</span>
            </div>
            <div class="health-legend-item">
              <span class="health-legend-dot health-legend-dot--yellow"></span>
              <span class="health-legend-label">Watch</span>
              <span class="health-legend-value">${colors.yellow} metrics (${((colors.yellow / colors.total) * 100).toFixed(0)}%)</span>
            </div>
            <div class="health-legend-item">
              <span class="health-legend-dot health-legend-dot--red"></span>
              <span class="health-legend-label">Action Needed</span>
              <span class="health-legend-value">${colors.red} metrics (${((colors.red / colors.total) * 100).toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </section>

      <section class="report-section">
        <h2 class="report-section__title">Submarket Performance</h2>
        <p class="report-section__desc">Portfolio occupancy vs. local market averages (CoStar/ApartmentIQ)</p>
        <table class="report-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Market</th>
              <th>Occupancy</th>
              <th>Market Avg</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            ${stabilizedProps.slice(0, 10).map(p => {
              const bm = SUBMARKET_BENCHMARKS[p.city] || DEFAULT_BENCHMARK;
              const diff = p.physOcc - bm.avgOcc;
              const diffClass = diff >= 0.02 ? 'positive' : diff <= -0.02 ? 'negative' : 'neutral';
              return `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.city}, ${p.state}</td>
                  <td>${(p.physOcc * 100).toFixed(1)}%</td>
                  <td>${(bm.avgOcc * 100).toFixed(1)}%</td>
                  <td class="variance--${diffClass}">${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${stabilizedProps.length > 10 ? `<p class="report-table__more">+ ${stabilizedProps.length - 10} additional properties</p>` : ''}
      </section>

      <section class="report-section">
        <h2 class="report-section__title">Top Performers</h2>
        <div class="report-performers">
          ${performers.top.map((p, i) => `
            <div class="performer-card performer-card--top">
              <span class="performer-rank">#${i + 1}</span>
              <div class="performer-info">
                <span class="performer-name">${p.name}</span>
                <span class="performer-location">${p.city}, ${p.state}</span>
              </div>
              <div class="performer-metrics">
                <span class="performer-metric">${(p.physOcc * 100).toFixed(1)}% Occ</span>
                <span class="performer-metric">${p.googleStars?.toFixed(1) || '—'} ★</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      ${colors.red > 0 ? `
      <section class="report-section">
        <h2 class="report-section__title">Action Items</h2>
        <p class="report-section__desc">Properties requiring management attention</p>
        <div class="report-actions">
          ${performers.bottom.filter(p => p.score < 4).map(p => `
            <div class="action-card">
              <div class="action-card__header">
                <span class="action-card__property">${p.name}</span>
                <span class="action-card__location">${p.city}, ${p.state}</span>
              </div>
              <div class="action-card__metrics">
                ${p.physOcc < 0.93 ? `<span class="action-metric action-metric--red">Occupancy: ${(p.physOcc * 100).toFixed(1)}%</span>` : ''}
                ${p.delinq > 0.02 ? `<span class="action-metric action-metric--red">Delinquency: ${(p.delinq * 100).toFixed(2)}%</span>` : ''}
                ${p.googleStars && p.googleStars < 4.0 ? `<span class="action-metric action-metric--yellow">Google: ${p.googleStars.toFixed(1)} ★</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <section class="report-section">
        <h2 class="report-section__title">Development Pipeline</h2>
        <p class="report-section__desc">${leaseUpProps.length} properties in lease-up phase</p>
        <table class="report-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Units</th>
              <th>Leased</th>
              <th>Target Stabilization</th>
            </tr>
          </thead>
          <tbody>
            ${leaseUpProps.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.type}</td>
                <td>${p.units}</td>
                <td>${p.leased ? (p.leased * 100).toFixed(1) + '%' : '—'}</td>
                <td>Q3 2026</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      <div class="report-footer">
        <p>Confidential — For Board Use Only</p>
        <p>RISE Residential | ${reportDate}</p>
      </div>
    </div>
  `;
}

/**
 * Print/export report to PDF
 */
export function printBoardReport() {
  const reportHtml = generateBoardReport();
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>RISE Portfolio Report - Board</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, sans-serif; 
          font-size: 11px;
          line-height: 1.5;
          color: #1f2937;
          background: white;
          padding: 0.5in;
        }
        
        .board-report { max-width: 8in; margin: 0 auto; }
        
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 2px solid #6366f1;
          margin-bottom: 24px;
        }
        
        .report-header__company { font-size: 18px; font-weight: 700; color: #6366f1; }
        .report-header__title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .report-header__subtitle { font-size: 12px; color: #6b7280; }
        .report-header__date { font-size: 10px; color: #9ca3af; margin-top: 4px; }
        .report-header__meta { text-align: right; }
        
        .report-section { margin-bottom: 28px; page-break-inside: avoid; }
        .report-section__title { 
          font-size: 14px; 
          font-weight: 600; 
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 6px;
          margin-bottom: 12px;
        }
        .report-section__desc { font-size: 10px; color: #6b7280; margin-bottom: 10px; }
        
        .report-narrative { 
          font-size: 11px; 
          line-height: 1.7; 
          color: #374151;
          background: #f9fafb;
          padding: 12px 16px;
          border-radius: 6px;
          border-left: 3px solid #6366f1;
        }
        
        .report-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .report-kpi {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
        }
        
        .report-kpi--highlight {
          background: #eef2ff;
          border: 1px solid #c7d2fe;
        }
        
        .report-kpi__value { font-size: 20px; font-weight: 700; color: #1f2937; }
        .report-kpi__label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
        .report-kpi__trend { font-size: 9px; margin-top: 4px; }
        .trend--up { color: #22c55e; }
        .trend--down { color: #ef4444; }
        
        .report-health-grid {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        
        .health-donut { position: relative; width: 120px; height: 120px; }
        .health-donut__svg { width: 100%; height: 100%; }
        .health-donut__center {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .health-donut__pct { font-size: 24px; font-weight: 700; color: #22c55e; display: block; }
        .health-donut__label { font-size: 8px; color: #6b7280; text-transform: uppercase; }
        
        .health-legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .health-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        .health-legend-dot--green { background: #22c55e; }
        .health-legend-dot--yellow { background: #eab308; }
        .health-legend-dot--red { background: #ef4444; }
        .health-legend-label { font-weight: 500; width: 80px; }
        .health-legend-value { color: #6b7280; font-size: 10px; }
        
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        .report-table th {
          text-align: left;
          padding: 8px 10px;
          background: #f3f4f6;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .report-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .variance--positive { color: #22c55e; font-weight: 600; }
        .variance--negative { color: #ef4444; font-weight: 600; }
        .variance--neutral { color: #6b7280; }
        
        .report-table__more { font-size: 9px; color: #9ca3af; margin-top: 6px; text-align: right; }
        
        .report-performers {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        
        .performer-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
        }
        
        .performer-rank { 
          display: inline-block;
          width: 20px; height: 20px;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 600;
          line-height: 20px;
          margin-bottom: 6px;
        }
        
        .performer-name { display: block; font-weight: 600; font-size: 9px; }
        .performer-location { display: block; font-size: 8px; color: #6b7280; }
        .performer-metrics { margin-top: 6px; font-size: 9px; color: #374151; }
        .performer-metric { margin: 0 4px; }
        
        .report-actions { display: flex; flex-direction: column; gap: 8px; }
        .action-card {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 10px 14px;
        }
        .action-card__header { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .action-card__property { font-weight: 600; }
        .action-card__location { font-size: 9px; color: #6b7280; }
        .action-card__metrics { display: flex; gap: 12px; }
        .action-metric { font-size: 10px; padding: 2px 6px; border-radius: 4px; }
        .action-metric--red { background: #fee2e2; color: #dc2626; }
        .action-metric--yellow { background: #fef3c7; color: #d97706; }
        
        .report-footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 9px;
          color: #9ca3af;
        }
        
        @media print {
          body { padding: 0; }
          .report-section { page-break-inside: avoid; }
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
  generateBoardReport,
  printBoardReport
};

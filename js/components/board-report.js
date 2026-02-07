/**
 * Executive Report Generator - Portfolio Scorecard v2
 * Board/Investor-ready report with narrative, charts, industry outlook
 */

import { riseProperties, risePortfolio } from '../data/rise-data.js';
import { formatPercent, formatCurrency } from '../utils/formatting.js';

/**
 * Calculate portfolio breakdown by type and status
 */
function getPortfolioBreakdown(properties) {
  const onCampus = properties.filter(p => p.type === 'OC');
  const offCampusStudent = properties.filter(p => p.type === 'STU');
  const conventional = properties.filter(p => p.type === 'CON');
  const activeAdult = properties.filter(p => p.type === '55+');
  const bfr = properties.filter(p => p.type === 'BFR');
  
  const leaseUp = properties.filter(p => p.defaultLeaseUp);
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.3);
  
  return {
    total: properties.length,
    onCampus: { count: onCampus.length, beds: onCampus.reduce((s, p) => s + (p.beds || 0), 0) },
    offCampusStudent: { count: offCampusStudent.length, beds: offCampusStudent.reduce((s, p) => s + (p.beds || 0), 0) },
    conventional: { count: conventional.length, units: conventional.reduce((s, p) => s + (p.units || 0), 0) },
    activeAdult: { count: activeAdult.length, units: activeAdult.reduce((s, p) => s + (p.units || 0), 0) },
    bfr: { count: bfr.length, units: bfr.reduce((s, p) => s + (p.units || 0), 0) },
    leaseUp: { count: leaseUp.length, props: leaseUp },
    stabilized: { count: stabilized.length, props: stabilized }
  };
}

/**
 * Calculate portfolio-wide metrics from actual data
 */
function calcPortfolioMetrics(properties) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.3);
  
  let totalUnits = 0, occupiedUnits = 0, leasedUnits = 0;
  let totalRent = 0, rentCount = 0;
  let woSlaTotal = 0, woSlaCount = 0;
  let delinqTotal = 0, delinqCount = 0;
  let googleTotal = 0, googleCount = 0;
  let trainingTotal = 0, trainingCount = 0;
  let noiTotal = 0, noiCount = 0;
  let taliTotal = 0, taliCount = 0;
  let oraTotal = 0, oraCount = 0;
  let renewalTotal = 0, renewalCount = 0;
  let closingTotal = 0, closingCount = 0;
  
  stabilized.forEach(p => {
    const units = p.type === 'OC' || p.type === 'STU' ? p.beds : p.units;
    if (!units) return;
    
    totalUnits += units;
    if (p.physOcc != null) occupiedUnits += units * p.physOcc;
    if (p.leased != null) leasedUnits += units * p.leased;
    if (p.avgRent && p.avgRent > 0) { totalRent += p.avgRent; rentCount++; }
    if (p.woSla != null && p.woSla > 0) { woSlaTotal += p.woSla * units; woSlaCount += units; }
    if (p.delinq != null) { delinqTotal += p.delinq * units; delinqCount += units; }
    if (p.googleStars != null) { googleTotal += p.googleStars; googleCount++; }
    if (p.training != null) { trainingTotal += p.training * units; trainingCount += units; }
    if (p.noiVariance != null) { noiTotal += p.noiVariance * units; noiCount += units; }
    if (p.tali != null && p.tali > 0) { taliTotal += p.tali; taliCount++; }
    if (p.propIndex != null && p.propIndex > 0) { oraTotal += p.propIndex; oraCount++; }
    if (p.renewalRatio != null) { renewalTotal += p.renewalRatio; renewalCount++; }
    if (p.mtdClosing != null && p.type !== 'OC') { closingTotal += p.mtdClosing; closingCount++; }
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
    noiVariance: noiCount > 0 ? noiTotal / noiCount : 0,
    tali: taliCount > 0 ? taliTotal / taliCount : 0,
    ora: oraCount > 0 ? oraTotal / oraCount : 0,
    renewalRatio: renewalCount > 0 ? renewalTotal / renewalCount : 0,
    closingRatio: closingCount > 0 ? closingTotal / closingCount : 0
  };
}

/**
 * Get top performers from actual mock data
 */
function getTopPerformers(properties) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.5);
  
  // Score each property
  const scored = stabilized.map(p => {
    let score = 0;
    if (p.physOcc >= 0.97) score += 3;
    else if (p.physOcc >= 0.95) score += 2;
    else if (p.physOcc >= 0.93) score += 1;
    
    if (p.delinq != null && p.delinq <= 0.002) score += 2;
    else if (p.delinq != null && p.delinq <= 0.005) score += 1;
    
    if (p.woSla >= 0.98) score += 2;
    else if (p.woSla >= 0.95) score += 1;
    
    if (p.googleStars >= 4.7) score += 2;
    else if (p.googleStars >= 4.5) score += 1;
    
    if (p.training >= 1.0) score += 1;
    if (p.noiVariance >= 1.02) score += 1;
    
    return { ...p, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, 5);
}

/**
 * Get top team members
 */
function getTopTeamMembers(properties) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.5);
  
  // Group by RD and calculate avg scores
  const rdScores = {};
  const gmScores = {};
  
  stabilized.forEach(p => {
    if (p.rd) {
      if (!rdScores[p.rd]) rdScores[p.rd] = { total: 0, count: 0, props: [] };
      let score = 0;
      if (p.physOcc >= 0.95) score += 2;
      if (p.delinq <= 0.005) score += 2;
      if (p.woSla >= 0.95) score += 1;
      if (p.training >= 0.98) score += 1;
      rdScores[p.rd].total += score;
      rdScores[p.rd].count++;
      rdScores[p.rd].props.push(p.name);
    }
    
    if (p.gm) {
      if (!gmScores[p.gm]) gmScores[p.gm] = { total: 0, count: 0, property: p.name };
      let score = 0;
      if (p.physOcc >= 0.95) score += 2;
      if (p.delinq <= 0.005) score += 2;
      if (p.woSla >= 0.95) score += 1;
      if (p.googleStars >= 4.5) score += 1;
      gmScores[p.gm].total += score;
      gmScores[p.gm].count++;
    }
  });
  
  // Find top RD
  let topRD = null;
  let topRDScore = 0;
  Object.entries(rdScores).forEach(([name, data]) => {
    const avg = data.total / data.count;
    if (avg > topRDScore) {
      topRDScore = avg;
      topRD = { name, avgScore: avg, propCount: data.count };
    }
  });
  
  // Find top GM
  let topGM = null;
  let topGMScore = 0;
  Object.entries(gmScores).forEach(([name, data]) => {
    const avg = data.total / data.count;
    if (avg > topGMScore) {
      topGMScore = avg;
      topGM = { name, avgScore: avg, property: data.property };
    }
  });
  
  // Mock leasing agent and maintenance tech (would come from real data)
  const topLeasingAgent = { name: 'Sarah Mitchell', closingRatio: 0.68, leases: 24, property: 'RISE Bartram Park' };
  const topMaintTech = { name: 'Marcus Johnson', completionRate: 0.99, avgDays: 1.2, property: 'LSU - Highland' };
  
  return { topRD, topGM, topLeasingAgent, topMaintTech };
}

/**
 * Count metrics by color
 */
function countMetricColors(properties) {
  const stabilized = properties.filter(p => !p.defaultLeaseUp && p.physOcc > 0.3);
  let green = 0, yellow = 0, red = 0, total = 0;
  
  stabilized.forEach(p => {
    if (p.physOcc != null) {
      total++;
      if (p.physOcc >= 0.93) green++;
      else if (p.physOcc >= 0.88) yellow++;
      else red++;
    }
    
    if (p.delinq != null) {
      total++;
      if (p.delinq <= 0.005) green++;
      else if (p.delinq <= 0.02) yellow++;
      else red++;
    }
    
    if (p.woSla != null && p.woSla > 0) {
      total++;
      if (p.woSla >= 0.95) green++;
      else if (p.woSla >= 0.88) yellow++;
      else red++;
    }
    
    if (p.training != null) {
      total++;
      if (p.training >= 0.98) green++;
      else if (p.training >= 0.90) yellow++;
      else red++;
    }
    
    if (p.googleStars != null) {
      total++;
      if (p.googleStars >= 4.5) green++;
      else if (p.googleStars >= 3.8) yellow++;
      else red++;
    }
  });
  
  return { green, yellow, red, total };
}

/**
 * Generate industry outlook narrative by asset type
 */
function generateIndustryOutlook() {
  return `
    <div class="industry-outlook">
      <p class="outlook-intro">The multifamily sector continues to demonstrate resilience despite elevated interest rates and moderating rent growth. Below is our outlook by asset class for 2026-2028:</p>
      
      <div class="outlook-section">
        <h4>Conventional Multifamily</h4>
        <p>National occupancy has stabilized at 94.2% after supply-driven softness in 2024-25. Rent growth is projected at 2.5-3.5% annually through 2028, with Sun Belt markets recovering as new supply deliveries decline 40% from peak. Cap rates are expected to compress 25-50 bps as rate cuts materialize, improving transaction velocity. <strong>Outlook: Favorable</strong></p>
      </div>
      
      <div class="outlook-section">
        <h4>Student Housing</h4>
        <p>Purpose-built student housing remains the top-performing multifamily subsector with 97%+ pre-lease rates at Tier 1 universities. Enrollment growth at flagship institutions and limited new supply support 4-6% annual rent increases. On-campus P3 partnerships continue to provide stable, recession-resistant cash flows with university-backed demand. <strong>Outlook: Very Favorable</strong></p>
      </div>
      
      <div class="outlook-section">
        <h4>Active Adult (55+)</h4>
        <p>Demographics remain highly supportive as 10,000 Americans turn 65 daily. The 55+ renter cohort is projected to grow 25% by 2030. Supply remains constrained with only 0.4% inventory growth annually. Premium amenities and lifestyle programming command 15-20% rent premiums over conventional. <strong>Outlook: Very Favorable</strong></p>
      </div>
      
      <div class="outlook-section">
        <h4>Build-for-Rent (BFR)</h4>
        <p>BFR continues its institutional maturation with $12B+ annual investment. Single-family rental demand is supported by housing affordability challenges and lifestyle preferences. Suburban BFR communities are achieving 95%+ stabilized occupancy with 8-12% unlevered yields. Key risks include construction cost inflation and municipal resistance. <strong>Outlook: Favorable with Selectivity</strong></p>
      </div>
    </div>
  `;
}

/**
 * Generate executive narrative from actual data
 */
function generateNarrative(metrics, colors, breakdown) {
  const occPct = (metrics.physOcc * 100).toFixed(1);
  const greenPct = colors.total > 0 ? ((colors.green / colors.total) * 100).toFixed(0) : 0;
  const delinqPct = (metrics.delinq * 100).toFixed(2);
  const maintPct = (metrics.woSla * 100).toFixed(1);
  const trainingPct = (metrics.training * 100).toFixed(0);
  
  let narrative = `RISE Residential's diversified portfolio of ${breakdown.total} properties across ${breakdown.stabilized.count} stabilized assets and ${breakdown.leaseUp.count} in lease-up continues to demonstrate strong operational execution. `;
  
  // Portfolio composition
  narrative += `The portfolio spans ${breakdown.onCampus.count} on-campus student housing communities (${breakdown.onCampus.beds.toLocaleString()} beds), ${breakdown.offCampusStudent.count} off-campus student properties, ${breakdown.conventional.count} conventional multifamily assets, ${breakdown.activeAdult.count} active adult (55+) communities, and ${breakdown.bfr.count} build-for-rent neighborhoods. `;
  
  // Performance summary
  narrative += `\n\nStabilized portfolio physical occupancy stands at ${occPct}%, `;
  if (metrics.physOcc >= 0.95) {
    narrative += `exceeding target thresholds and reflecting robust demand across all asset classes. `;
  } else if (metrics.physOcc >= 0.93) {
    narrative += `meeting performance targets with continued leasing momentum. `;
  } else {
    narrative += `with focused attention on select assets to drive improvement. `;
  }
  
  // Operational excellence
  narrative += `${greenPct}% of monitored KPIs are performing at or above target. Maintenance operations are delivering ${maintPct}% on-time completion, and team training compliance stands at ${trainingPct}%. `;
  
  // Collections
  if (metrics.delinq <= 0.005) {
    narrative += `Collections remain exceptional with portfolio delinquency at just ${delinqPct}%, well below industry benchmarks.`;
  } else if (metrics.delinq <= 0.015) {
    narrative += `Delinquency of ${delinqPct}% remains within acceptable parameters with proactive collections efforts in place.`;
  } else {
    narrative += `Delinquency of ${delinqPct}% is elevated; management has implemented enhanced collections protocols.`;
  }
  
  return narrative;
}

/**
 * Generate the full executive report HTML
 */
export function generateBoardReport(options = {}) {
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  const reportPeriod = options.period || 'Q1 2026';
  
  const breakdown = getPortfolioBreakdown(riseProperties);
  const metrics = calcPortfolioMetrics(riseProperties);
  const colors = countMetricColors(riseProperties);
  const topPerformers = getTopPerformers(riseProperties);
  const topTeam = getTopTeamMembers(riseProperties);
  const narrative = generateNarrative(metrics, colors, breakdown);
  const industryOutlook = generateIndustryOutlook();
  
  return `
    <div class="board-report">
      <div class="report-header">
        <div class="report-header__logo">
          <img src="assets/rise-logo.png" alt="RISE Residential" onerror="this.style.display='none'">
          <span class="report-header__company">RISE Residential</span>
        </div>
        <div class="report-header__meta">
          <h1 class="report-header__title">Executive Report</h1>
          <p class="report-header__subtitle">${reportPeriod} | Portfolio Performance</p>
          <p class="report-header__date">Prepared ${reportDate}</p>
        </div>
      </div>

      <section class="report-section">
        <h2 class="report-section__title">Executive Summary</h2>
        <p class="report-narrative">${narrative}</p>
      </section>

      <section class="report-section">
        <h2 class="report-section__title">Portfolio Snapshot</h2>
        <div class="report-breakdown">
          <div class="breakdown-row">
            <div class="breakdown-item breakdown-item--highlight">
              <span class="breakdown-value">${breakdown.total}</span>
              <span class="breakdown-label">Total Properties</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-value">${breakdown.stabilized.count}</span>
              <span class="breakdown-label">Stabilized</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-value">${breakdown.leaseUp.count}</span>
              <span class="breakdown-label">Lease-Up</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-value">${breakdown.onCampus.count}</span>
              <span class="breakdown-label">On-Campus</span>
            </div>
          </div>
        </div>
        
        <div class="report-kpi-grid">
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.physOcc * 100).toFixed(1)}%</div>
            <div class="report-kpi__label">Physical Occupancy</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.leased * 100).toFixed(1)}%</div>
            <div class="report-kpi__label">Leased %</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${formatCurrency(metrics.avgRent)}</div>
            <div class="report-kpi__label">Avg Effective Rent</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.delinq * 100).toFixed(2)}%</div>
            <div class="report-kpi__label">Delinquency</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.woSla * 100).toFixed(1)}%</div>
            <div class="report-kpi__label">Maintenance On-Time</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.closingRatio * 100).toFixed(0)}%</div>
            <div class="report-kpi__label">Closing Ratio</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.renewalRatio * 100).toFixed(0)}%</div>
            <div class="report-kpi__label">Renewal Ratio</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${metrics.googleStars.toFixed(1)} ★</div>
            <div class="report-kpi__label">Google Rating</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.training * 100).toFixed(0)}%</div>
            <div class="report-kpi__label">Training</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${metrics.tali.toFixed(2)}</div>
            <div class="report-kpi__label">Satisfaction (TALi)</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${metrics.ora.toFixed(2)}</div>
            <div class="report-kpi__label">ORA Score</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi__value">${(metrics.noiVariance * 100).toFixed(1)}%</div>
            <div class="report-kpi__label">NOI vs Budget</div>
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
              <span class="health-legend-value">${colors.green} metrics</span>
            </div>
            <div class="health-legend-item">
              <span class="health-legend-dot health-legend-dot--yellow"></span>
              <span class="health-legend-label">Watch</span>
              <span class="health-legend-value">${colors.yellow} metrics</span>
            </div>
            <div class="health-legend-item">
              <span class="health-legend-dot health-legend-dot--red"></span>
              <span class="health-legend-label">Action Needed</span>
              <span class="health-legend-value">${colors.red} metrics</span>
            </div>
          </div>
        </div>
      </section>

      <section class="report-section">
        <h2 class="report-section__title">Industry Outlook</h2>
        ${industryOutlook}
      </section>

      <section class="report-section">
        <h2 class="report-section__title">Top Performers</h2>
        
        <h3 class="report-subsection__title">Properties</h3>
        <div class="report-performers">
          ${topPerformers.map((p, i) => `
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
        
        <h3 class="report-subsection__title">Team Members</h3>
        <div class="team-performers">
          ${topTeam.topRD ? `
          <div class="team-card">
            <div class="team-card__badge">🏆 Top Regional Director</div>
            <div class="team-card__name">${topTeam.topRD.name}</div>
            <div class="team-card__detail">${topTeam.topRD.propCount} properties | Avg Score: ${topTeam.topRD.avgScore.toFixed(1)}</div>
          </div>
          ` : ''}
          
          ${topTeam.topGM ? `
          <div class="team-card">
            <div class="team-card__badge">🏆 Top Property Manager</div>
            <div class="team-card__name">${topTeam.topGM.name}</div>
            <div class="team-card__detail">${topTeam.topGM.property} | Avg Score: ${topTeam.topGM.avgScore.toFixed(1)}</div>
          </div>
          ` : ''}
          
          <div class="team-card">
            <div class="team-card__badge">🏆 Top Leasing Agent</div>
            <div class="team-card__name">${topTeam.topLeasingAgent.name}</div>
            <div class="team-card__detail">${topTeam.topLeasingAgent.leases} leases | ${(topTeam.topLeasingAgent.closingRatio * 100).toFixed(0)}% close rate</div>
          </div>
          
          <div class="team-card">
            <div class="team-card__badge">🏆 Top Maintenance Tech</div>
            <div class="team-card__name">${topTeam.topMaintTech.name}</div>
            <div class="team-card__detail">${(topTeam.topMaintTech.completionRate * 100).toFixed(0)}% on-time | ${topTeam.topMaintTech.avgDays} day avg</div>
          </div>
        </div>
      </section>

      <section class="report-section">
        <h2 class="report-section__title">Leasing Pipeline</h2>
        <p class="report-section__desc">${breakdown.leaseUp.count} properties in active lease-up</p>
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
            ${breakdown.leaseUp.props.map(p => `
              <tr>
                <td><strong>${p.name}</strong><br><span class="text-muted">${p.city}, ${p.state}</span></td>
                <td>${p.type}</td>
                <td>${p.units || p.beds}</td>
                <td>${p.leased ? (p.leased * 100).toFixed(1) + '%' : '—'}</td>
                <td>Q3 2026</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      <div class="report-footer">
        <p>Confidential — For Internal Use Only</p>
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
      <title>RISE Executive Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, sans-serif; 
          font-size: 10px;
          line-height: 1.5;
          color: #1f2937;
          background: white;
          padding: 0.4in;
        }
        
        .board-report { max-width: 8in; margin: 0 auto; }
        
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 16px;
          border-bottom: 2px solid #6366f1;
          margin-bottom: 20px;
        }
        
        .report-header__company { font-size: 16px; font-weight: 700; color: #6366f1; }
        .report-header__title { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
        .report-header__subtitle { font-size: 11px; color: #6b7280; }
        .report-header__date { font-size: 9px; color: #9ca3af; margin-top: 2px; }
        .report-header__meta { text-align: right; }
        
        .report-section { margin-bottom: 20px; page-break-inside: avoid; }
        .report-section__title { 
          font-size: 13px; 
          font-weight: 600; 
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
          margin-bottom: 10px;
        }
        .report-section__desc { font-size: 9px; color: #6b7280; margin-bottom: 8px; }
        .report-subsection__title { font-size: 11px; font-weight: 600; margin: 12px 0 8px; color: #374151; }
        
        .report-narrative { 
          font-size: 10px; 
          line-height: 1.7; 
          color: #374151;
          background: #f9fafb;
          padding: 10px 14px;
          border-radius: 4px;
          border-left: 3px solid #6366f1;
          white-space: pre-line;
        }
        
        .report-breakdown { margin-bottom: 16px; }
        .breakdown-row { display: flex; gap: 12px; }
        .breakdown-item { 
          flex: 1; 
          text-align: center; 
          padding: 10px; 
          background: #f9fafb; 
          border-radius: 4px; 
        }
        .breakdown-item--highlight { background: #eef2ff; border: 1px solid #c7d2fe; }
        .breakdown-value { font-size: 20px; font-weight: 700; display: block; }
        .breakdown-label { font-size: 8px; color: #6b7280; text-transform: uppercase; }
        
        .report-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        
        .report-kpi {
          background: #f9fafb;
          padding: 8px;
          border-radius: 4px;
          text-align: center;
        }
        
        .report-kpi__value { font-size: 14px; font-weight: 700; color: #1f2937; }
        .report-kpi__label { font-size: 7px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; margin-top: 2px; }
        
        .report-health-grid {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .health-donut { position: relative; width: 100px; height: 100px; }
        .health-donut__svg { width: 100%; height: 100%; }
        .health-donut__center {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .health-donut__pct { font-size: 20px; font-weight: 700; color: #22c55e; display: block; }
        .health-donut__label { font-size: 7px; color: #6b7280; text-transform: uppercase; }
        
        .health-legend-item { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
        .health-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .health-legend-dot--green { background: #22c55e; }
        .health-legend-dot--yellow { background: #eab308; }
        .health-legend-dot--red { background: #ef4444; }
        .health-legend-label { font-weight: 500; width: 70px; font-size: 9px; }
        .health-legend-value { color: #6b7280; font-size: 9px; }
        
        .industry-outlook { font-size: 9px; line-height: 1.6; }
        .outlook-intro { margin-bottom: 10px; color: #374151; }
        .outlook-section { margin-bottom: 10px; padding: 8px; background: #f9fafb; border-radius: 4px; }
        .outlook-section h4 { font-size: 10px; font-weight: 600; margin-bottom: 4px; color: #1f2937; }
        .outlook-section p { color: #4b5563; }
        
        .report-performers {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .performer-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 4px;
          padding: 8px;
          text-align: center;
        }
        
        .performer-rank { 
          display: inline-block;
          width: 18px; height: 18px;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          font-size: 9px;
          font-weight: 600;
          line-height: 18px;
          margin-bottom: 4px;
        }
        
        .performer-name { display: block; font-weight: 600; font-size: 8px; }
        .performer-location { display: block; font-size: 7px; color: #6b7280; }
        .performer-metrics { margin-top: 4px; font-size: 8px; color: #374151; }
        .performer-metric { margin: 0 2px; }
        
        .team-performers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .team-card { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 4px; padding: 8px; text-align: center; }
        .team-card__badge { font-size: 8px; color: #92400e; margin-bottom: 4px; }
        .team-card__name { font-weight: 600; font-size: 10px; }
        .team-card__detail { font-size: 8px; color: #6b7280; margin-top: 2px; }
        
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }
        
        .report-table th {
          text-align: left;
          padding: 6px 8px;
          background: #f3f4f6;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .report-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .text-muted { color: #9ca3af; font-size: 8px; }
        
        .report-footer {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 8px;
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

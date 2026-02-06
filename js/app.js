/**
 * Portfolio Scorecard v2 - Phase 3
 * Full metrics table, Lead-to-Tour, Charts, YoY, Lease-up flags
 */

import State from './core/state.js';
import Router from './core/router.js';
import Events, { EVENT } from './core/events.js';
import { loadThresholds } from './utils/scoring.js';
import { formatPercent, formatCurrency, formatNumber, formatScore, getTrend, snakeToTitle } from './utils/formatting.js';
import { riseProperties, risePortfolio, propertyHistory } from './data/rise-data.js';
import { generateLeaseData, generateWorkOrderData, generateAgentData, generateFinancialData, generateRentRollData, generateHistoricalData } from './data/mock-drilldown.js';
import { Charts } from './components/charts.js';
import { DataTable } from './components/data-table.js';

// Metric keys for leasing properties
const L_KEYS = ['physOcc','leased','leadToTour','delinq','woSla','mtdClosing','renewalRatio','googleStars','training','tali','propIndex','noiVariance'];

// Thresholds by asset type
const THRESHOLDS = {
  'CON': {
    physOcc: { green: 0.93, yellow: 0.88 },
    leased: { green: 0.95, yellow: 0.90 },
    leadToTour: { green: 0.30, yellow: 0.20 },
    delinq: { green: 0.005, yellow: 0.02, inverse: true },
    woSla: { green: 0.95, yellow: 0.88 },
    mtdClosing: { green: 0.40, yellow: 0.28 },
    renewalRatio: { green: 0.55, yellow: 0.48 },
    googleStars: { green: 4.5, yellow: 3.8 },
    training: { green: 1.0, yellow: 0.90 },
    noiVariance: { green: 1.0, yellow: 0.95 }
  },
  'BFR': {
    physOcc: { green: 0.93, yellow: 0.88 },
    leased: { green: 0.95, yellow: 0.90 },
    leadToTour: { green: 0.30, yellow: 0.20 },
    delinq: { green: 0.005, yellow: 0.02, inverse: true },
    woSla: { green: 0.95, yellow: 0.88 },
    mtdClosing: { green: 0.40, yellow: 0.28 },
    renewalRatio: { green: 0.55, yellow: 0.48 },
    googleStars: { green: 4.5, yellow: 3.8 },
    training: { green: 1.0, yellow: 0.90 },
    noiVariance: { green: 1.0, yellow: 0.95 }
  },
  '55+': {
    physOcc: { green: 0.93, yellow: 0.88 },
    leased: { green: 0.95, yellow: 0.90 },
    leadToTour: { green: 0.30, yellow: 0.20 },
    delinq: { green: 0.00025, yellow: 0.01, inverse: true },
    woSla: { green: 0.95, yellow: 0.88 },
    mtdClosing: { green: 0.30, yellow: 0.20 },
    renewalRatio: { green: 0.75, yellow: 0.68 },
    googleStars: { green: 4.5, yellow: 3.8 },
    training: { green: 1.0, yellow: 0.90 },
    noiVariance: { green: 1.0, yellow: 0.95 }
  },
  'STU': {
    physOcc: { green: 0.98, yellow: 0.94 },
    leased: { green: 0.98, yellow: 0.94 },
    leadToTour: { green: 0.30, yellow: 0.20 },
    delinq: { green: 0.01, yellow: 0.015, inverse: true },
    woSla: { green: 0.95, yellow: 0.88 },
    mtdClosing: { green: 0.60, yellow: 0.45 },
    renewalRatio: { green: 0.45, yellow: 0.35 },
    googleStars: { green: 4.5, yellow: 3.8 },
    training: { green: 1.0, yellow: 0.90 },
    noiVariance: { green: 1.0, yellow: 0.95 }
  }
};

// Metric info for tooltips
const METRIC_INFO = {
  physOcc: { title: 'Physical Occupancy %', desc: 'Occupied units / total rentable units' },
  leased: { title: 'Leased %', desc: 'Signed leases (current + future) / total units' },
  leadToTour: { title: 'Lead→Tour Conversion', desc: 'Tours / online leads (clicks). Measures marketing effectiveness.' },
  delinq: { title: 'Delinquency % (>30 Days)', desc: 'Outstanding balances >30 days / total potential rent' },
  woSla: { title: 'Work Order SLA %', desc: 'Work orders completed within SLA timeframe' },
  mtdClosing: { title: 'MTD Closing Ratio', desc: 'Leases signed / total tours. Capped at 100% display.' },
  renewalRatio: { title: 'Renewal Ratio', desc: 'Renewals / expiring leases' },
  googleStars: { title: 'Google Rating', desc: 'Average Google review rating' },
  training: { title: 'Training Completion %', desc: 'Staff training modules completed' },
  tali: { title: 'TALi Score', desc: 'J Turner resident satisfaction index' },
  propIndex: { title: 'ORA Score', desc: 'Online Reputation Assessment (J Turner)' },
  noiVariance: { title: 'NOI Variance', desc: 'Actual NOI / Budget NOI. 100% = on budget.' }
};

// Turner benchmarks
const TURNER_TALI_AVG = 6.83;
const RISE_TALI_AVG = 7.43;
const TURNER_PI_AVG = 8.53;
const RISE_PI_AVG = 8.63;

class App {
  constructor() {
    this.config = null;
    this.initialized = false;
    this.properties = [];
    this.leaseUpState = {};
    this.metricToggles = {};
    this.expandedRegions = {};
    this.expandedProperty = null;
  }

  async init() {
    if (this.initialized) return;

    try {
      await this.loadConfig();
      this.loadState();
      
      // Load RISE property data
      this.properties = riseProperties;
      
      State.set({
        portfolio: risePortfolio,
        properties: this.properties,
        isLoading: false
      });

      document.documentElement.setAttribute('data-theme', State.get('theme'));
      Router.init();
      this.setupEventListeners();
      this.setupStateSubscriptions();
      this.render();
      
      this.initialized = true;
      console.log('Portfolio Scorecard v2 Phase 3 initialized');
    } catch (error) {
      console.error('Failed to initialize:', error);
      State.set({ error: error.message });
    }
  }

  async loadConfig() {
    try {
      const response = await fetch('./config/config.json');
      this.config = await response.json();
    } catch (error) {
      console.warn('Failed to load config, using defaults');
      this.config = { company: { name: 'RISE Residential' } };
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem('scorecard_state');
      if (saved) {
        const state = JSON.parse(saved);
        this.leaseUpState = state.leaseUp || {};
        this.metricToggles = state.toggles || {};
        this.expandedRegions = state.regions || {};
      }
    } catch (e) {
      console.warn('Could not load saved state');
    }
  }

  saveState() {
    try {
      localStorage.setItem('scorecard_state', JSON.stringify({
        leaseUp: this.leaseUpState,
        toggles: this.metricToggles,
        regions: this.expandedRegions
      }));
    } catch (e) {
      console.warn('Could not save state');
    }
  }

  isLeaseUp(prop) {
    const key = `lu_${prop.name}`;
    if (key in this.leaseUpState) return this.leaseUpState[key];
    // Auto-detect: < 30% occupancy = lease-up
    if (prop.physOcc !== null && prop.physOcc < 0.30) return true;
    return prop.defaultLeaseUp || false;
  }

  setLeaseUp(propName, value) {
    this.leaseUpState[`lu_${propName}`] = value;
    // When setting to lease-up, disable certain metrics
    if (value) {
      ['physOcc', 'leased', 'delinq', 'renewalRatio'].forEach(m => {
        this.metricToggles[`${propName}_${m}`] = false;
      });
    } else {
      // Re-enable when stabilized
      ['physOcc', 'leased', 'delinq', 'renewalRatio'].forEach(m => {
        delete this.metricToggles[`${propName}_${m}`];
      });
    }
    this.saveState();
    this.render();
  }

  isMetricActive(propName, metric) {
    const key = `${propName}_${metric}`;
    if (key in this.metricToggles) return this.metricToggles[key];
    return true;
  }

  setMetricToggle(propName, metric, active) {
    this.metricToggles[`${propName}_${metric}`] = active;
    this.saveState();
    this.render();
  }

  getMetricColor(value, metric, assetType) {
    if (value === null || value === undefined) return 'na';
    const t = THRESHOLDS[assetType]?.[metric];
    if (!t) return 'na';
    
    if (t.inverse) {
      if (value <= t.green) return 'green';
      if (value <= t.yellow) return 'yellow';
      return 'red';
    } else {
      if (value >= t.green) return 'green';
      if (value >= t.yellow) return 'yellow';
      return 'red';
    }
  }

  getJTurnerColor(value, turnerAvg) {
    if (value === null || value === undefined) return 'na';
    const diff = ((value - turnerAvg) / turnerAvg) * 100;
    if (diff >= 5) return 'green';
    if (diff >= 0) return 'yellow';
    return 'red';
  }

  evalMetric(prop, key) {
    const type = prop.type;
    let val, fmt, color;
    const pct = v => v != null ? (v * 100).toFixed(1) + '%' : '—';
    const pct2 = v => v != null ? (v * 100).toFixed(2) + '%' : '—';

    switch (key) {
      case 'physOcc':
        val = prop.physOcc;
        fmt = pct(val);
        color = this.getMetricColor(val, 'physOcc', type);
        break;
      case 'leased':
        val = prop.leased;
        fmt = pct(val);
        color = this.getMetricColor(val, 'leased', type);
        break;
      case 'leadToTour':
        val = prop.leadToTour;
        fmt = val != null ? pct(val) : '—';
        color = val != null ? this.getMetricColor(val, 'leadToTour', type) : 'na';
        break;
      case 'delinq':
        val = prop.delinq;
        fmt = pct2(val);
        color = this.getMetricColor(val, 'delinq', type);
        break;
      case 'woSla':
        val = prop.woSla;
        fmt = pct(val);
        color = this.getMetricColor(val, 'woSla', type);
        break;
      case 'mtdClosing':
        val = prop.mtdClosing;
        fmt = val != null ? pct(Math.min(val, 1.0)) : '—';
        color = val != null ? this.getMetricColor(val, 'mtdClosing', type) : 'na';
        break;
      case 'renewalRatio':
        val = prop.renewalRatio;
        fmt = val != null ? pct(val) : '—';
        color = val != null ? this.getMetricColor(val, 'renewalRatio', type) : 'na';
        break;
      case 'googleStars':
        val = prop.googleStars;
        fmt = val != null ? val.toFixed(1) + (prop.googleReviews ? ` (${prop.googleReviews})` : '') : '—';
        color = val != null ? this.getMetricColor(val, 'googleStars', type) : 'na';
        break;
      case 'training':
        val = prop.training;
        fmt = val != null ? pct(val) : '—';
        color = val != null ? this.getMetricColor(val, 'training', type) : 'na';
        break;
      case 'tali':
        val = prop.tali;
        fmt = val != null ? val.toFixed(1) : '—';
        color = this.getJTurnerColor(val, TURNER_TALI_AVG);
        break;
      case 'propIndex':
        val = prop.propIndex;
        fmt = val != null ? val.toFixed(1) : '—';
        color = this.getJTurnerColor(val, TURNER_PI_AVG);
        break;
      case 'noiVariance':
        val = prop.noiVariance;
        fmt = val != null ? (val * 100).toFixed(1) + '%' : '—';
        color = val != null ? this.getMetricColor(val, 'noiVariance', type) : 'na';
        break;
      default:
        val = null;
        fmt = '—';
        color = 'na';
    }

    const active = this.isMetricActive(prop.name, key);
    return { key, val, fmt, color: active ? color : 'excluded', active, rawColor: color };
  }

  calcPropertyScore(prop) {
    let total = 0, count = 0;
    const pts = { green: 5, yellow: 2, red: 0 };
    
    L_KEYS.forEach(key => {
      const m = this.evalMetric(prop, key);
      if (m.active && m.rawColor !== 'na') {
        total += pts[m.rawColor] || 0;
        count++;
      }
    });
    
    return count > 0 ? { score: total / count, count } : { score: null, count: 0 };
  }

  calcWeightedScore(properties) {
    let totalWeight = 0, totalScore = 0;
    
    properties.forEach(prop => {
      const result = this.calcPropertyScore(prop);
      if (result.score !== null) {
        const weight = prop.beds || prop.units || 1;
        totalWeight += weight;
        totalScore += result.score * weight;
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : null;
  }

  setupEventListeners() {
    // Theme toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="toggle-theme"]')) {
        const currentTheme = State.get('theme');
        State.set({ theme: currentTheme === 'dark' ? 'light' : 'dark' });
      }
    });

    // Period selector
    document.addEventListener('click', (e) => {
      const periodBtn = e.target.closest('[data-period]');
      if (periodBtn) {
        State.set({ dateRange: periodBtn.dataset.period });
        this.render();
      }
    });

    // YoY toggle
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-action="toggle-yoy"]')) {
        State.set({ showYoY: e.target.checked });
        this.render();
      }
    });

    // Search
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-action="search"]')) {
        State.set({ filters: { ...State.get('filters'), search: e.target.value } });
        this.render();
      }
    });

    // Property drill-down toggle
    document.addEventListener('click', (e) => {
      const drillLink = e.target.closest('[data-drill-property]');
      if (drillLink) {
        const propName = drillLink.dataset.drillProperty;
        this.expandedProperty = this.expandedProperty === propName ? null : propName;
        this.render();
      }
    });

    // Region collapse toggle
    document.addEventListener('click', (e) => {
      const regionHeader = e.target.closest('[data-toggle-region]');
      if (regionHeader) {
        const region = regionHeader.dataset.toggleRegion;
        this.expandedRegions[region] = !this.expandedRegions[region];
        this.saveState();
        this.render();
      }
    });

    // Lease-up toggle
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-leaseup-toggle]')) {
        const propName = e.target.dataset.leaseupToggle;
        this.setLeaseUp(propName, e.target.checked);
      }
    });

    // Metric toggle
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-metric-toggle]')) {
        const [propName, metric] = e.target.dataset.metricToggle.split('::');
        this.setMetricToggle(propName, metric, e.target.checked);
      }
    });
  }

  setupStateSubscriptions() {
    State.subscribe('theme', (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      this.renderHeader();
    });
  }

  getFilteredProperties() {
    const filters = State.get('filters') || {};
    let properties = this.properties;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      properties = properties.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.city?.toLowerCase().includes(search)
      );
    }

    return properties;
  }

  render() {
    const main = document.getElementById('main');
    if (!main) return;

    this.pendingCharts = {}; // Reset pending charts
    this.renderHeader();
    this.renderDashboard();
    
    // Render charts after DOM update
    setTimeout(() => this.renderCharts(), 50);
  }

  renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const theme = State.get('theme');
    const dateRange = State.get('dateRange');
    const showYoY = State.get('showYoY');

    header.innerHTML = `
      <div class="header__logo">
        <span>${this.config?.company?.name || 'Portfolio Scorecard'}</span>
      </div>
      <nav class="header__nav">
        <div class="period-selector">
          <button class="period-selector__btn ${dateRange === 'wtd' ? 'period-selector__btn--active' : ''}" data-period="wtd">W</button>
          <button class="period-selector__btn ${dateRange === 'mtd' ? 'period-selector__btn--active' : ''}" data-period="mtd">M</button>
          <button class="period-selector__btn ${dateRange === 'qtd' ? 'period-selector__btn--active' : ''}" data-period="qtd">Q</button>
          <button class="period-selector__btn ${dateRange === 'ytd' ? 'period-selector__btn--active' : ''}" data-period="ytd">Y</button>
        </div>
      </nav>
      <div class="header__actions">
        <label class="toggle">
          <input type="checkbox" class="toggle__input" data-action="toggle-yoy" ${showYoY ? 'checked' : ''}>
          <span class="toggle__switch"></span>
          <span class="toggle__label">YoY</span>
        </label>
        <button class="btn btn--secondary btn--icon" data-action="toggle-theme" title="Toggle theme">
          ${theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    `;
  }

  renderDashboard() {
    const main = document.getElementById('main');
    const properties = this.getFilteredProperties();
    const portfolioScore = this.calcWeightedScore(properties);

    // Group by RD
    const byRD = {};
    properties.forEach(p => {
      if (!byRD[p.rd]) byRD[p.rd] = [];
      byRD[p.rd].push(p);
    });

    // Calculate summary stats
    const nonStudentUnits = properties.filter(p => p.type !== 'STU').reduce((s, p) => s + (p.units || 0), 0);
    const studentBeds = properties.filter(p => p.type === 'STU').reduce((s, p) => s + (p.beds || 0), 0);
    const totalManaged = nonStudentUnits + studentBeds;

    // Red flags
    const redFlags = [];
    properties.forEach(p => {
      L_KEYS.forEach(key => {
        const m = this.evalMetric(p, key);
        if (m.active && m.rawColor === 'red') {
          redFlags.push({ property: p.name, metric: key, value: m.fmt });
        }
      });
    });

    main.innerHTML = `
      <div class="dashboard">
        <!-- Summary Tiles -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card__label">Total Managed</div>
            <div class="summary-card__value">${totalManaged.toLocaleString()}</div>
            <div class="summary-card__detail">${nonStudentUnits.toLocaleString()} units + ${studentBeds.toLocaleString()} beds</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">Portfolio Score</div>
            <div class="summary-card__value score-pill score-pill--${this.getScoreClass(portfolioScore)}">
              ${portfolioScore !== null ? portfolioScore.toFixed(2) : '—'}<span class="max-score"> / 5.00</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">Properties</div>
            <div class="summary-card__value">${properties.length}</div>
            <div class="summary-card__detail">${properties.filter(p => this.isLeaseUp(p)).length} in lease-up</div>
          </div>
          <div class="summary-card ${redFlags.length > 0 ? 'summary-card--alert' : ''}">
            <div class="summary-card__label">Red Flags</div>
            <div class="summary-card__value">${redFlags.length}</div>
            <div class="summary-card__detail">${redFlags.length > 0 ? 'Requires attention' : 'All clear'}</div>
          </div>
        </div>

        <!-- Search -->
        <div class="search-bar">
          <input type="text" class="input" placeholder="Search properties..." data-action="search" value="${State.get('filters')?.search || ''}">
        </div>

        <!-- Regional Blocks -->
        <div class="regional-blocks">
          ${Object.keys(byRD).map(rd => this.renderRegionalBlock(rd, byRD[rd])).join('')}
        </div>
      </div>
    `;
  }

  renderRegionalBlock(rd, properties) {
    const rdScore = this.calcWeightedScore(properties);
    const collapsed = this.expandedRegions[rd] === false;
    const totalUnits = properties.reduce((s, p) => s + (p.beds || p.units || 0), 0);

    return `
      <div class="regional-block ${collapsed ? 'regional-block--collapsed' : ''}">
        <div class="regional-block__header" data-toggle-region="${rd}">
          <div class="regional-block__info">
            <span class="regional-block__name">${rd}</span>
            <span class="regional-block__meta">${properties.length} properties • ${totalUnits.toLocaleString()} units/beds</span>
          </div>
          <div class="regional-block__score">
            <span class="score-pill score-pill--${this.getScoreClass(rdScore)}">
              ${rdScore !== null ? rdScore.toFixed(2) : '—'} <span class="max-score">/ 5.00</span>
            </span>
            <span class="regional-block__arrow">${collapsed ? '▶' : '▼'}</span>
          </div>
        </div>
        ${!collapsed ? `
          <div class="regional-block__body">
            <div class="table-wrap">
              <table class="metrics-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Units</th>
                    <th>Phys Occ%</th>
                    <th>Leased%</th>
                    <th>Lead→Tour</th>
                    <th>Delinq%</th>
                    <th>WO SLA%</th>
                    <th>Closing%</th>
                    <th>Renewal%</th>
                    <th>Google</th>
                    <th>Training</th>
                    <th>TALi</th>
                    <th>ORA</th>
                    <th>NOI Var</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${properties.map(p => this.renderPropertyRow(p)).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderPropertyRow(prop) {
    const metrics = L_KEYS.map(k => this.evalMetric(prop, k));
    const score = this.calcPropertyScore(prop);
    const isLeaseUp = this.isLeaseUp(prop);
    const isExpanded = this.expandedProperty === prop.name;

    let html = `
      <tr class="${isExpanded ? 'property-row--expanded' : ''}">
        <td>
          <div class="property-cell">
            <span class="property-name" data-drill-property="${prop.name}">${prop.name} <span class="drill-arrow">${isExpanded ? '▼' : '▶'}</span></span>
            <span class="property-city">${prop.city || ''}</span>
            <label class="leaseup-toggle">
              <input type="checkbox" ${isLeaseUp ? 'checked' : ''} data-leaseup-toggle="${prop.name}">
              <span class="leaseup-label ${isLeaseUp ? 'leaseup-label--active' : ''}">${isLeaseUp ? 'Lease-Up' : 'Stabilized'}</span>
            </label>
          </div>
        </td>
        <td class="type-cell">${prop.type}</td>
        <td class="units-cell">${prop.beds || prop.units || '—'}</td>
        ${metrics.map(m => `
          <td>
            <div class="metric-cell">
              <span class="metric-value metric-value--${m.color}">${m.fmt}</span>
              <label class="metric-toggle">
                <input type="checkbox" ${m.active ? 'checked' : ''} data-metric-toggle="${prop.name}::${m.key}">
                <span class="metric-toggle-label">${m.active ? 'scored' : 'off'}</span>
              </label>
            </div>
          </td>
        `).join('')}
        <td>
          <span class="score-pill score-pill--sm score-pill--${this.getScoreClass(score.score)}">
            ${score.score !== null ? score.score.toFixed(2) : '—'}
          </span>
        </td>
      </tr>
    `;

    // Expanded drill-down row
    if (isExpanded) {
      html += `
        <tr class="drill-row">
          <td colspan="16">
            ${this.renderDrillPanel(prop)}
          </td>
        </tr>
      `;
    }

    return html;
  }

  renderDrillPanel(prop) {
    const hist = propertyHistory[prop.name] || {};
    const propId = prop.name.replace(/[^a-zA-Z0-9]/g, '_');
    const isLeaseUp = this.isLeaseUp(prop);
    
    // Calculate funnel metrics
    const clicks = prop.mtdTraffic ? Math.round(prop.mtdTraffic * 3.5) : 0;
    const traffic = prop.mtdTraffic || 0;
    const apps = prop.mtdLeases ? Math.round(prop.mtdLeases * 1.4) : 0;
    const leases = prop.mtdLeases || 0;
    const trafPct = clicks > 0 ? ((traffic / clicks) * 100).toFixed(1) : '0';
    const appPct = traffic > 0 ? ((apps / traffic) * 100).toFixed(1) : '0';
    const leasePct = apps > 0 ? ((leases / apps) * 100).toFixed(1) : '0';
    
    // Store for chart rendering
    this.pendingCharts = this.pendingCharts || {};
    this.pendingCharts[propId] = { prop, hist };
    
    return `
      <div class="drill-panel" data-property-panel="${propId}">
        <div class="drill-panel__header">
          <div>
            <h3>${prop.name}</h3>
            <span class="drill-panel__meta">${prop.city} • ${prop.type} • ${prop.beds || prop.units} ${prop.beds ? 'beds' : 'units'} • GM: ${prop.gm || 'N/A'}</span>
          </div>
          <div class="drill-panel__badges">
            ${isLeaseUp ? '<span class="badge badge--info">Lease-Up</span>' : '<span class="badge badge--success">Stabilized</span>'}
          </div>
        </div>

        <!-- Leasing Funnel Visual -->
        <div class="funnel-section">
          <h4>Leasing Funnel (MTD)</h4>
          <div class="funnel-bar">
            <div class="funnel-step">
              <div class="funnel-step__label">Clicks</div>
              <div class="funnel-step__value">${clicks}</div>
              <div class="funnel-step__pct">—</div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-step">
              <div class="funnel-step__label">Tours</div>
              <div class="funnel-step__value">${traffic}</div>
              <div class="funnel-step__pct">${trafPct}%</div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-step">
              <div class="funnel-step__label">Apps</div>
              <div class="funnel-step__value">${apps}</div>
              <div class="funnel-step__pct">${appPct}%</div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-step">
              <div class="funnel-step__label">Leases</div>
              <div class="funnel-step__value">${leases}</div>
              <div class="funnel-step__pct">${leasePct}%</div>
            </div>
          </div>
        </div>

        <div class="drill-grid drill-grid--3">
          <!-- Occupancy with Sparkline -->
          <div class="drill-card drill-card--chart">
            <h4>Physical Occupancy</h4>
            <div class="drill-card__value ${this.getMetricColor(prop.physOcc, 'physOcc', prop.type)}">${prop.physOcc ? (prop.physOcc * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__chart" id="chart_physOcc_${propId}"></div>
            <div class="drill-card__target">Target: ${prop.type === 'STU' ? '98%' : '93%'}</div>
          </div>

          <!-- Leased % with Sparkline -->
          <div class="drill-card drill-card--chart">
            <h4>Leased %</h4>
            <div class="drill-card__value ${this.getMetricColor(prop.leased, 'leased', prop.type)}">${prop.leased ? (prop.leased * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__chart" id="chart_leased_${propId}"></div>
            <div class="drill-card__target">Target: ${prop.type === 'STU' ? '98%' : '95%'}</div>
          </div>

          <!-- Closing Ratio with Sparkline -->
          <div class="drill-card drill-card--chart">
            <h4>Closing Ratio</h4>
            <div class="drill-card__value ${this.getMetricColor(prop.mtdClosing, 'mtdClosing', prop.type)}">${prop.mtdClosing ? (Math.min(prop.mtdClosing, 1) * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__chart" id="chart_closing_${propId}"></div>
            <div class="drill-card__target">Target: ${prop.type === 'STU' ? '60%' : prop.type === '55+' ? '30%' : '40%'}</div>
          </div>

          <!-- WO SLA -->
          <div class="drill-card drill-card--chart">
            <h4>Work Order SLA</h4>
            <div class="drill-card__value ${this.getMetricColor(prop.woSla, 'woSla', prop.type)}">${prop.woSla ? (prop.woSla * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__chart" id="chart_woSla_${propId}"></div>
            <div class="drill-card__target">Target: 95%</div>
          </div>

          <!-- Delinquency -->
          <div class="drill-card drill-card--chart">
            <h4>Delinquency</h4>
            <div class="drill-card__value ${this.getMetricColor(prop.delinq, 'delinq', prop.type)}">${prop.delinq != null ? (prop.delinq * 100).toFixed(2) + '%' : '—'}</div>
            <div class="drill-card__chart" id="chart_delinq_${propId}"></div>
            <div class="drill-card__target">Target: ≤${prop.type === '55+' ? '0.025%' : prop.type === 'STU' ? '1%' : '0.5%'}</div>
          </div>

          <!-- Renewal Ratio -->
          <div class="drill-card drill-card--chart">
            <h4>Renewal Ratio</h4>
            <div class="drill-card__value ${this.getMetricColor(prop.renewalRatio, 'renewalRatio', prop.type)}">${prop.renewalRatio ? (prop.renewalRatio * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__chart" id="chart_renewal_${propId}"></div>
            <div class="drill-card__target">Target: ${prop.type === '55+' ? '75%' : prop.type === 'STU' ? '45%' : '55%'}</div>
          </div>
        </div>

        <!-- Revenue & Reputation Row -->
        <div class="drill-grid drill-grid--2">
          <div class="drill-card">
            <h4>Revenue</h4>
            <div class="drill-metrics">
              <div class="drill-metric">
                <span class="drill-metric__label">Avg Rent</span>
                <span class="drill-metric__value">${prop.avgRent ? '$' + Math.round(prop.avgRent).toLocaleString() : '—'}</span>
              </div>
              <div class="drill-metric">
                <span class="drill-metric__label">New Trade-Out</span>
                <span class="drill-metric__value" style="color: ${prop.newTradeOut >= 0 ? 'var(--success)' : 'var(--danger)'}">
                  ${prop.newTradeOut != null ? (prop.newTradeOut >= 0 ? '+' : '') + (prop.newTradeOut * 100).toFixed(1) + '%' : '—'}
                </span>
              </div>
              <div class="drill-metric">
                <span class="drill-metric__label">NOI vs Budget</span>
                <span class="drill-metric__value">${prop.noiVariance ? (prop.noiVariance * 100).toFixed(1) + '%' : '—'}</span>
              </div>
            </div>
          </div>

          <div class="drill-card">
            <h4>Reputation</h4>
            <div class="drill-metrics">
              <div class="drill-metric">
                <span class="drill-metric__label">Google Rating</span>
                <span class="drill-metric__value">${prop.googleStars ? prop.googleStars.toFixed(1) + ' ⭐ (' + (prop.googleReviews || 0) + ')' : '—'}</span>
              </div>
              <div class="drill-metric">
                <span class="drill-metric__label">TALi (J Turner)</span>
                <span class="drill-metric__value">${prop.tali ? prop.tali.toFixed(1) + ' (Avg: ' + TURNER_TALI_AVG + ')' : '—'}</span>
              </div>
              <div class="drill-metric">
                <span class="drill-metric__label">ORA Score</span>
                <span class="drill-metric__value">${prop.propIndex ? prop.propIndex.toFixed(1) + ' (Avg: ' + TURNER_PI_AVG + ')' : '—'}</span>
              </div>
              <div class="drill-metric">
                <span class="drill-metric__label">Training</span>
                <span class="drill-metric__value">${prop.training ? (prop.training * 100).toFixed(0) + '%' : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="drill-actions">
          <button class="btn btn--primary btn--sm">📋 Generate Report</button>
          <button class="btn btn--secondary btn--sm">📊 Full Analytics</button>
          <button class="btn btn--secondary btn--sm">🖨️ Print</button>
        </div>
      </div>
    `;
  }
  
  renderCharts() {
    // Render sparkline charts after DOM update
    if (!this.pendingCharts) return;
    
    Object.keys(this.pendingCharts).forEach(propId => {
      const { prop, hist } = this.pendingCharts[propId];
      
      const chartConfigs = [
        { id: `chart_physOcc_${propId}`, data: hist.physOcc, color: this.getSparklineColor(prop.physOcc, 'physOcc', prop.type) },
        { id: `chart_leased_${propId}`, data: hist.leased, color: this.getSparklineColor(prop.leased, 'leased', prop.type) },
        { id: `chart_closing_${propId}`, data: hist.mtdClosing, color: this.getSparklineColor(prop.mtdClosing, 'mtdClosing', prop.type) },
        { id: `chart_woSla_${propId}`, data: hist.woSla, color: this.getSparklineColor(prop.woSla, 'woSla', prop.type) },
        { id: `chart_delinq_${propId}`, data: hist.delinq, color: '#ef4444' }, // Always red for delinquency
        { id: `chart_renewal_${propId}`, data: hist.renewalRatio, color: this.getSparklineColor(prop.renewalRatio, 'renewalRatio', prop.type) }
      ];
      
      chartConfigs.forEach(({ id, data, color }) => {
        const container = document.getElementById(id);
        if (container && data && data.length > 0) {
          Charts.sparkline(container, data, { color, height: 50 });
        }
      });
    });
    
    this.pendingCharts = {};
  }
  
  getSparklineColor(value, metric, type) {
    const colorClass = this.getMetricColor(value, metric, type);
    const colors = {
      'green': '#22c55e',
      'yellow': '#eab308',
      'red': '#ef4444',
      'na': '#6b7280'
    };
    return colors[colorClass] || colors.na;
  }

  getScoreClass(score) {
    if (score === null) return 'na';
    if (score >= 4) return 'green';
    if (score >= 2) return 'yellow';
    return 'red';
  }
}

// Initialize app
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());

export default app;

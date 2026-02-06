/**
 * Portfolio Scorecard v2 - Phase 3
 * Full metrics table, Lead-to-Tour, Charts, YoY, Lease-up flags
 */

import State from './core/state.js';
import Router from './core/router.js';
import Events, { EVENT } from './core/events.js';
import { loadThresholds } from './utils/scoring.js';
import { formatPercent, formatCurrency, formatNumber, formatScore, getTrend, snakeToTitle } from './utils/formatting.js';
import { riseProperties, risePortfolio, propertyHistory, ON_CAMPUS_DEFAULT_METRICS } from './data/rise-data.js';

// Metrics that should be ON by default for On-Campus properties
const OC_DEFAULT_ON = ['woSla', 'training', 'tali', 'noiVariance'];
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

// Column definitions with labels
const COLUMN_DEFS = {
  physOcc: { label: 'Phys Occ%', default: true },
  leased: { label: 'Leased%', default: true },
  leadToTour: { label: 'Lead→Tour', default: true },
  delinq: { label: 'Delinq%', default: true },
  woSla: { label: 'WO SLA%', default: true },
  mtdClosing: { label: 'Closing%', default: true },
  renewalRatio: { label: 'Renewal%', default: true },
  googleStars: { label: 'Google', default: true },
  training: { label: 'Training', default: true },
  tali: { label: 'Satisfaction', default: true },
  propIndex: { label: 'ORA', default: true },
  noiVariance: { label: 'NOI Var', default: true }
};

// Date range labels - RISE weeks are Fri-Thu, periods show PREVIOUS completed period
const DATE_RANGES = {
  wtd: { label: 'Prior Week', getRange: () => {
    // RISE weeks: Friday to Thursday
    // Find the most recent completed week (last Thu back to prev Fri)
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ... 4=Thu, 5=Fri, 6=Sat
    
    // Find last Thursday (end of prior week)
    let end = new Date(now);
    const daysToLastThu = (day + 3) % 7; // Days back to most recent Thu
    end.setDate(now.getDate() - daysToLastThu - (day <= 4 ? 7 : 0));
    
    // Start is 6 days before end (Friday)
    let start = new Date(end);
    start.setDate(end.getDate() - 6);
    
    return { start, end };
  }},
  mtd: { label: 'Prior Month', getRange: () => {
    const now = new Date();
    // Previous month
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of prev month
    return { start, end };
  }},
  qtd: { label: 'Prior Quarter', getRange: () => {
    const now = new Date();
    const currentQ = Math.floor(now.getMonth() / 3);
    const prevQ = currentQ === 0 ? 3 : currentQ - 1;
    const year = currentQ === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const start = new Date(year, prevQ * 3, 1);
    const end = new Date(year, prevQ * 3 + 3, 0); // Last day of quarter
    return { start, end };
  }},
  ytd: { label: 'Prior Year', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear() - 1, 11, 31);
    return { start, end };
  }}
};

class App {
  constructor() {
    this.config = null;
    this.initialized = false;
    this.properties = [];
    this.leaseUpState = {};
    this.metricToggles = {};
    this.expandedRegions = {};
    this.expandedProperty = null;
    this.visibleColumns = {};
    this.showColumnPicker = false;
    this.showScoringGuide = false;
    this.activeTab = 'leasing'; // 'leasing' or 'oncampus'
    this.searchDebounce = null;
    this.customDateStart = null;
    this.customDateEnd = null;
    
    // Initialize default column visibility
    Object.keys(COLUMN_DEFS).forEach(key => {
      this.visibleColumns[key] = COLUMN_DEFS[key].default;
    });
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
        if (state.columns) {
          this.visibleColumns = { ...this.visibleColumns, ...state.columns };
        }
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
        regions: this.expandedRegions,
        columns: this.visibleColumns
      }));
    } catch (e) {
      console.warn('Could not save state');
    }
  }
  
  toggleColumn(key) {
    this.visibleColumns[key] = !this.visibleColumns[key];
    this.saveState();
    this.render();
  }
  
  toggleColumnPicker() {
    this.showColumnPicker = !this.showColumnPicker;
    this.render();
  }
  
  getVisibleColumns() {
    return L_KEYS.filter(key => this.visibleColumns[key]);
  }
  
  resetColumns() {
    Object.keys(COLUMN_DEFS).forEach(key => {
      this.visibleColumns[key] = COLUMN_DEFS[key].default;
    });
    this.saveState();
    this.render();
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
    // If user has explicitly toggled, use their preference
    if (key in this.metricToggles) return this.metricToggles[key];
    
    // Check if this is an on-campus property
    const prop = this.properties.find(p => p.name === propName);
    if (prop && prop.type === 'OC') {
      // On-campus properties: only WO SLA, Training, Satisfaction, NOI are ON by default
      return OC_DEFAULT_ON.includes(metric);
    }
    
    // Leasing properties: all metrics ON by default
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

    // YoY toggle (now in drill-down only)
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-action="toggle-yoy-drill"]')) {
        State.set({ showYoY: e.target.checked });
        this.render();
      }
    });

    // Search with debounce for better responsiveness
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-action="search"]')) {
        const value = e.target.value;
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => {
          State.set({ filters: { ...State.get('filters'), search: value } });
          this.render();
          // Re-focus the search input after render
          const searchInput = document.getElementById('searchInput');
          if (searchInput) {
            searchInput.focus();
            searchInput.setSelectionRange(value.length, value.length);
          }
        }, 150);
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

    // Column visibility toggle
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-column-toggle]')) {
        const column = e.target.dataset.columnToggle;
        this.toggleColumn(column);
      }
    });

    // Column picker toggle button
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="toggle-columns"]')) {
        this.toggleColumnPicker();
      }
    });

    // Close column picker when clicking outside
    document.addEventListener('click', (e) => {
      if (this.showColumnPicker && !e.target.closest('.column-picker') && !e.target.closest('[data-action="toggle-columns"]')) {
        this.showColumnPicker = false;
        this.render();
      }
    });

    // Tab switching
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        this.activeTab = tab.dataset.tab;
        this.render();
      }
    });

    // Scoring guide
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="show-scoring-guide"]')) {
        this.showScoringGuide = true;
        this.render();
      }
    });

    // Close scoring guide
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-scoring-guide"]') || 
          (this.showScoringGuide && e.target.closest('.modal-overlay') && !e.target.closest('.modal'))) {
        this.showScoringGuide = false;
        this.render();
      }
    });

    // Print
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="print"]')) {
        window.print();
      }
    });

    // Custom date inputs - don't auto-apply, wait for Apply button
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-action="custom-date-start"]')) {
        this.customDateStart = e.target.value;
      }
      if (e.target.matches('[data-action="custom-date-end"]')) {
        this.customDateEnd = e.target.value;
      }
    });

    // Apply custom date button
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="apply-custom-date"]')) {
        if (this.customDateStart && this.customDateEnd) {
          State.set({ dateRange: 'custom' });
          this.render();
        } else {
          alert('Please select both start and end dates');
        }
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
    
    // Add scoring guide modal if open
    const modalContainer = document.getElementById('modal-container') || this.createModalContainer();
    modalContainer.innerHTML = this.renderScoringGuide();
    
    // Render charts after DOM update
    setTimeout(() => this.renderCharts(), 50);
  }
  
  createModalContainer() {
    const container = document.createElement('div');
    container.id = 'modal-container';
    document.body.appendChild(container);
    return container;
  }

  renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const theme = State.get('theme');
    const dateRange = State.get('dateRange') || 'mtd';
    const showYoY = State.get('showYoY');
    
    // Get date range display
    const rangeInfo = DATE_RANGES[dateRange];
    const range = rangeInfo?.getRange() || { start: new Date(), end: new Date() };
    const formatDate = (d) => d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const dateDisplay = `${formatDate(range.start)} - ${formatDate(range.end)}`;

    header.innerHTML = `
      <div class="header__logo">
        <span>${this.config?.company?.name || 'Portfolio Scorecard'}</span>
        <div class="header__subtitle">Property Performance Dashboard</div>
      </div>
      <div class="header__actions">
        <div class="date-display">
          <strong>${rangeInfo?.label || 'Period'}:</strong> ${dateDisplay}
        </div>
        <div class="period-selector">
          <button class="period-selector__btn ${dateRange === 'wtd' ? 'period-selector__btn--active' : ''}" data-period="wtd" title="Prior Week (Fri-Thu)">W</button>
          <button class="period-selector__btn ${dateRange === 'mtd' ? 'period-selector__btn--active' : ''}" data-period="mtd" title="Prior Month">M</button>
          <button class="period-selector__btn ${dateRange === 'qtd' ? 'period-selector__btn--active' : ''}" data-period="qtd" title="Prior Quarter">Q</button>
          <button class="period-selector__btn ${dateRange === 'ytd' ? 'period-selector__btn--active' : ''}" data-period="ytd" title="Prior Year">Y</button>
        </div>
        <div class="custom-date">
          <input type="date" class="date-input" data-action="custom-date-start" value="${this.customDateStart || ''}" title="Start Date">
          <span>to</span>
          <input type="date" class="date-input" data-action="custom-date-end" value="${this.customDateEnd || ''}" title="End Date">
          <button class="btn btn--primary btn--sm" data-action="apply-custom-date" title="Apply custom date range">Apply</button>
        </div>
        <button class="btn btn--ghost btn--sm" data-action="show-scoring-guide" title="How scores are calculated">
          ❓ Legend
        </button>
        <button class="btn btn--secondary btn--icon" data-action="toggle-theme" title="Toggle theme">
          ${theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    `;
  }

  renderDashboard() {
    const main = document.getElementById('main');
    const allProps = this.getFilteredProperties();
    
    // Split properties by type
    const leasingProps = allProps.filter(p => p.type !== 'OC');
    const onCampusProps = allProps.filter(p => p.type === 'OC');
    
    // Properties for current tab
    const tabProps = this.activeTab === 'oncampus' ? onCampusProps : leasingProps;
    const portfolioScore = this.calcWeightedScore(tabProps);

    // Group by RD
    const byRD = {};
    tabProps.forEach(p => {
      if (!byRD[p.rd]) byRD[p.rd] = [];
      byRD[p.rd].push(p);
    });

    // Calculate summary stats based on active tab
    let summaryHTML = '';
    
    if (this.activeTab === 'oncampus') {
      // ON-CAMPUS SUMMARY
      const ocBeds = onCampusProps.reduce((s, p) => s + (p.beds || 0), 0);
      const ocScore = portfolioScore;
      
      // Calculate weighted averages for on-campus
      let woSlaTotal = 0, woSlaWeight = 0;
      let trainingTotal = 0, trainingWeight = 0;
      let taliTotal = 0, taliWeight = 0;
      let oraTotal = 0, oraWeight = 0;
      let noiTotal = 0, noiWeight = 0;
      
      onCampusProps.forEach(p => {
        const w = p.beds || p.units || 1;
        if (p.woSla != null) { woSlaTotal += p.woSla * w; woSlaWeight += w; }
        if (p.training != null) { trainingTotal += p.training * w; trainingWeight += w; }
        if (p.tali != null) { taliTotal += p.tali * w; taliWeight += w; }
        if (p.propIndex != null) { oraTotal += p.propIndex * w; oraWeight += w; }
        if (p.noiVariance != null) { noiTotal += p.noiVariance * w; noiWeight += w; }
      });
      
      const avgWoSla = woSlaWeight > 0 ? woSlaTotal / woSlaWeight : null;
      const avgTraining = trainingWeight > 0 ? trainingTotal / trainingWeight : null;
      const avgTali = taliWeight > 0 ? taliTotal / taliWeight : null;
      const avgOra = oraWeight > 0 ? oraTotal / oraWeight : null;
      const avgNoi = noiWeight > 0 ? noiTotal / noiWeight : null;
      
      summaryHTML = `
        <!-- On-Campus Summary -->
        <div class="summary-grid summary-grid--6">
          <div class="summary-card">
            <div class="summary-card__label">Total On-Campus Beds</div>
            <div class="summary-card__value">${ocBeds.toLocaleString()}</div>
            <div class="summary-card__detail">${onCampusProps.length} properties</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">On-Campus Score</div>
            <div class="summary-card__value score-pill score-pill--${this.getScoreClass(ocScore)}">
              ${ocScore !== null ? ocScore.toFixed(2) : '—'}<span class="max-score"> / 5.00</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">W/O SLA</div>
            <div class="summary-card__value" style="color: ${avgWoSla >= 0.95 ? 'var(--success)' : avgWoSla >= 0.88 ? 'var(--warning)' : 'var(--danger)'}">
              ${avgWoSla != null ? (avgWoSla * 100).toFixed(1) + '%' : '—'}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">Resident Satisfaction</div>
            <div class="summary-card__value" style="color: ${avgTali >= 7.17 ? 'var(--success)' : avgTali >= 6.83 ? 'var(--warning)' : 'var(--danger)'}">
              ${avgTali != null ? avgTali.toFixed(2) : '—'}
            </div>
            <div class="summary-card__detail">Turner Avg: ${TURNER_TALI_AVG}</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">ORA Score</div>
            <div class="summary-card__value" style="color: ${avgOra >= 8.96 ? 'var(--success)' : avgOra >= 8.53 ? 'var(--warning)' : 'var(--danger)'}">
              ${avgOra != null ? avgOra.toFixed(2) : '—'}
            </div>
            <div class="summary-card__detail">Turner Avg: ${TURNER_PI_AVG}</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">Training</div>
            <div class="summary-card__value" style="color: ${avgTraining >= 1.0 ? 'var(--success)' : avgTraining >= 0.90 ? 'var(--warning)' : 'var(--danger)'}">
              ${avgTraining != null ? (avgTraining * 100).toFixed(0) + '%' : '—'}
            </div>
          </div>
        </div>
        <div class="summary-grid summary-grid--1" style="margin-top: var(--space-3);">
          <div class="summary-card">
            <div class="summary-card__label">NOI Variance (Avg)</div>
            <div class="summary-card__value" style="color: ${avgNoi >= 1.0 ? 'var(--success)' : avgNoi >= 0.95 ? 'var(--warning)' : 'var(--danger)'}">
              ${avgNoi != null ? (avgNoi * 100).toFixed(1) + '%' : '—'}
            </div>
            <div class="summary-card__detail">100% = on budget</div>
          </div>
        </div>
      `;
    } else {
      // LEASING SUMMARY
      const nonStudentProps = leasingProps.filter(p => p.type !== 'STU');
      const studentProps = leasingProps.filter(p => p.type === 'STU');
      const nonStudentUnits = nonStudentProps.reduce((s, p) => s + (p.units || 0), 0);
      const studentBeds = studentProps.reduce((s, p) => s + (p.beds || 0), 0);
      const ocBeds = onCampusProps.reduce((s, p) => s + (p.beds || 0), 0);
      const totalManaged = nonStudentUnits + studentBeds + ocBeds;

      // Calculate weighted avg Google stars
      let gWeight = 0, gScore = 0, gReviews = 0;
      leasingProps.forEach(p => {
        if (p.googleStars) {
          const w = p.beds || p.units || 1;
          gWeight += w;
          gScore += p.googleStars * w;
          gReviews += p.googleReviews || 0;
        }
      });
      const avgGoogle = gWeight > 0 ? gScore / gWeight : 0;

      // Calculate portfolio TALi avg
      let tWeight = 0, tScore = 0;
      leasingProps.forEach(p => {
        if (p.tali) {
          const w = p.beds || p.units || 1;
          tWeight += w;
          tScore += p.tali * w;
        }
      });
      const avgTali = tWeight > 0 ? tScore / tWeight : 0;

      // Red flags for leasing properties
      const redFlags = [];
      leasingProps.forEach(p => {
        L_KEYS.forEach(key => {
          const m = this.evalMetric(p, key);
          if (m.active && m.rawColor === 'red') {
            redFlags.push({ property: p.name, metric: key, value: m.fmt });
          }
        });
      });

      summaryHTML = `
        <!-- Leasing Summary Row 1 -->
        <div class="summary-grid summary-grid--5">
          <div class="summary-card">
            <div class="summary-card__label">Total Managed</div>
            <div class="summary-card__value">${totalManaged.toLocaleString()}</div>
            <div class="summary-card__detail">${nonStudentUnits.toLocaleString()} units + ${(studentBeds + ocBeds).toLocaleString()} beds</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">Leasing Units</div>
            <div class="summary-card__value">${nonStudentUnits.toLocaleString()}</div>
            <div class="summary-card__detail">${nonStudentProps.length} non-student properties</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">Leasing Beds</div>
            <div class="summary-card__value">${studentBeds.toLocaleString()}</div>
            <div class="summary-card__detail">${studentProps.length} off-campus student</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">On-Campus Beds</div>
            <div class="summary-card__value">${ocBeds.toLocaleString()}</div>
            <div class="summary-card__detail">${onCampusProps.length} on-campus properties</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">Wtd Avg Google</div>
            <div class="summary-card__value" style="color: ${avgGoogle >= 4.5 ? 'var(--success)' : avgGoogle >= 3.8 ? 'var(--warning)' : 'var(--danger)'}">${avgGoogle.toFixed(2)}</div>
            <div class="summary-card__detail">${gReviews} total reviews</div>
          </div>
        </div>

        <!-- Leasing Summary Row 2 -->
        <div class="summary-grid summary-grid--5">
          <div class="summary-card">
            <div class="summary-card__label">Leasing Score</div>
            <div class="summary-card__value score-pill score-pill--${this.getScoreClass(portfolioScore)}">
              ${portfolioScore !== null ? portfolioScore.toFixed(2) : '—'}<span class="max-score"> / 5.00</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">On-Campus Score</div>
            <div class="summary-card__value score-pill score-pill--${this.getScoreClass(this.calcWeightedScore(onCampusProps))}">
              ${this.calcWeightedScore(onCampusProps) !== null ? this.calcWeightedScore(onCampusProps).toFixed(2) : '—'}<span class="max-score"> / 5.00</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">Resident Satisfaction</div>
            <div class="summary-card__value" style="color: var(--success)">${avgTali > 0 ? avgTali.toFixed(2) : RISE_TALI_AVG}</div>
            <div class="summary-card__detail">Turner Avg: ${TURNER_TALI_AVG} (+${(((RISE_TALI_AVG - TURNER_TALI_AVG) / TURNER_TALI_AVG) * 100).toFixed(1)}%)</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">RISE ORA Score</div>
            <div class="summary-card__value">${RISE_PI_AVG}</div>
            <div class="summary-card__detail">Turner Avg: ${TURNER_PI_AVG} (+${(((RISE_PI_AVG - TURNER_PI_AVG) / TURNER_PI_AVG) * 100).toFixed(1)}%)</div>
          </div>
          <div class="summary-card ${redFlags.length > 0 ? 'summary-card--alert' : ''}">
            <div class="summary-card__label">Red Flags</div>
            <div class="summary-card__value">${redFlags.length}</div>
            <div class="summary-card__detail">${redFlags.length > 0 ? 'Requires attention' : 'All clear'}</div>
          </div>
        </div>
      `;
    }

    main.innerHTML = `
      <div class="dashboard">
        ${summaryHTML}

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab ${this.activeTab === 'leasing' ? 'tab--active' : ''}" data-tab="leasing">
            Leasing Properties (${leasingProps.length})
          </button>
          <button class="tab ${this.activeTab === 'oncampus' ? 'tab--active' : ''}" data-tab="oncampus">
            On-Campus Properties (${onCampusProps.length})
          </button>
        </div>

        <!-- Controls Bar -->
        <div class="controls-bar">
          <input type="text" class="input" placeholder="Search properties..." data-action="search" value="${State.get('filters')?.search || ''}" id="searchInput">
          <div class="controls-bar__actions">
            <button class="btn btn--ghost btn--sm scoring-ref" data-action="show-scoring-guide">
              <span class="g">●</span> ≥4 <span class="y">●</span> ≥2 <span class="r">●</span> &lt;2
            </button>
            <div class="column-picker-wrapper">
              <button class="btn btn--secondary btn--sm" data-action="toggle-columns">
                ⚙️ Columns (${this.getVisibleColumns().length}/${L_KEYS.length})
              </button>
              ${this.showColumnPicker ? `
                <div class="column-picker">
                  <div class="column-picker__header">Show/Hide Columns</div>
                  <div class="column-picker__list">
                    ${L_KEYS.map(key => `
                      <label class="column-picker__item">
                        <input type="checkbox" ${this.visibleColumns[key] ? 'checked' : ''} data-column-toggle="${key}">
                        <span>${COLUMN_DEFS[key]?.label || key}</span>
                      </label>
                    `).join('')}
                  </div>
                  <div class="column-picker__footer">
                    <button class="btn btn--sm btn--ghost" onclick="app.resetColumns()">Reset to Default</button>
                  </div>
                </div>
              ` : ''}
            </div>
            <button class="btn btn--secondary btn--sm" data-action="print">🖨️ Print</button>
          </div>
        </div>

        <!-- Regional Blocks -->
        <div class="regional-blocks">
          ${Object.keys(byRD).length > 0 
            ? Object.keys(byRD).sort((a, b) => a.localeCompare(b)).map(rd => this.renderRegionalBlock(rd, byRD[rd].sort((x, y) => x.name.localeCompare(y.name)))).join('')
            : '<div class="empty-state">No properties match your search.</div>'
          }
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
                    <th>${this.activeTab === 'oncampus' ? 'Beds' : 'Units'}</th>
                    ${this.getVisibleColumns().map(key => `<th>${COLUMN_DEFS[key]?.label || key} <span class="info-icon" data-tooltip="${METRIC_INFO[key]?.desc || ''}" data-metric="${key}">ⓘ</span></th>`).join('')}
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
    const visibleCols = this.getVisibleColumns();
    const metrics = visibleCols.map(k => this.evalMetric(prop, k));
    const score = this.calcPropertyScore(prop);
    const isLeaseUp = this.isLeaseUp(prop);
    const isExpanded = this.expandedProperty === prop.name;
    const colSpan = 3 + visibleCols.length + 1; // Property, Type, Units + metrics + Score

    let html = `
      <tr class="${isExpanded ? 'property-row--expanded' : ''}">
        <td>
          <div class="property-cell">
            <span class="property-name" data-drill-property="${prop.name}">${prop.name} <span class="drill-arrow">${isExpanded ? '▼' : '▶'}</span></span>
            <span class="property-city">${prop.city || ''}</span>
            <label class="leaseup-toggle-switch">
              <input type="checkbox" ${isLeaseUp ? 'checked' : ''} data-leaseup-toggle="${prop.name}">
              <span class="slider"></span>
              <span class="leaseup-label">${isLeaseUp ? 'Lease-Up' : 'Stabilized'}</span>
            </label>
          </div>
        </td>
        <td class="type-cell">${prop.type === 'OC' ? 'On-Camp' : prop.type}</td>
        <td class="units-cell">${(prop.type === 'OC' || prop.type === 'STU') ? (prop.beds || '—') : (prop.units || '—')}</td>
        ${metrics.map(m => `
          <td>
            <div class="metric-cell">
              <span class="metric-value metric-value--${m.color}">${m.fmt}</span>
              <label class="metric-toggle-switch">
                <input type="checkbox" ${m.active ? 'checked' : ''} data-metric-toggle="${prop.name}::${m.key}">
                <span class="slider"></span>
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
          <td colspan="${colSpan}">
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
          <div class="drill-panel__actions">
            <label class="toggle" title="Year over Year comparison">
              <input type="checkbox" class="toggle__input" data-action="toggle-yoy-drill" data-property="${prop.name}" ${State.get('showYoY') ? 'checked' : ''}>
              <span class="toggle__switch"></span>
              <span class="toggle__label">YoY</span>
            </label>
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
          <button class="btn btn--primary btn--sm" data-action="generate-report" data-property="${prop.name}">📋 Generate Report</button>
          <button class="btn btn--secondary btn--sm btn--disabled" disabled title="Coming Soon">📊 Full Analytics <span class="badge badge--sm">Soon</span></button>
          <button class="btn btn--secondary btn--sm" onclick="window.print()">🖨️ Print</button>
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

  renderScoringGuide() {
    if (!this.showScoringGuide) return '';
    
    return `
      <div class="modal-overlay">
        <div class="modal scoring-guide">
          <button class="modal__close" data-action="close-scoring-guide">&times;</button>
          <h2>Scoring Methodology</h2>
          
          <div class="sg-section">
            <h3>How Scores Work</h3>
            <p>Each metric is evaluated against asset-type-specific thresholds and scored on a 5-point scale:</p>
            <ul>
              <li><span class="score-dot score-dot--green"></span> Green = 5 points (On Target)</li>
              <li><span class="score-dot score-dot--yellow"></span> Yellow = 2 points (Watch)</li>
              <li><span class="score-dot score-dot--red"></span> Red = 0 points (Action Needed)</li>
            </ul>
            <p>A property's overall score is the average of all active metrics. Maximum possible: 5.00</p>
          </div>

          <div class="sg-section">
            <h3>Score Color Thresholds</h3>
            <p>Score ≥ 4.0 = <span class="text-success">Green</span> | Score ≥ 2.0 = <span class="text-warning">Yellow</span> | Score &lt; 2.0 = <span class="text-danger">Red</span></p>
          </div>

          <div class="sg-section">
            <h3>Lease-Up Handling</h3>
            <p>Properties in Lease-Up automatically exclude Physical Occupancy, Leased %, Delinquency, and Renewal Ratio from scoring. Operational metrics remain scored.</p>
          </div>

          <div class="sg-section">
            <h3>Conventional / BFR Thresholds</h3>
            <table class="sg-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th class="text-success">Green</th>
                  <th class="text-warning">Yellow</th>
                  <th class="text-danger">Red</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Physical Occupancy</td><td>≥ 93%</td><td>88-92.99%</td><td>&lt; 88%</td></tr>
                <tr><td>Leased %</td><td>≥ 95%</td><td>90-94.99%</td><td>&lt; 90%</td></tr>
                <tr><td>Delinquency</td><td>≤ 0.5%</td><td>0.51-2%</td><td>&gt; 2%</td></tr>
                <tr><td>WO SLA %</td><td>≥ 95%</td><td>88-94.99%</td><td>&lt; 88%</td></tr>
                <tr><td>Closing Ratio</td><td>≥ 40%</td><td>28-39.99%</td><td>&lt; 28%</td></tr>
                <tr><td>Renewal Ratio</td><td>≥ 55%</td><td>48-54.99%</td><td>&lt; 48%</td></tr>
              </tbody>
            </table>
          </div>

          <div class="sg-section">
            <h3>55+ (Active Adult) Thresholds</h3>
            <table class="sg-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th class="text-success">Green</th>
                  <th class="text-warning">Yellow</th>
                  <th class="text-danger">Red</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Physical Occupancy</td><td>≥ 93%</td><td>88-92.99%</td><td>&lt; 88%</td></tr>
                <tr><td>Delinquency</td><td>≤ 0.025%</td><td>0.026-1%</td><td>&gt; 1%</td></tr>
                <tr><td>Closing Ratio</td><td>≥ 30%</td><td>20-29.99%</td><td>&lt; 20%</td></tr>
                <tr><td>Renewal Ratio</td><td>≥ 75%</td><td>68-74.99%</td><td>&lt; 68%</td></tr>
              </tbody>
            </table>
          </div>

          <div class="sg-section">
            <h3>Student Housing Thresholds</h3>
            <table class="sg-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th class="text-success">Green</th>
                  <th class="text-warning">Yellow</th>
                  <th class="text-danger">Red</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Physical Occupancy</td><td>≥ 98%</td><td>94-97.99%</td><td>&lt; 94%</td></tr>
                <tr><td>Delinquency</td><td>≤ 1%</td><td>1.01-1.5%</td><td>&gt; 1.5%</td></tr>
                <tr><td>Closing Ratio</td><td>≥ 60%</td><td>45-59.99%</td><td>&lt; 45%</td></tr>
                <tr><td>Renewal Ratio</td><td>≥ 45%</td><td>35-44.99%</td><td>&lt; 35%</td></tr>
              </tbody>
            </table>
          </div>

          <div class="sg-section">
            <h3>Google Star Rating</h3>
            <p>Google Business reviews are aggregated from the property's Google Maps listing.</p>
            <table class="sg-table">
              <thead>
                <tr>
                  <th>Rating</th>
                  <th class="text-success">Green</th>
                  <th class="text-warning">Yellow</th>
                  <th class="text-danger">Red</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Google Stars</td><td>≥ 4.5</td><td>3.8-4.49</td><td>&lt; 3.8</td></tr>
              </tbody>
            </table>
            <p style="margin-top: 8px; font-size: 0.85em; opacity: 0.8;">Review count shown in parentheses. Higher counts indicate more reliable ratings.</p>
          </div>

          <div class="sg-section">
            <h3>ORA Score (Online Reputation Assessment)</h3>
            <p>J Turner Research's ORA score measures online reputation across 20+ review sites on a 0-100 scale, normalized to 0-10 for display.</p>
            <table class="sg-table">
              <thead>
                <tr>
                  <th>Comparison</th>
                  <th class="text-success">Green</th>
                  <th class="text-warning">Yellow</th>
                  <th class="text-danger">Red</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>vs Turner Average (${TURNER_PI_AVG})</td><td>≥ 5% above</td><td>0-4.99% above</td><td>Below average</td></tr>
              </tbody>
            </table>
            <p style="margin-top: 8px; font-size: 0.85em; opacity: 0.8;">RISE Portfolio Average: ${RISE_PI_AVG} | Industry Average: ${TURNER_PI_AVG}</p>
          </div>

          <div class="sg-section">
            <h3>Resident Satisfaction (TALi)</h3>
            <p>J Turner's TALi (Total Apartment Loyalty Index) measures resident satisfaction and likelihood to recommend on a 0-10 scale.</p>
            <table class="sg-table">
              <thead>
                <tr>
                  <th>Comparison</th>
                  <th class="text-success">Green</th>
                  <th class="text-warning">Yellow</th>
                  <th class="text-danger">Red</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>vs Turner Average (${TURNER_TALI_AVG})</td><td>≥ 5% above</td><td>0-4.99% above</td><td>Below average</td></tr>
              </tbody>
            </table>
            <p style="margin-top: 8px; font-size: 0.85em; opacity: 0.8;">RISE Portfolio Average: ${RISE_TALI_AVG} | Industry Average: ${TURNER_TALI_AVG}</p>
          </div>

          <div class="sg-section">
            <h3>On-Campus Properties</h3>
            <p>On-Campus properties only score the following metrics by default:</p>
            <ul>
              <li>W/O SLA %</li>
              <li>Training Completion %</li>
              <li>Resident Satisfaction (TALi)</li>
              <li>NOI Variance</li>
            </ul>
            <p style="margin-top: 8px; font-size: 0.85em; opacity: 0.8;">Other metrics can be manually enabled via toggles.</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize app and expose to window for onclick handlers
const app = new App();
window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());

export default app;

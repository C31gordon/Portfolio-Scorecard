/**
 * Main Application - Portfolio Scorecard v2
 */

import State from './core/state.js';
import Router from './core/router.js';
import Events, { EVENT } from './core/events.js';
import { loadThresholds, calculatePropertyScore, calculatePortfolioScore, getRedFlags, getPortfolioRedFlags, getScoreColorClass } from './utils/scoring.js';
import { formatPercent, formatCurrency, formatNumber, formatScore, getTrend, snakeToTitle } from './utils/formatting.js';
import { mockPortfolio, mockProperties, mockSubmarkets } from './data/mock-data.js';
import { generateLeaseData, generateWorkOrderData, generateAgentData, generateFinancialData, generateRentRollData, generateHistoricalData } from './data/mock-drilldown.js';
import { Charts } from './components/charts.js';
import { DataTable } from './components/data-table.js';

class App {
  constructor() {
    this.config = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;
    
    try {
      // Load config
      await this.loadConfig();
      
      // Load thresholds
      await loadThresholds();
      
      // Initialize state with mock data
      State.set({
        portfolio: mockPortfolio,
        properties: mockProperties,
        submarkets: mockSubmarkets,
        isLoading: false
      });
      
      // Apply theme
      document.documentElement.setAttribute('data-theme', State.get('theme'));
      
      // Initialize router
      Router.init();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Subscribe to state changes
      this.setupStateSubscriptions();
      
      // Render initial view
      this.render();
      
      this.initialized = true;
      console.log('Portfolio Scorecard v2 initialized');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      State.set({ error: error.message });
    }
  }
  
  /**
   * Load configuration
   */
  async loadConfig() {
    try {
      const response = await fetch('./config/config.json');
      this.config = await response.json();
    } catch (error) {
      console.warn('Failed to load config, using defaults');
      this.config = { company: { name: 'Portfolio Scorecard' } };
    }
  }
  
  /**
   * Setup event listeners
   */
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
        Events.emit(EVENT.DATE_RANGE_CHANGED, periodBtn.dataset.period);
      }
    });
    
    // YoY toggle
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-action="toggle-yoy"]')) {
        State.set({ showYoY: e.target.checked });
      }
    });
    
    // Search
    document.addEventListener('input', (e) => {
      if (e.target.matches('[data-action="search"]')) {
        State.set({ filters: { ...State.get('filters'), search: e.target.value } });
        Events.emit(EVENT.SEARCH_CHANGED, e.target.value);
      }
    });
    
    // Property click
    document.addEventListener('click', (e) => {
      const propertyRow = e.target.closest('[data-property-id]');
      if (propertyRow) {
        Router.navigate(`/property/${propertyRow.dataset.propertyId}`);
      }
    });
    
    // Back button
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="back"]')) {
        Router.back();
      }
    });
    
    // Drill-down card click
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-route]');
      if (card && !card.dataset.propertyId) {
        e.preventDefault();
        Router.navigate(card.dataset.route);
      }
    });
  }
  
  /**
   * Setup state subscriptions
   */
  setupStateSubscriptions() {
    State.subscribe('theme', (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    });
    
    State.subscribe('currentView', () => {
      this.render();
    });
    
    State.subscribe('selectedProperty', () => {
      this.render();
    });
    
    State.subscribe('filters', () => {
      if (State.get('currentView') === 'portfolio') {
        this.renderPortfolio();
      }
    });
    
    State.subscribe('dateRange', () => {
      this.render();
    });
  }
  
  /**
   * Main render function
   */
  render() {
    const view = State.get('currentView');
    const main = document.getElementById('main');
    
    switch (view) {
      case 'portfolio':
        this.renderPortfolio();
        break;
      case 'property':
        this.renderProperty();
        break;
      case 'data':
        this.renderDataView();
        break;
      default:
        this.renderPortfolio();
    }
    
    // Update header
    this.renderHeader();
  }
  
  /**
   * Render header
   */
  renderHeader() {
    const header = document.getElementById('header');
    const theme = State.get('theme');
    const dateRange = State.get('dateRange');
    
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
          <input type="checkbox" class="toggle__input" data-action="toggle-yoy" ${State.get('showYoY') ? 'checked' : ''}>
          <span class="toggle__switch"></span>
          <span class="toggle__label">YoY</span>
        </label>
        <button class="btn btn--secondary" data-action="toggle-theme" title="Toggle theme" style="gap: var(--space-2);">
          <span style="opacity: ${theme === 'dark' ? '0.4' : '1'}">☀️</span>
          <span style="opacity: ${theme === 'dark' ? '1' : '0.4'}">🌙</span>
        </button>
      </div>
    `;
  }
  
  /**
   * Render portfolio dashboard (Level 0)
   */
  renderPortfolio() {
    const main = document.getElementById('main');
    const properties = this.getFilteredProperties();
    const portfolio = State.get('portfolio');
    const portfolioScore = calculatePortfolioScore(properties);
    const redFlags = getPortfolioRedFlags(properties);
    const criticalFlags = redFlags.filter(f => f.severity === 'critical');
    
    main.innerHTML = `
      <div class="breadcrumbs">
        <span class="breadcrumbs__current">Portfolio Dashboard</span>
      </div>
      
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Portfolio Overview</h1>
          <p class="page-header__subtitle">${portfolio.totalProperties} properties • ${formatNumber(portfolio.totalUnits)} units</p>
        </div>
        <div class="page-header__actions">
          <input type="text" class="input" placeholder="Search properties..." data-action="search" value="${State.get('filters').search || ''}">
          <button class="btn btn--primary">Generate Report</button>
        </div>
      </div>
      
      <!-- Summary Cards -->
      <div class="grid grid--4 section">
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-card__label">Portfolio Score</span>
            <span class="score-pill score-pill--${getScoreColorClass(portfolioScore)}">${formatScore(portfolioScore)}</span>
          </div>
          <div class="metric-card__value">${formatScore(portfolioScore)}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-card__label">Avg Occupancy</span>
          </div>
          <div class="metric-card__value">${formatPercent(this.getAvgMetric(properties, 'occupancy', 'physical'))}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-card__header">
            <span class="metric-card__label">Avg Delinquency</span>
          </div>
          <div class="metric-card__value">${formatPercent(this.getAvgMetric(properties, 'delinquency', 'current'))}</div>
        </div>
        
        <div class="metric-card ${criticalFlags.length > 0 ? 'metric-card--danger' : ''}">
          <div class="metric-card__header">
            <span class="metric-card__label">Red Flags</span>
          </div>
          <div class="metric-card__value">${criticalFlags.length}</div>
          <div class="metric-card__trend metric-card__trend--${criticalFlags.length > 0 ? 'down' : 'up'}">
            ${criticalFlags.length > 0 ? `${criticalFlags.length} critical issues` : 'All clear'}
          </div>
        </div>
      </div>
      
      <!-- Red Flags Section -->
      ${criticalFlags.length > 0 ? `
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">🚨 Critical Issues</h2>
          </div>
          <div class="grid grid--2">
            ${criticalFlags.slice(0, 6).map(flag => `
              <div class="alert alert--danger">
                <div class="alert__content">
                  <div class="alert__title">${flag.propertyName}</div>
                  <div class="alert__message">${snakeToTitle(flag.metric)}: ${flag.value}${flag.unit === '%' ? '%' : ''} (threshold: ${flag.threshold}${flag.unit === '%' ? '%' : ''})</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Properties List -->
      <div class="section">
        <div class="section__header">
          <h2 class="section__title">Properties</h2>
          <span class="badge badge--primary">${properties.length} properties</span>
        </div>
        
        <div class="properties-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
          ${properties.map(property => {
            const score = calculatePropertyScore(property);
            const flags = getRedFlags(property);
            return `
              <div class="property-row" data-property-id="${property.id}">
                <div>
                  <div class="property-row__name">${property.name}</div>
                  <div class="property-row__type">${property.type} • ${property.address.city}, ${property.address.state}</div>
                </div>
                <div class="property-row__metric">
                  <div class="score-pill score-pill--${getScoreColorClass(score)}">${formatScore(score)}</div>
                </div>
                <div class="property-row__metric">
                  <div class="property-row__metric-value">${formatPercent(property.metrics.occupancy.physical)}</div>
                  <div class="property-row__metric-label">Occupancy</div>
                </div>
                <div class="property-row__metric">
                  <div class="property-row__metric-value">${formatPercent(property.metrics.delinquency.current)}</div>
                  <div class="property-row__metric-label">Delinquency</div>
                </div>
                <div class="property-row__metric">
                  <div class="property-row__metric-value">${formatPercent(property.metrics.leasing.closing_ratio)}</div>
                  <div class="property-row__metric-label">Closing</div>
                </div>
                <div class="property-row__metric">
                  <div class="property-row__metric-value">${formatPercent(property.metrics.retention.renewal_ratio)}</div>
                  <div class="property-row__metric-label">Renewal</div>
                </div>
                <div class="property-row__metric">
                  ${flags.filter(f => f.severity === 'critical').length > 0 
                    ? `<span class="badge badge--danger">${flags.filter(f => f.severity === 'critical').length} issues</span>`
                    : flags.filter(f => f.severity === 'warning').length > 0
                      ? `<span class="badge badge--warning">${flags.filter(f => f.severity === 'warning').length} warnings</span>`
                      : `<span class="badge badge--success">OK</span>`
                  }
                </div>
                <div>→</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * Render property detail (Level 1)
   */
  renderProperty() {
    const main = document.getElementById('main');
    const propertyId = State.get('selectedProperty')?.id;
    const property = mockProperties.find(p => p.id === propertyId);
    
    if (!property) {
      main.innerHTML = '<div class="alert alert--danger">Property not found</div>';
      return;
    }
    
    const score = calculatePropertyScore(property);
    const flags = getRedFlags(property);
    const submarket = mockSubmarkets.find(s => s.id === property.submarket_id);
    
    main.innerHTML = `
      <div class="breadcrumbs">
        <span class="breadcrumbs__item">
          <a href="/" class="breadcrumbs__link" data-route="/">Portfolio</a>
          <span class="breadcrumbs__separator">›</span>
        </span>
        <span class="breadcrumbs__current">${property.name}</span>
      </div>
      
      <div class="page-header">
        <div>
          <button class="btn btn--ghost" data-action="back">← Back</button>
          <h1 class="page-header__title">${property.name}</h1>
          <p class="page-header__subtitle">
            <span class="badge badge--primary">${property.type}</span>
            ${property.units} units • ${property.address.city}, ${property.address.state}
          </p>
        </div>
        <div class="page-header__actions">
          <span class="score-pill score-pill--lg score-pill--${getScoreColorClass(score)}">${formatScore(score)}</span>
          <button class="btn btn--primary">Generate Report</button>
        </div>
      </div>
      
      <!-- Red Flags -->
      ${flags.length > 0 ? `
        <div class="section">
          ${flags.filter(f => f.severity === 'critical').map(flag => `
            <div class="alert alert--danger">
              <div class="alert__content">
                <div class="alert__title">${snakeToTitle(flag.metric)}: ${flag.value}${flag.unit === '%' ? '%' : ''}</div>
                <div class="alert__message">Threshold: ${flag.threshold}${flag.unit === '%' ? '%' : ''}</div>
              </div>
            </div>
          `).join('')}
          ${flags.filter(f => f.severity === 'warning').map(flag => `
            <div class="alert alert--warning">
              <div class="alert__content">
                <div class="alert__title">${snakeToTitle(flag.metric)}: ${flag.value}${flag.unit === '%' ? '%' : ''}</div>
                <div class="alert__message">Target: ${flag.threshold}${flag.unit === '%' ? '%' : ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- Submarket Context -->
      ${submarket ? `
        <div class="card section">
          <div class="card__header">
            <span class="card__title">📍 Submarket: ${submarket.name}</span>
          </div>
          <div class="card__body">
            <div class="grid grid--4">
              <div>
                <div style="font-size: var(--text-sm); color: var(--text-secondary);">Market Occupancy</div>
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold);">${formatPercent(submarket.metrics.avg_occupancy)}</div>
              </div>
              <div>
                <div style="font-size: var(--text-sm); color: var(--text-secondary);">Market Rent</div>
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold);">${formatCurrency(submarket.metrics.avg_rent)}</div>
              </div>
              <div>
                <div style="font-size: var(--text-sm); color: var(--text-secondary);">YoY Rent Growth</div>
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold);">${formatPercent(submarket.metrics.rent_growth_yoy)}</div>
              </div>
              <div>
                <div style="font-size: var(--text-sm); color: var(--text-secondary);">Absorption</div>
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold);">${formatPercent(submarket.metrics.absorption_rate)}</div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Metrics Sections -->
      <div class="grid grid--3 section">
        <!-- Occupancy -->
        <div class="chart-tile">
          <div class="chart-tile__header">
            <span class="chart-tile__title">Occupancy</span>
          </div>
          <div class="card__body">
            <div style="display: grid; gap: var(--space-3);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Physical</span>
                <span class="score-pill score-pill--sm score-pill--${this.getMetricColor(property.metrics.occupancy.physical, 'physical_occupancy', property.type)}">${formatPercent(property.metrics.occupancy.physical)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Economic</span>
                <span>${formatPercent(property.metrics.occupancy.economic)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Leased</span>
                <span class="score-pill score-pill--sm score-pill--${this.getMetricColor(property.metrics.occupancy.leased, 'leased_percent', property.type)}">${formatPercent(property.metrics.occupancy.leased)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Leasing Funnel -->
        <div class="chart-tile">
          <div class="chart-tile__header">
            <span class="chart-tile__title">Leasing Funnel (MTD)</span>
          </div>
          <div class="card__body">
            <div style="display: grid; gap: var(--space-3);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Leads</span>
                <span>${formatNumber(property.metrics.leasing.mtd_leads)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Tours</span>
                <span>${formatNumber(property.metrics.leasing.mtd_tours)} (${formatPercent(property.metrics.leasing.lead_to_tour_pct)})</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Leases</span>
                <span>${formatNumber(property.metrics.leasing.mtd_leases)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Closing Ratio</span>
                <span class="score-pill score-pill--sm score-pill--${this.getMetricColor(property.metrics.leasing.closing_ratio, 'closing_ratio', property.type)}">${formatPercent(property.metrics.leasing.closing_ratio)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Revenue -->
        <div class="chart-tile">
          <div class="chart-tile__header">
            <span class="chart-tile__title">Revenue</span>
          </div>
          <div class="card__body">
            <div style="display: grid; gap: var(--space-3);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Avg Rent</span>
                <span>${formatCurrency(property.metrics.revenue.avg_rent)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>New Trade-Out</span>
                <span style="color: ${property.metrics.revenue.new_lease_trade_out >= 0 ? 'var(--success)' : 'var(--danger)'}">
                  ${property.metrics.revenue.new_lease_trade_out >= 0 ? '+' : ''}${formatPercent(property.metrics.revenue.new_lease_trade_out)}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Concessions MTD</span>
                <span>${formatCurrency(property.metrics.revenue.concessions_mtd)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Delinquency -->
        <div class="chart-tile">
          <div class="chart-tile__header">
            <span class="chart-tile__title">Delinquency</span>
          </div>
          <div class="card__body">
            <div style="display: grid; gap: var(--space-3);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Current</span>
                <span class="score-pill score-pill--sm score-pill--${this.getMetricColor(property.metrics.delinquency.current, 'delinquency', property.type, true)}">${formatPercent(property.metrics.delinquency.current)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>30-Day</span>
                <span>${formatPercent(property.metrics.delinquency['30_day'])}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>60-Day</span>
                <span>${formatPercent(property.metrics.delinquency['60_day'])}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>90+ Day</span>
                <span>${formatPercent(property.metrics.delinquency['90_plus'])}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Retention -->
        <div class="chart-tile">
          <div class="chart-tile__header">
            <span class="chart-tile__title">Retention</span>
          </div>
          <div class="card__body">
            <div style="display: grid; gap: var(--space-3);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Renewal Ratio</span>
                <span class="score-pill score-pill--sm score-pill--${this.getMetricColor(property.metrics.retention.renewal_ratio, 'renewal_ratio', property.type)}">${formatPercent(property.metrics.retention.renewal_ratio)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Renewals MTD</span>
                <span>${formatNumber(property.metrics.retention.mtd_renewals)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Move-Outs MTD</span>
                <span>${formatNumber(property.metrics.retention.mtd_move_outs)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Avg Tenancy</span>
                <span>${property.metrics.retention.avg_tenancy_months} mo</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Reputation -->
        <div class="chart-tile">
          <div class="chart-tile__header">
            <span class="chart-tile__title">Reputation</span>
          </div>
          <div class="card__body">
            <div style="display: grid; gap: var(--space-3);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Google Rating</span>
                <span class="score-pill score-pill--sm score-pill--${this.getMetricColor(property.metrics.reputation.google_rating, 'google_rating', property.type)}">${property.metrics.reputation.google_rating} ⭐</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Reviews</span>
                <span>${formatNumber(property.metrics.reputation.google_reviews)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>TALi Score</span>
                <span>${property.metrics.reputation.tali_score}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>ORA Score</span>
                <span>${property.metrics.reputation.ora_score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      ${this.getDrillDownLinks(property.id)}
    `;
    
    // Render sparklines after DOM is ready
    setTimeout(() => this.renderPropertyCharts(property), 0);
  }
  
  /**
   * Render charts in property view
   */
  renderPropertyCharts(property) {
    const historical = generateHistoricalData(8);
    
    // Add sparklines to metric cards if containers exist
    document.querySelectorAll('.metric-card__sparkline').forEach((container, i) => {
      const dataKey = container.dataset.metric;
      if (historical[dataKey]) {
        Charts.sparkline(container, historical[dataKey].map(d => d.value), {
          color: dataKey === 'delinquency' ? '#ef4444' : '#6366f1'
        });
      }
    });
  }
  
  /**
   * Render data view (Level 2)
   */
  renderDataView() {
    const main = document.getElementById('main');
    const propertyId = State.get('selectedProperty')?.id;
    const dataView = State.get('selectedDataView');
    const property = mockProperties.find(p => p.id === propertyId);
    
    if (!property) {
      main.innerHTML = '<div class="alert alert--danger">Property not found</div>';
      return;
    }
    
    const viewConfig = {
      leases: {
        title: 'Lease Activity',
        icon: '📝',
        getData: () => generateLeaseData(propertyId),
        columns: [
          { key: 'unit', label: 'Unit', width: '80px' },
          { key: 'floorplan', label: 'Floorplan' },
          { key: 'resident', label: 'Resident' },
          { key: 'rent', label: 'Rent', render: (v) => `$${v.toLocaleString()}` },
          { key: 'agent', label: 'Agent' },
          { key: 'source', label: 'Source' },
          { key: 'signDate', label: 'Signed' },
          { key: 'status', label: 'Status', render: (v) => `<span class="badge badge--${v === 'Signed' ? 'success' : v === 'Pending' ? 'warning' : 'danger'}">${v}</span>` }
        ]
      },
      workorders: {
        title: 'Work Orders',
        icon: '🔧',
        getData: () => generateWorkOrderData(propertyId),
        columns: [
          { key: 'unit', label: 'Unit', width: '80px' },
          { key: 'category', label: 'Category' },
          { key: 'priority', label: 'Priority', render: (v) => `<span class="badge badge--${v === 'Emergency' ? 'danger' : v === 'Urgent' ? 'warning' : 'primary'}">${v}</span>` },
          { key: 'tech', label: 'Technician' },
          { key: 'createDate', label: 'Created' },
          { key: 'completedDate', label: 'Completed', render: (v) => v || '—' },
          { key: 'daysToComplete', label: 'Days', render: (v) => v != null ? v : '—' },
          { key: 'status', label: 'Status', render: (v) => `<span class="badge badge--${v === 'Completed' ? 'success' : v === 'Open' ? 'danger' : 'warning'}">${v}</span>` }
        ]
      },
      agents: {
        title: 'Agent Performance',
        icon: '👤',
        getData: () => generateAgentData(propertyId),
        columns: [
          { key: 'name', label: 'Agent' },
          { key: 'leads', label: 'Leads' },
          { key: 'tours', label: 'Tours' },
          { key: 'apps', label: 'Apps' },
          { key: 'leases', label: 'Leases' },
          { key: 'leadToTour', label: 'Lead→Tour', render: (v) => `${v}%` },
          { key: 'closingRatio', label: 'Closing', render: (v) => `${v}%` },
          { key: 'avgResponseMin', label: 'Avg Response', render: (v) => `${v} min` }
        ]
      },
      financials: {
        title: 'Financial Detail',
        icon: '💰',
        getData: () => generateFinancialData(propertyId),
        columns: [
          { key: 'code', label: 'GL Code', width: '80px' },
          { key: 'name', label: 'Category' },
          { key: 'actual', label: 'Actual', render: (v) => `$${v.toLocaleString()}` },
          { key: 'budget', label: 'Budget', render: (v) => `$${v.toLocaleString()}` },
          { key: 'variance', label: 'Variance', render: (v, row) => `<span style="color: ${(row.isExpense ? -v : v) >= 0 ? 'var(--success)' : 'var(--danger)'}">$${Math.abs(v).toLocaleString()}</span>` },
          { key: 'variancePct', label: 'Var %', render: (v, row) => `<span style="color: ${(row.isExpense ? -parseFloat(v) : parseFloat(v)) >= 0 ? 'var(--success)' : 'var(--danger)'}">${v}%</span>` }
        ]
      },
      rentroll: {
        title: 'Rent Roll',
        icon: '🏠',
        getData: () => generateRentRollData(propertyId, property.units),
        columns: [
          { key: 'unit', label: 'Unit', width: '70px' },
          { key: 'floorplan', label: 'Floorplan' },
          { key: 'sqft', label: 'SqFt' },
          { key: 'marketRent', label: 'Market', render: (v) => `$${v.toLocaleString()}` },
          { key: 'effectiveRent', label: 'Effective', render: (v) => v ? `$${v.toLocaleString()}` : '—' },
          { key: 'status', label: 'Status', render: (v) => `<span class="badge badge--${v === 'Occupied' ? 'success' : v === 'Notice' ? 'warning' : v === 'Vacant' ? 'danger' : 'primary'}">${v}</span>` },
          { key: 'resident', label: 'Resident', render: (v) => v || '—' },
          { key: 'leaseEnd', label: 'Lease End', render: (v) => v || '—' }
        ]
      }
    };
    
    const config = viewConfig[dataView];
    if (!config) {
      main.innerHTML = '<div class="alert alert--danger">Unknown data view</div>';
      return;
    }
    
    main.innerHTML = `
      <div class="breadcrumbs">
        <span class="breadcrumbs__item">
          <a href="/" class="breadcrumbs__link" data-route="/">Portfolio</a>
          <span class="breadcrumbs__separator">›</span>
        </span>
        <span class="breadcrumbs__item">
          <a href="/property/${propertyId}" class="breadcrumbs__link" data-route="/property/${propertyId}">${property.name}</a>
          <span class="breadcrumbs__separator">›</span>
        </span>
        <span class="breadcrumbs__current">${config.title}</span>
      </div>
      
      <div class="page-header">
        <div>
          <button class="btn btn--ghost" data-action="back">← Back</button>
          <h1 class="page-header__title">${config.icon} ${config.title}</h1>
          <p class="page-header__subtitle">${property.name}</p>
        </div>
      </div>
      
      <div id="data-table-container"></div>
    `;
    
    // Initialize data table
    const tableContainer = document.getElementById('data-table-container');
    new DataTable(tableContainer, {
      columns: config.columns,
      data: config.getData(),
      pageSize: 15
    });
  }
  
  /**
   * Add drill-down links to property view
   */
  getDrillDownLinks(propertyId) {
    return `
      <div class="section">
        <div class="section__header">
          <h2 class="section__title">📊 Drill-Down Data</h2>
        </div>
        <div class="grid grid--3">
          <div class="card card--clickable" data-route="/property/${propertyId}/leases">
            <div class="card__body" style="text-align: center; padding: var(--space-6);">
              <div style="font-size: 2rem; margin-bottom: var(--space-2);">📝</div>
              <div style="font-weight: var(--font-semibold);">Lease Activity</div>
              <div style="font-size: var(--text-sm); color: var(--text-muted);">View all leases</div>
            </div>
          </div>
          <div class="card card--clickable" data-route="/property/${propertyId}/workorders">
            <div class="card__body" style="text-align: center; padding: var(--space-6);">
              <div style="font-size: 2rem; margin-bottom: var(--space-2);">🔧</div>
              <div style="font-weight: var(--font-semibold);">Work Orders</div>
              <div style="font-size: var(--text-sm); color: var(--text-muted);">Maintenance requests</div>
            </div>
          </div>
          <div class="card card--clickable" data-route="/property/${propertyId}/agents">
            <div class="card__body" style="text-align: center; padding: var(--space-6);">
              <div style="font-size: 2rem; margin-bottom: var(--space-2);">👤</div>
              <div style="font-weight: var(--font-semibold);">Agent Performance</div>
              <div style="font-size: var(--text-sm); color: var(--text-muted);">Leasing team stats</div>
            </div>
          </div>
          <div class="card card--clickable" data-route="/property/${propertyId}/financials">
            <div class="card__body" style="text-align: center; padding: var(--space-6);">
              <div style="font-size: 2rem; margin-bottom: var(--space-2);">💰</div>
              <div style="font-weight: var(--font-semibold);">Financials</div>
              <div style="font-size: var(--text-sm); color: var(--text-muted);">Budget vs Actual</div>
            </div>
          </div>
          <div class="card card--clickable" data-route="/property/${propertyId}/rentroll">
            <div class="card__body" style="text-align: center; padding: var(--space-6);">
              <div style="font-size: 2rem; margin-bottom: var(--space-2);">🏠</div>
              <div style="font-weight: var(--font-semibold);">Rent Roll</div>
              <div style="font-size: var(--text-sm); color: var(--text-muted);">Unit-by-unit detail</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get filtered properties based on current filters
   */
  getFilteredProperties() {
    const filters = State.get('filters');
    let properties = mockProperties;
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      properties = properties.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.address.city.toLowerCase().includes(search)
      );
    }
    
    if (filters.region) {
      properties = properties.filter(p => p.region === filters.region);
    }
    
    if (filters.assetType) {
      properties = properties.filter(p => p.type === filters.assetType);
    }
    
    return properties;
  }
  
  /**
   * Get average metric across properties
   */
  getAvgMetric(properties, category, metric) {
    const values = properties
      .map(p => p.metrics?.[category]?.[metric])
      .filter(v => v != null);
    
    if (values.length === 0) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  
  /**
   * Get metric color class
   */
  getMetricColor(value, metric, assetType, inverse = false) {
    const { getScoreColor } = require('./utils/scoring.js');
    return getScoreColor(value, metric, assetType);
  }
}

// Initialize app on DOM ready
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());

export default app;

/**
 * Dashboard Configuration Component - Portfolio Scorecard v2
 * Customizable chart layout with drag-drop, hide/show, and role-based defaults
 */

const DASHBOARD_STORAGE_KEY = 'portfolio_scorecard_dashboard_config';

// All available drill-down charts
export const AVAILABLE_CHARTS = {
  // Row 1: Occupancy & Rent
  physOcc: { id: 'physOcc', label: 'Physical Occupancy', category: 'Occupancy', default: true },
  leased: { id: 'leased', label: 'Leased Occupancy', category: 'Occupancy', default: true },
  avgRent: { id: 'avgRent', label: 'Avg Effective Rent', category: 'Occupancy', default: true },
  tradeOut: { id: 'tradeOut', label: 'Trade-Out', category: 'Occupancy', default: true },
  
  // Row 2: Conversion
  leadToTour: { id: 'leadToTour', label: 'Lead-to-Tour', category: 'Conversion', default: true },
  closingRatio: { id: 'closingRatio', label: 'Tour-to-Lease', category: 'Conversion', default: true },
  renewalRatio: { id: 'renewalRatio', label: 'Renewal Ratio', category: 'Conversion', default: true },
  delinq: { id: 'delinq', label: 'Delinquency', category: 'Conversion', default: true },
  
  // Row 3: Reputation
  googleStars: { id: 'googleStars', label: 'Google Rating', category: 'Reputation', default: true },
  tali: { id: 'tali', label: 'Satisfaction (TALi)', category: 'Reputation', default: true },
  propIndex: { id: 'propIndex', label: 'ORA Score', category: 'Reputation', default: true },
  training: { id: 'training', label: 'Training', category: 'Reputation', default: true },
  
  // Row 4: Operations
  noiVariance: { id: 'noiVariance', label: 'NOI vs Budget', category: 'Operations', default: true },
  woSla: { id: 'woSla', label: 'Maintenance On-Time', category: 'Operations', default: true },
  
  // Row 5: Move Activity
  moveActivity: { id: 'moveActivity', label: 'New Lease vs Move-out', category: 'Move Activity', default: true },
  moveOutReasons: { id: 'moveOutReasons', label: 'Move-out Reasons', category: 'Move Activity', default: true }
};

// Role-based default configurations
export const ROLE_DEFAULTS = {
  executive: {
    name: 'Executive View',
    layout: ['physOcc', 'leased', 'delinq', 'noiVariance', 'woSla', 'moveActivity', 'moveOutReasons'],
    hidden: ['avgRent', 'tradeOut', 'leadToTour', 'closingRatio', 'renewalRatio', 'googleStars', 'tali', 'propIndex', 'training']
  },
  regional: {
    name: 'Regional Manager View',
    layout: ['physOcc', 'leased', 'avgRent', 'tradeOut', 'leadToTour', 'closingRatio', 'renewalRatio', 'delinq', 'woSla', 'moveActivity', 'moveOutReasons'],
    hidden: ['googleStars', 'tali', 'propIndex', 'training', 'noiVariance']
  },
  property: {
    name: 'Property Manager View',
    layout: Object.keys(AVAILABLE_CHARTS), // All charts
    hidden: []
  },
  custom: {
    name: 'Custom',
    layout: Object.keys(AVAILABLE_CHARTS),
    hidden: []
  }
};

/**
 * Dashboard Configuration Manager
 */
export class DashboardConfig {
  constructor() {
    this.config = this.load();
    this.draggedItem = null;
  }
  
  /**
   * Load config from localStorage
   */
  load() {
    try {
      const data = localStorage.getItem(DASHBOARD_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load dashboard config:', e);
    }
    
    // Default config
    return {
      role: 'property',
      layout: Object.keys(AVAILABLE_CHARTS),
      hidden: []
    };
  }
  
  /**
   * Save config to localStorage
   */
  save() {
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save dashboard config:', e);
    }
  }
  
  /**
   * Get current layout (ordered chart IDs)
   */
  getLayout() {
    return this.config.layout || Object.keys(AVAILABLE_CHARTS);
  }
  
  /**
   * Get hidden charts
   */
  getHidden() {
    return this.config.hidden || [];
  }
  
  /**
   * Check if a chart is visible
   */
  isVisible(chartId) {
    return !this.config.hidden.includes(chartId);
  }
  
  /**
   * Hide a chart (move to library)
   */
  hideChart(chartId) {
    if (!this.config.hidden.includes(chartId)) {
      this.config.hidden.push(chartId);
      this.config.layout = this.config.layout.filter(id => id !== chartId);
      this.config.role = 'custom';
      this.save();
    }
  }
  
  /**
   * Show a chart (restore from library)
   */
  showChart(chartId) {
    if (this.config.hidden.includes(chartId)) {
      this.config.hidden = this.config.hidden.filter(id => id !== chartId);
      this.config.layout.push(chartId);
      this.config.role = 'custom';
      this.save();
    }
  }
  
  /**
   * Reorder charts
   */
  reorder(fromIndex, toIndex) {
    const layout = [...this.config.layout];
    const [moved] = layout.splice(fromIndex, 1);
    layout.splice(toIndex, 0, moved);
    this.config.layout = layout;
    this.config.role = 'custom';
    this.save();
  }
  
  /**
   * Move chart to specific position
   */
  moveChart(chartId, toIndex) {
    const fromIndex = this.config.layout.indexOf(chartId);
    if (fromIndex === -1) return;
    this.reorder(fromIndex, toIndex);
  }
  
  /**
   * Apply a role preset
   */
  applyRole(roleName) {
    const preset = ROLE_DEFAULTS[roleName];
    if (!preset) return;
    
    this.config.role = roleName;
    this.config.layout = [...preset.layout];
    this.config.hidden = [...preset.hidden];
    this.save();
  }
  
  /**
   * Reset to default (all charts visible)
   */
  reset() {
    this.config = {
      role: 'property',
      layout: Object.keys(AVAILABLE_CHARTS),
      hidden: []
    };
    this.save();
  }
}

// Singleton instance
let dashboardConfigInstance = null;

export function getDashboardConfig() {
  if (!dashboardConfigInstance) {
    dashboardConfigInstance = new DashboardConfig();
  }
  return dashboardConfigInstance;
}

/**
 * Render the chart library sidebar
 */
export function renderChartLibrary(config) {
  const hidden = config.getHidden();
  
  if (hidden.length === 0) {
    return '';
  }
  
  // Group by category
  const byCategory = {};
  hidden.forEach(chartId => {
    const chart = AVAILABLE_CHARTS[chartId];
    if (chart) {
      if (!byCategory[chart.category]) {
        byCategory[chart.category] = [];
      }
      byCategory[chart.category].push(chart);
    }
  });
  
  return `
    <div class="chart-library">
      <div class="chart-library__header">
        <h4>📚 Chart Library</h4>
        <span class="chart-library__count">${hidden.length} hidden</span>
      </div>
      <div class="chart-library__body">
        ${Object.entries(byCategory).map(([category, charts]) => `
          <div class="chart-library__category">
            <div class="chart-library__category-name">${category}</div>
            ${charts.map(chart => `
              <div class="chart-library__item" data-chart-id="${chart.id}">
                <span class="chart-library__item-name">${chart.label}</span>
                <button class="chart-library__add-btn" data-action="show-chart" data-chart="${chart.id}" title="Add to dashboard">+</button>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render the customize toolbar
 */
export function renderCustomizeToolbar(config, isEditMode = false) {
  const currentRole = config.config.role;
  
  return `
    <div class="customize-toolbar ${isEditMode ? 'customize-toolbar--active' : ''}">
      <div class="customize-toolbar__left">
        <button class="btn btn--sm ${isEditMode ? 'btn--primary' : 'btn--secondary'}" data-action="toggle-edit-mode">
          ${isEditMode ? '✓ Done' : '⚙️ Customize'}
        </button>
        ${isEditMode ? `
          <select class="role-select" data-action="change-role">
            ${Object.entries(ROLE_DEFAULTS).map(([key, preset]) => `
              <option value="${key}" ${currentRole === key ? 'selected' : ''}>${preset.name}</option>
            `).join('')}
          </select>
          <button class="btn btn--sm btn--ghost" data-action="reset-layout" title="Reset to default">↺ Reset</button>
        ` : ''}
      </div>
      ${isEditMode ? `
        <div class="customize-toolbar__hint">
          Drag charts to reorder • Click ✕ to hide
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Initialize drag-drop handlers
 */
export function initDragDrop(container, config, onReorder) {
  const cards = container.querySelectorAll('.drill-card[draggable="true"]');
  
  cards.forEach((card, index) => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
      card.classList.add('dragging');
      
      // Create ghost image
      const ghost = card.cloneNode(true);
      ghost.style.opacity = '0.5';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => ghost.remove(), 0);
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      container.querySelectorAll('.drill-card').forEach(c => c.classList.remove('drag-over'));
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });
    
    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });
    
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIndex = index;
      
      if (fromIndex !== toIndex) {
        config.reorder(fromIndex, toIndex);
        if (onReorder) onReorder();
      }
      
      card.classList.remove('drag-over');
    });
  });
}

export default {
  AVAILABLE_CHARTS,
  ROLE_DEFAULTS,
  DashboardConfig,
  getDashboardConfig,
  renderChartLibrary,
  renderCustomizeToolbar,
  initDragDrop
};

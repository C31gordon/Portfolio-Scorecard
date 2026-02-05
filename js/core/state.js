/**
 * State Management - Portfolio Scorecard v2
 * Simple reactive state store
 */

export const State = {
  // Current state
  _state: {
    theme: 'dark',
    currentView: 'portfolio', // 'portfolio' | 'property' | 'data'
    selectedProperty: null,
    selectedDataView: null,
    dateRange: 'mtd', // 'wtd' | 'mtd' | 'qtd' | 'ytd' | 'custom'
    customDateStart: null,
    customDateEnd: null,
    showYoY: false,
    filters: {
      region: null,
      assetType: null,
      search: ''
    },
    portfolio: null,
    properties: [],
    submarkets: [],
    isLoading: false,
    error: null
  },
  
  // Subscribers
  _listeners: new Map(),
  
  /**
   * Get current state or specific key
   */
  get(key = null) {
    if (key) {
      return this._state[key];
    }
    return { ...this._state };
  },
  
  /**
   * Set state (partial update)
   */
  set(updates) {
    const prevState = { ...this._state };
    
    // Apply updates
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
        // Deep merge for objects
        this._state[key] = { ...this._state[key], ...updates[key] };
      } else {
        this._state[key] = updates[key];
      }
    });
    
    // Notify listeners
    this._notify(prevState, this._state);
  },
  
  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this._listeners.get(key).delete(callback);
    };
  },
  
  /**
   * Subscribe to any state change
   */
  subscribeAll(callback) {
    return this.subscribe('*', callback);
  },
  
  /**
   * Notify listeners of changes
   */
  _notify(prevState, newState) {
    // Find changed keys
    const changedKeys = Object.keys(newState).filter(
      key => JSON.stringify(prevState[key]) !== JSON.stringify(newState[key])
    );
    
    // Notify specific key listeners
    changedKeys.forEach(key => {
      if (this._listeners.has(key)) {
        this._listeners.get(key).forEach(callback => {
          callback(newState[key], prevState[key]);
        });
      }
    });
    
    // Notify global listeners
    if (changedKeys.length > 0 && this._listeners.has('*')) {
      this._listeners.get('*').forEach(callback => {
        callback(newState, prevState, changedKeys);
      });
    }
  },
  
  /**
   * Reset state to defaults
   */
  reset() {
    this.set({
      currentView: 'portfolio',
      selectedProperty: null,
      selectedDataView: null,
      filters: {
        region: null,
        assetType: null,
        search: ''
      },
      error: null
    });
  }
};

// Initialize from localStorage
const savedTheme = localStorage.getItem('scorecard_theme');
if (savedTheme) {
  State.set({ theme: savedTheme });
}

// Persist theme changes
State.subscribe('theme', (theme) => {
  localStorage.setItem('scorecard_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
});

export default State;

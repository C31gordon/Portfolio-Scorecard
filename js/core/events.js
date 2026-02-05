/**
 * Events - Portfolio Scorecard v2
 * Custom event bus for component communication
 */

export const Events = {
  _handlers: new Map(),
  
  /**
   * Subscribe to an event
   */
  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event).add(handler);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  },
  
  /**
   * Subscribe to an event (one time only)
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  },
  
  /**
   * Unsubscribe from an event
   */
  off(event, handler) {
    if (this._handlers.has(event)) {
      this._handlers.get(event).delete(handler);
    }
  },
  
  /**
   * Emit an event
   */
  emit(event, data = null) {
    if (this._handlers.has(event)) {
      this._handlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  },
  
  /**
   * Clear all handlers for an event
   */
  clear(event) {
    if (event) {
      this._handlers.delete(event);
    } else {
      this._handlers.clear();
    }
  }
};

// Pre-defined event names
export const EVENT = {
  // Data events
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
  DATA_REFRESH: 'data:refresh',
  
  // Navigation events
  NAVIGATE: 'navigate',
  VIEW_CHANGED: 'view:changed',
  
  // Property events
  PROPERTY_SELECTED: 'property:selected',
  PROPERTY_UPDATED: 'property:updated',
  
  // Filter events
  FILTER_CHANGED: 'filter:changed',
  SEARCH_CHANGED: 'search:changed',
  DATE_RANGE_CHANGED: 'dateRange:changed',
  
  // Chart events
  CHART_CLICKED: 'chart:clicked',
  CHART_HOVER: 'chart:hover',
  
  // Report events
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',
  REPORT_EMAIL: 'report:email',
  
  // UI events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  TOAST_SHOW: 'toast:show',
  THEME_CHANGED: 'theme:changed',
  
  // AI events
  AI_QUERY: 'ai:query',
  AI_RESPONSE: 'ai:response',
  
  // Integration events
  WEBHOOK_RECEIVED: 'webhook:received',
  SYNC_STARTED: 'sync:started',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_ERROR: 'sync:error'
};

export default Events;

/**
 * Router - Portfolio Scorecard v2
 * Simple client-side routing
 */

import State from './state.js';

export const Router = {
  routes: {
    '/': { view: 'portfolio', title: 'Portfolio Dashboard' },
    '/property/:id': { view: 'property', title: 'Property Detail' },
    '/property/:id/:dataView': { view: 'data', title: 'Data View' }
  },
  
  /**
   * Initialize router
   */
  init() {
    // Handle browser back/forward
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Handle initial route
    this.handleRoute();
    
    // Handle link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        this.navigate(link.dataset.route);
      }
    });
    
    // Handle escape key to go back
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.back();
      }
    });
  },
  
  /**
   * Navigate to a route
   */
  navigate(path, replace = false) {
    if (replace) {
      history.replaceState(null, '', path);
    } else {
      history.pushState(null, '', path);
    }
    this.handleRoute();
  },
  
  /**
   * Go back one level
   */
  back() {
    const currentView = State.get('currentView');
    
    if (currentView === 'data') {
      const propertyId = State.get('selectedProperty')?.id;
      if (propertyId) {
        this.navigate(`/property/${propertyId}`);
      } else {
        this.navigate('/');
      }
    } else if (currentView === 'property') {
      this.navigate('/');
    }
  },
  
  /**
   * Handle current route
   */
  handleRoute() {
    const path = window.location.pathname;
    const params = this.parseRoute(path);
    
    if (params) {
      const { route, matches } = params;
      
      switch (route.view) {
        case 'portfolio':
          State.set({
            currentView: 'portfolio',
            selectedProperty: null,
            selectedDataView: null
          });
          break;
          
        case 'property':
          State.set({
            currentView: 'property',
            selectedProperty: { id: matches.id },
            selectedDataView: null
          });
          break;
          
        case 'data':
          State.set({
            currentView: 'data',
            selectedProperty: { id: matches.id },
            selectedDataView: matches.dataView
          });
          break;
      }
      
      // Update page title
      document.title = `${route.title} | Portfolio Scorecard`;
    } else {
      // 404 - redirect to home
      this.navigate('/', true);
    }
  },
  
  /**
   * Parse route and extract parameters
   */
  parseRoute(path) {
    for (const [pattern, route] of Object.entries(this.routes)) {
      const matches = this.matchRoute(pattern, path);
      if (matches) {
        return { route, matches };
      }
    }
    return null;
  },
  
  /**
   * Match a route pattern against a path
   */
  matchRoute(pattern, path) {
    // Convert pattern to regex
    const paramNames = [];
    const regexPattern = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    
    const regex = new RegExp(`^${regexPattern}$`);
    const match = path.match(regex);
    
    if (match) {
      const matches = {};
      paramNames.forEach((name, i) => {
        matches[name] = match[i + 1];
      });
      return matches;
    }
    
    return null;
  },
  
  /**
   * Get current route info
   */
  getCurrentRoute() {
    const path = window.location.pathname;
    return this.parseRoute(path);
  },
  
  /**
   * Build path with parameters
   */
  buildPath(pattern, params = {}) {
    let path = pattern;
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
    return path;
  }
};

export default Router;

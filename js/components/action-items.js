/**
 * Action Items Component - Portfolio Scorecard v2
 * Track actions per property with assignee, due date, priority, status
 */

const ACTION_STORAGE_KEY = 'portfolio_scorecard_actions';

// Mock assignees (will come from real data later)
const ASSIGNEES = [
  'Ashley Browne',
  'Brandon Miles', 
  'Christina Lee',
  'David Park',
  'Elena Rodriguez',
  'Courtney Gordon'
];

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['open', 'in_progress', 'complete'];

/**
 * Action Items Manager
 */
export class ActionItems {
  constructor() {
    this.items = this.load();
  }
  
  /**
   * Load action items from localStorage
   */
  load() {
    try {
      const data = localStorage.getItem(ACTION_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load action items:', e);
      return [];
    }
  }
  
  /**
   * Save action items to localStorage
   */
  save() {
    try {
      localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Failed to save action items:', e);
    }
  }
  
  /**
   * Generate unique ID
   */
  generateId() {
    return 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Add a new action item
   */
  add(item) {
    const newItem = {
      id: this.generateId(),
      propertyId: item.propertyId,
      metric: item.metric || null,
      title: item.title,
      description: item.description || '',
      assignee: item.assignee || '',
      dueDate: item.dueDate || null,
      status: 'open',
      priority: item.priority || 'medium',
      createdAt: new Date().toISOString(),
      completedAt: null,
      createdBy: 'Courtney Gordon' // Will be dynamic later
    };
    
    this.items.push(newItem);
    this.save();
    return newItem;
  }
  
  /**
   * Update an action item
   */
  update(id, updates) {
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    // Track completion
    if (updates.status === 'complete' && this.items[index].status !== 'complete') {
      updates.completedAt = new Date().toISOString();
    } else if (updates.status && updates.status !== 'complete') {
      updates.completedAt = null;
    }
    
    this.items[index] = { ...this.items[index], ...updates };
    this.save();
    return this.items[index];
  }
  
  /**
   * Delete an action item
   */
  delete(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  }
  
  /**
   * Get action items for a property
   */
  getByProperty(propertyId, options = {}) {
    let items = this.items.filter(i => i.propertyId === propertyId);
    
    // Filter by status
    if (options.status) {
      items = items.filter(i => i.status === options.status);
    }
    
    // Filter by metric
    if (options.metric) {
      items = items.filter(i => i.metric === options.metric);
    }
    
    // Filter open/incomplete only
    if (options.openOnly) {
      items = items.filter(i => i.status !== 'complete');
    }
    
    // Sort
    items.sort((a, b) => {
      // Priority first (high > medium > low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      // Then by created date
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return items;
  }
  
  /**
   * Get count of open items for a property
   */
  getOpenCount(propertyId) {
    return this.items.filter(i => i.propertyId === propertyId && i.status !== 'complete').length;
  }
  
  /**
   * Get all overdue items
   */
  getOverdue() {
    const now = new Date();
    return this.items.filter(i => {
      if (i.status === 'complete') return false;
      if (!i.dueDate) return false;
      return new Date(i.dueDate) < now;
    });
  }
  
  /**
   * Get portfolio summary
   */
  getSummary() {
    const open = this.items.filter(i => i.status === 'open').length;
    const inProgress = this.items.filter(i => i.status === 'in_progress').length;
    const complete = this.items.filter(i => i.status === 'complete').length;
    const overdue = this.getOverdue().length;
    const highPriority = this.items.filter(i => i.priority === 'high' && i.status !== 'complete').length;
    
    return { open, inProgress, complete, overdue, highPriority, total: this.items.length };
  }
}

/**
 * Format date for display
 */
export function formatActionDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `<span class="overdue">${Math.abs(diffDays)}d overdue</span>`;
  } else if (diffDays === 0) {
    return '<span class="due-today">Due today</span>';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays}d`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Render action item card
 */
export function renderActionItem(item, options = {}) {
  const priorityClass = `priority--${item.priority}`;
  const statusClass = `status--${item.status}`;
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'complete';
  
  // Status display with icon and text
  const statusDisplay = {
    'open': { icon: '○', text: 'Open', class: 'status--open' },
    'in_progress': { icon: '◐', text: 'In Progress', class: 'status--in-progress' },
    'complete': { icon: '✓', text: 'Completed', class: 'status--complete' }
  };
  const status = statusDisplay[item.status] || statusDisplay['open'];
  
  return `
    <div class="action-item ${statusClass} ${priorityClass} ${isOverdue ? 'action-item--overdue' : ''}" data-action-id="${item.id}">
      <div class="action-item__header">
        <button class="action-item__status-toggle ${status.class}" data-action="toggle-status" title="Click to change status">
          <span class="status-icon">${status.icon}</span>
          <span class="status-text">${status.text}</span>
        </button>
        <span class="action-item__title">${item.title}</span>
        <span class="action-item__priority" title="${item.priority} priority">${item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢'}</span>
      </div>
      ${item.description ? `<div class="action-item__desc">${item.description}</div>` : ''}
      <div class="action-item__meta">
        ${item.assignee ? `<span class="action-item__assignee">👤 ${item.assignee}</span>` : ''}
        ${item.dueDate ? `<span class="action-item__due">${formatActionDate(item.dueDate)}</span>` : ''}
        ${item.metric ? `<span class="action-item__metric">${item.metric}</span>` : ''}
      </div>
      <div class="action-item__actions">
        <button class="action-item__btn" data-action="edit" title="Edit">✏️</button>
        <button class="action-item__btn" data-action="delete" title="Delete">🗑️</button>
      </div>
    </div>
  `;
}

/**
 * Render action items list for a property
 */
export function renderActionItemsList(propertyId, actionItems, options = {}) {
  const items = actionItems.getByProperty(propertyId, options);
  const openCount = actionItems.getOpenCount(propertyId);
  
  if (items.length === 0 && !options.showEmpty) {
    return `
      <div class="action-items-empty">
        <p>No action items</p>
        <button class="btn btn--sm btn--primary" data-action="add-action" data-property="${propertyId}">
          + Add Action Item
        </button>
      </div>
    `;
  }
  
  return `
    <div class="action-items-list">
      <div class="action-items-header">
        <span class="action-items-title">Action Items ${openCount > 0 ? `<span class="action-items-badge">${openCount}</span>` : ''}</span>
        <button class="btn btn--sm btn--primary" data-action="add-action" data-property="${propertyId}">+ Add</button>
      </div>
      <div class="action-items-filters">
        <button class="filter-btn ${!options.openOnly ? 'filter-btn--active' : ''}" data-filter="all">All</button>
        <button class="filter-btn ${options.openOnly ? 'filter-btn--active' : ''}" data-filter="open">Open</button>
      </div>
      <div class="action-items-body">
        ${items.map(item => renderActionItem(item, options)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render add/edit action item form
 */
export function renderActionForm(propertyId, existingItem = null, metricOptions = []) {
  const isEdit = !!existingItem;
  
  return `
    <div class="action-form-overlay" data-action="close-form">
      <div class="action-form" onclick="event.stopPropagation()">
        <div class="action-form__header">
          <h3>${isEdit ? 'Edit' : 'Add'} Action Item</h3>
          <button class="action-form__close" data-action="close-form">×</button>
        </div>
        <form class="action-form__body" data-action="save-action" data-property="${propertyId}" ${isEdit ? `data-id="${existingItem.id}"` : ''}>
          <div class="form-group">
            <label>Title *</label>
            <input type="text" name="title" required value="${existingItem?.title || ''}" placeholder="e.g., Follow up on Unit 205 delinquency">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" rows="2" placeholder="Additional details...">${existingItem?.description || ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Assignee</label>
              <select name="assignee">
                <option value="">Unassigned</option>
                ${ASSIGNEES.map(a => `<option value="${a}" ${existingItem?.assignee === a ? 'selected' : ''}>${a}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input type="date" name="dueDate" value="${existingItem?.dueDate?.split('T')[0] || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Priority</label>
              <select name="priority">
                ${PRIORITIES.map(p => `<option value="${p}" ${(existingItem?.priority || 'medium') === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Related Metric</label>
              <select name="metric">
                <option value="">None</option>
                ${metricOptions.map(m => `<option value="${m.key}" ${existingItem?.metric === m.key ? 'selected' : ''}>${m.label}</option>`).join('')}
              </select>
            </div>
          </div>
          ${isEdit ? `
            <div class="form-group">
              <label>Status</label>
              <select name="status">
                ${STATUSES.map(s => `<option value="${s}" ${existingItem?.status === s ? 'selected' : ''}>${s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</option>`).join('')}
              </select>
            </div>
          ` : ''}
          <div class="form-actions">
            <button type="button" class="btn btn--secondary" data-action="close-form">Cancel</button>
            <button type="submit" class="btn btn--primary">${isEdit ? 'Save Changes' : 'Add Action'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * Initialize action items singleton
 */
let actionItemsInstance = null;

export function getActionItems() {
  if (!actionItemsInstance) {
    actionItemsInstance = new ActionItems();
  }
  return actionItemsInstance;
}

export default {
  ActionItems,
  getActionItems,
  renderActionItem,
  renderActionItemsList,
  renderActionForm,
  formatActionDate,
  ASSIGNEES,
  PRIORITIES,
  STATUSES
};

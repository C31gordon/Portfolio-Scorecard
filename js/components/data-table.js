/**
 * Data Table Component - Portfolio Scorecard v2
 * Sortable, filterable, exportable data tables
 */

export class DataTable {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      columns: [],
      data: [],
      sortable: true,
      filterable: true,
      exportable: true,
      pageSize: 20,
      ...options
    };
    
    this.currentSort = { column: null, direction: 'asc' };
    this.currentPage = 1;
    this.filterValue = '';
    
    this.render();
  }
  
  /**
   * Set data and re-render
   */
  setData(data) {
    this.options.data = data;
    this.currentPage = 1;
    this.render();
  }
  
  /**
   * Get filtered and sorted data
   */
  getProcessedData() {
    let data = [...this.options.data];
    
    // Filter
    if (this.filterValue) {
      const search = this.filterValue.toLowerCase();
      data = data.filter(row => {
        return this.options.columns.some(col => {
          const value = this.getCellValue(row, col);
          return String(value).toLowerCase().includes(search);
        });
      });
    }
    
    // Sort
    if (this.currentSort.column) {
      const col = this.options.columns.find(c => c.key === this.currentSort.column);
      data.sort((a, b) => {
        let aVal = this.getCellValue(a, col);
        let bVal = this.getCellValue(b, col);
        
        // Handle numbers
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return this.currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // Handle strings
        aVal = String(aVal || '');
        bVal = String(bVal || '');
        const cmp = aVal.localeCompare(bVal);
        return this.currentSort.direction === 'asc' ? cmp : -cmp;
      });
    }
    
    return data;
  }
  
  /**
   * Get paginated data
   */
  getPaginatedData() {
    const data = this.getProcessedData();
    const start = (this.currentPage - 1) * this.options.pageSize;
    const end = start + this.options.pageSize;
    return {
      data: data.slice(start, end),
      total: data.length,
      totalPages: Math.ceil(data.length / this.options.pageSize)
    };
  }
  
  /**
   * Get cell value from row
   */
  getCellValue(row, col) {
    if (col.accessor) {
      return col.accessor(row);
    }
    return row[col.key];
  }
  
  /**
   * Format cell value
   */
  formatCell(value, col, row) {
    if (col.render) {
      return col.render(value, row);
    }
    if (value == null) return '—';
    return String(value);
  }
  
  /**
   * Sort by column
   */
  sortBy(columnKey) {
    if (this.currentSort.column === columnKey) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = columnKey;
      this.currentSort.direction = 'asc';
    }
    this.render();
  }
  
  /**
   * Filter data
   */
  filter(value) {
    this.filterValue = value;
    this.currentPage = 1;
    this.render();
  }
  
  /**
   * Go to page
   */
  goToPage(page) {
    const { totalPages } = this.getPaginatedData();
    this.currentPage = Math.max(1, Math.min(page, totalPages));
    this.render();
  }
  
  /**
   * Export to CSV
   */
  exportCSV(filename = 'export.csv') {
    const data = this.getProcessedData();
    const headers = this.options.columns.map(col => col.label || col.key);
    
    const rows = data.map(row => {
      return this.options.columns.map(col => {
        let value = this.getCellValue(row, col);
        if (value == null) return '';
        value = String(value).replace(/"/g, '""');
        return `"${value}"`;
      }).join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * Render the table
   */
  render() {
    const { data, total, totalPages } = this.getPaginatedData();
    
    this.container.innerHTML = `
      <div class="data-table-wrapper">
        ${this.options.filterable || this.options.exportable ? `
          <div class="data-table-toolbar">
            ${this.options.filterable ? `
              <input type="text" 
                class="input data-table-search" 
                placeholder="Search..." 
                value="${this.filterValue}"
              >
            ` : ''}
            <div class="data-table-toolbar__actions">
              <span class="data-table-count">${total} records</span>
              ${this.options.exportable ? `
                <button class="btn btn--secondary btn--sm data-table-export">
                  📥 Export CSV
                </button>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="data-table-container">
          <table class="data-table ${this.options.sortable ? 'data-table--sortable' : ''}">
            <thead>
              <tr>
                ${this.options.columns.map(col => `
                  <th data-column="${col.key}" ${col.width ? `style="width: ${col.width}"` : ''}>
                    <div class="data-table-header">
                      <span>${col.label || col.key}</span>
                      ${this.options.sortable ? `
                        <span class="data-table-sort">
                          ${this.currentSort.column === col.key 
                            ? (this.currentSort.direction === 'asc' ? '↑' : '↓')
                            : '↕'}
                        </span>
                      ` : ''}
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.length === 0 ? `
                <tr>
                  <td colspan="${this.options.columns.length}" class="data-table-empty">
                    No data found
                  </td>
                </tr>
              ` : data.map(row => `
                <tr data-row-id="${row.id || ''}">
                  ${this.options.columns.map(col => `
                    <td>${this.formatCell(this.getCellValue(row, col), col, row)}</td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${totalPages > 1 ? `
          <div class="data-table-pagination">
            <button class="btn btn--ghost btn--sm" ${this.currentPage === 1 ? 'disabled' : ''} data-page="prev">
              ← Prev
            </button>
            <span class="data-table-page-info">
              Page ${this.currentPage} of ${totalPages}
            </span>
            <button class="btn btn--ghost btn--sm" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="next">
              Next →
            </button>
          </div>
        ` : ''}
      </div>
    `;
    
    this.attachEventListeners();
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Sort
    if (this.options.sortable) {
      this.container.querySelectorAll('th[data-column]').forEach(th => {
        th.addEventListener('click', () => {
          this.sortBy(th.dataset.column);
        });
      });
    }
    
    // Filter
    const searchInput = this.container.querySelector('.data-table-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filter(e.target.value);
      });
    }
    
    // Export
    const exportBtn = this.container.querySelector('.data-table-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportCSV();
      });
    }
    
    // Pagination
    this.container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.page === 'prev') {
          this.goToPage(this.currentPage - 1);
        } else if (btn.dataset.page === 'next') {
          this.goToPage(this.currentPage + 1);
        }
      });
    });
    
    // Row click
    if (this.options.onRowClick) {
      this.container.querySelectorAll('tbody tr[data-row-id]').forEach(tr => {
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', () => {
          const rowId = tr.dataset.rowId;
          const row = this.options.data.find(r => String(r.id) === rowId);
          if (row) this.options.onRowClick(row);
        });
      });
    }
  }
}

// Additional CSS for data table
const style = document.createElement('style');
style.textContent = `
  .data-table-wrapper {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }
  
  .data-table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-primary);
    gap: var(--space-4);
  }
  
  .data-table-search {
    max-width: 300px;
  }
  
  .data-table-toolbar__actions {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  
  .data-table-count {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  
  .data-table-container {
    overflow-x: auto;
  }
  
  .data-table-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .data-table-sort {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
  
  .data-table--sortable th:hover .data-table-sort {
    color: var(--text-primary);
  }
  
  .data-table-empty {
    text-align: center;
    padding: var(--space-8) !important;
    color: var(--text-muted);
  }
  
  .data-table-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-4);
    border-top: 1px solid var(--border-primary);
  }
  
  .data-table-page-info {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }
`;
document.head.appendChild(style);

export default DataTable;

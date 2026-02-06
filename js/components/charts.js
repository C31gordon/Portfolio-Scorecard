/**
 * Charts Component - Portfolio Scorecard v2
 * Lightweight chart rendering using Canvas API
 */

export class Charts {
  static colors = {
    primary: '#6366f1',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
    gray: '#6b7280',
    grid: 'rgba(255, 255, 255, 0.1)'
  };
  
  // Shared tooltip element
  static tooltip = null;
  
  static getTooltip() {
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'chart-tooltip';
      this.tooltip.style.cssText = `
        position: fixed;
        background: var(--bg-secondary, #1a1f2a);
        border: 1px solid var(--border-primary, #2a3040);
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 11px;
        font-family: 'JetBrains Mono', monospace;
        color: var(--text-primary, #e8eaf0);
        pointer-events: none;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.15s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(this.tooltip);
    }
    return this.tooltip;
  }
  
  static showTooltip(x, y, html) {
    const tip = this.getTooltip();
    tip.innerHTML = html;
    tip.style.left = `${x + 12}px`;
    tip.style.top = `${y - 10}px`;
    tip.style.opacity = '1';
  }
  
  static hideTooltip() {
    const tip = this.getTooltip();
    tip.style.opacity = '0';
  }
  
  /**
   * Create a sparkline chart (supports YoY comparison + hover tooltips)
   * @param {HTMLElement} container
   * @param {number[]} data - Current period data
   * @param {object} options - { color, height, fill, priorData, priorColor, showYoY, labels, metric }
   */
  static sparkline(container, data, options = {}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const width = options.width || container.offsetWidth || 100;
    const height = options.height || 40;
    const color = options.color || this.colors.primary;
    const fill = options.fill !== false;
    const priorData = options.priorData || null;
    const priorColor = options.priorColor || '#6b7280';
    const showYoY = options.showYoY && priorData && priorData.length > 0;
    const labels = options.labels || null; // Week labels for tooltip
    const metric = options.metric || ''; // Metric name for formatting
    
    canvas.width = width * 2; // Retina
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.cursor = 'crosshair';
    ctx.scale(2, 2);
    
    if (!data || data.length === 0) {
      container.appendChild(canvas);
      return canvas;
    }
    
    // Calculate min/max across both datasets if YoY
    let allData = [...data];
    if (showYoY) allData = [...data, ...priorData];
    
    const min = Math.min(...allData);
    const max = Math.max(...allData);
    const range = max - min || 1;
    const padding = 6; // Increased for dot visibility
    
    const xStep = (width - padding * 2) / (data.length - 1);
    const yScale = (height - padding * 2) / range;
    
    // Store point positions for hover detection
    const points = [];
    const priorPoints = [];
    
    // Helper to draw a line with dots
    const drawLineWithDots = (lineData, lineColor, lineWidth = 2, dashed = false, pointsArray = null) => {
      ctx.beginPath();
      if (dashed) ctx.setLineDash([4, 2]);
      else ctx.setLineDash([]);
      
      lineData.forEach((val, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (val - min) * yScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (pointsArray) pointsArray.push({ x, y, val, idx: i });
      });
      
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw dots at each point
      lineData.forEach((val, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (val - min) * yScale;
        ctx.beginPath();
        ctx.arc(x, y, dashed ? 2 : 3, 0, Math.PI * 2);
        if (dashed) {
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = lineColor;
          ctx.fill();
        }
      });
    };
    
    // Draw prior year line first (behind current)
    if (showYoY) {
      drawLineWithDots(priorData, priorColor, 1.5, true, priorPoints);
    }
    
    // Draw fill for current period
    if (fill) {
      ctx.beginPath();
      ctx.moveTo(padding, height - padding);
      
      data.forEach((val, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (val - min) * yScale;
        ctx.lineTo(x, y);
      });
      
      ctx.lineTo(padding + (data.length - 1) * xStep, height - padding);
      ctx.closePath();
      
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, `${color}40`);
      gradient.addColorStop(1, `${color}00`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    // Draw current period line with dots
    drawLineWithDots(data, color, 2, false, points);
    
    // Mouse move handler for tooltips
    const self = this;
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      // Find closest point
      let closest = null;
      let closestDist = 20; // Max distance to trigger
      
      points.forEach((p, i) => {
        const dist = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
        if (dist < closestDist) {
          closestDist = dist;
          closest = { ...p, type: 'current', priorVal: showYoY ? priorData[i] : null };
        }
      });
      
      if (closest) {
        const label = labels ? labels[closest.idx] : `Wk ${closest.idx + 1}`;
        const valFormatted = metric.includes('Occ') || metric.includes('leased') || metric.includes('Ratio') || metric.includes('SLA') 
          ? `${closest.val.toFixed(1)}%` 
          : closest.val.toFixed(2);
        let html = `<div><strong>${label}</strong></div><div style="color:${color}">${valFormatted}</div>`;
        if (closest.priorVal !== null) {
          const priorFormatted = metric.includes('Occ') || metric.includes('leased') || metric.includes('Ratio') || metric.includes('SLA')
            ? `${closest.priorVal.toFixed(1)}%`
            : closest.priorVal.toFixed(2);
          html += `<div style="color:${priorColor};font-size:10px">Prior: ${priorFormatted}</div>`;
        }
        self.showTooltip(e.clientX, e.clientY, html);
      } else {
        self.hideTooltip();
      }
    });
    
    canvas.addEventListener('mouseleave', () => {
      self.hideTooltip();
    });
    
    container.innerHTML = '';
    container.appendChild(canvas);
    return canvas;
  }
  
  /**
   * Create a bar chart
   */
  static barChart(container, data, options = {}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const width = options.width || container.offsetWidth || 300;
    const height = options.height || 200;
    const barColor = options.color || this.colors.primary;
    const labels = options.labels || data.map((_, i) => i);
    
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);
    
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const max = Math.max(...data) || 1;
    const barWidth = (chartWidth / data.length) * 0.7;
    const barGap = (chartWidth / data.length) * 0.3;
    
    // Draw grid lines
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = max - (max / 4) * i;
      ctx.fillStyle = this.colors.gray;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(0), padding.left - 8, y + 4);
    }
    
    // Draw bars
    data.forEach((val, i) => {
      const x = padding.left + i * (barWidth + barGap) + barGap / 2;
      const barHeight = (val / max) * chartHeight;
      const y = padding.top + chartHeight - barHeight;
      
      // Bar
      ctx.fillStyle = Array.isArray(barColor) ? barColor[i] : barColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 4);
      ctx.fill();
      
      // X-axis label
      ctx.fillStyle = this.colors.gray;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barWidth / 2, height - padding.bottom + 20);
    });
    
    container.innerHTML = '';
    container.appendChild(canvas);
    return canvas;
  }
  
  /**
   * Create a donut chart
   */
  static donutChart(container, data, options = {}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const size = options.size || Math.min(container.offsetWidth, 200) || 150;
    const colors = options.colors || [this.colors.success, this.colors.warning, this.colors.danger];
    const labels = options.labels || [];
    const thickness = options.thickness || 20;
    
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - thickness) / 2 - 10;
    
    const total = data.reduce((sum, val) => sum + val, 0) || 1;
    let currentAngle = -Math.PI / 2;
    
    // Draw segments
    data.forEach((val, i) => {
      const sliceAngle = (val / total) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      currentAngle += sliceAngle;
    });
    
    // Center text
    if (options.centerText) {
      ctx.fillStyle = '#e8eaf0';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(options.centerText, centerX, centerY);
    }
    
    container.innerHTML = '';
    container.appendChild(canvas);
    return canvas;
  }
  
  /**
   * Create a funnel chart
   */
  static funnelChart(container, data, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 8px; width: 100%;';
    
    const maxValue = Math.max(...data.map(d => d.value)) || 1;
    const colors = options.colors || [this.colors.primary, this.colors.info, this.colors.success, this.colors.warning];
    
    data.forEach((item, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; gap: 12px;';
      
      const label = document.createElement('div');
      label.style.cssText = 'width: 80px; font-size: 12px; color: var(--text-secondary);';
      label.textContent = item.label;
      
      const barContainer = document.createElement('div');
      barContainer.style.cssText = 'flex: 1; height: 28px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;';
      
      const bar = document.createElement('div');
      const width = (item.value / maxValue) * 100;
      bar.style.cssText = `width: ${width}%; height: 100%; background: ${colors[i % colors.length]}; border-radius: 4px; transition: width 0.3s ease;`;
      
      const value = document.createElement('div');
      value.style.cssText = 'width: 60px; text-align: right; font-weight: 600;';
      value.textContent = item.value.toLocaleString();
      
      barContainer.appendChild(bar);
      row.appendChild(label);
      row.appendChild(barContainer);
      row.appendChild(value);
      wrapper.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(wrapper);
    return wrapper;
  }
  
  /**
   * Create a gauge chart
   */
  static gaugeChart(container, value, options = {}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const size = options.size || 120;
    const max = options.max || 100;
    const thresholds = options.thresholds || { green: 80, yellow: 50 };
    
    canvas.width = size * 2;
    canvas.height = size * 1.2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size * 0.6}px`;
    ctx.scale(2, 2);
    
    const centerX = size / 2;
    const centerY = size * 0.5;
    const radius = size * 0.4;
    const lineWidth = 12;
    
    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Value arc
    const pct = Math.min(value / max, 1);
    const angle = Math.PI + (pct * Math.PI);
    
    let color = this.colors.danger;
    if (value >= thresholds.green) color = this.colors.success;
    else if (value >= thresholds.yellow) color = this.colors.warning;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Value text
    ctx.fillStyle = '#e8eaf0';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${value}%`, centerX, centerY - 5);
    
    container.innerHTML = '';
    container.appendChild(canvas);
    return canvas;
  }
}

export default Charts;

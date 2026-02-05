/**
 * Scoring Utilities - Portfolio Scorecard v2
 */

// Default thresholds (will be loaded from config)
let thresholds = null;

/**
 * Load thresholds from config
 */
export async function loadThresholds() {
  if (thresholds) return thresholds;
  
  try {
    const response = await fetch('./config/thresholds.json');
    thresholds = await response.json();
    return thresholds;
  } catch (error) {
    console.error('Failed to load thresholds:', error);
    return null;
  }
}

/**
 * Get score color based on value and thresholds
 */
export function getScoreColor(value, metric, assetType = 'CON') {
  if (value == null || !thresholds) return 'gray';
  
  const assetThresholds = thresholds.assetTypes[assetType]?.metrics[metric];
  if (!assetThresholds) return 'gray';
  
  const { green, yellow, higher_is_better } = assetThresholds;
  
  if (higher_is_better) {
    if (value >= green) return 'green';
    if (value >= yellow) return 'yellow';
    return 'red';
  } else {
    if (value <= green) return 'green';
    if (value <= yellow) return 'yellow';
    return 'red';
  }
}

/**
 * Get numeric score (0-5) based on value and thresholds
 */
export function getScore(value, metric, assetType = 'CON') {
  const color = getScoreColor(value, metric, assetType);
  
  if (!thresholds) return null;
  
  switch (color) {
    case 'green': return thresholds.scoring.green;
    case 'yellow': return thresholds.scoring.yellow;
    case 'red': return thresholds.scoring.red;
    default: return null;
  }
}

/**
 * Calculate property health score (average of all metric scores)
 */
export function calculatePropertyScore(property, assetType = null) {
  const type = assetType || property.type || 'CON';
  const metrics = property.metrics;
  
  if (!metrics || !thresholds) return null;
  
  const scores = [];
  const assetConfig = thresholds.assetTypes[type]?.metrics || {};
  
  // Check if property is in lease-up mode
  const isLeaseUp = property.is_lease_up || 
    (metrics.occupancy?.physical && metrics.occupancy.physical < thresholds.leaseUpThreshold);
  
  // Score each metric
  Object.keys(assetConfig).forEach(metricKey => {
    // Skip certain metrics during lease-up
    if (isLeaseUp && ['physical_occupancy', 'leased_percent', 'renewal_ratio'].includes(metricKey)) {
      return;
    }
    
    // Map metric key to data structure
    const value = getMetricValue(metrics, metricKey);
    if (value != null) {
      const score = getScore(value, metricKey, type);
      if (score != null) {
        scores.push(score);
      }
    }
  });
  
  if (scores.length === 0) return null;
  
  // Calculate average
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(avgScore * 10) / 10; // Round to 1 decimal
}

/**
 * Get metric value from nested metrics object
 */
function getMetricValue(metrics, metricKey) {
  const mapping = {
    'physical_occupancy': metrics.occupancy?.physical,
    'leased_percent': metrics.occupancy?.leased,
    'delinquency': metrics.delinquency?.current,
    'closing_ratio': metrics.leasing?.closing_ratio,
    'renewal_ratio': metrics.retention?.renewal_ratio,
    'wo_sla': metrics.maintenance?.sla_compliance,
    'google_rating': metrics.reputation?.google_rating,
    'noi_variance': metrics.financial?.noi_variance
  };
  
  return mapping[metricKey];
}

/**
 * Calculate portfolio score (weighted average by units)
 */
export function calculatePortfolioScore(properties) {
  if (!properties || properties.length === 0) return null;
  
  let totalUnits = 0;
  let weightedSum = 0;
  
  properties.forEach(property => {
    const score = calculatePropertyScore(property);
    const units = property.units || property.beds || 1;
    
    if (score != null) {
      weightedSum += score * units;
      totalUnits += units;
    }
  });
  
  if (totalUnits === 0) return null;
  
  return Math.round((weightedSum / totalUnits) * 10) / 10;
}

/**
 * Calculate region score (weighted average)
 */
export function calculateRegionScore(properties) {
  return calculatePortfolioScore(properties);
}

/**
 * Get red flags for a property
 */
export function getRedFlags(property) {
  const type = property.type || 'CON';
  const metrics = property.metrics;
  const flags = [];
  
  if (!metrics || !thresholds) return flags;
  
  const assetConfig = thresholds.assetTypes[type]?.metrics || {};
  
  Object.entries(assetConfig).forEach(([metricKey, config]) => {
    const value = getMetricValue(metrics, metricKey);
    if (value == null) return;
    
    const color = getScoreColor(value, metricKey, type);
    
    if (color === 'red') {
      flags.push({
        metric: metricKey,
        value,
        threshold: config.higher_is_better ? config.yellow : config.green,
        unit: config.unit,
        severity: 'critical'
      });
    } else if (color === 'yellow') {
      flags.push({
        metric: metricKey,
        value,
        threshold: config.green,
        unit: config.unit,
        severity: 'warning'
      });
    }
  });
  
  // Sort by severity (critical first)
  flags.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return 0;
  });
  
  return flags;
}

/**
 * Get all red flags across portfolio
 */
export function getPortfolioRedFlags(properties) {
  const allFlags = [];
  
  properties.forEach(property => {
    const flags = getRedFlags(property);
    flags.forEach(flag => {
      allFlags.push({
        ...flag,
        propertyId: property.id,
        propertyName: property.name
      });
    });
  });
  
  // Sort by severity, then by property
  allFlags.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1;
    }
    return a.propertyName.localeCompare(b.propertyName);
  });
  
  return allFlags;
}

/**
 * Get score color class for CSS
 */
export function getScoreColorClass(score) {
  if (score == null) return '';
  if (score >= 4) return 'green';
  if (score >= 2) return 'yellow';
  return 'red';
}

export default {
  loadThresholds,
  getScoreColor,
  getScore,
  calculatePropertyScore,
  calculatePortfolioScore,
  calculateRegionScore,
  getRedFlags,
  getPortfolioRedFlags,
  getScoreColorClass
};

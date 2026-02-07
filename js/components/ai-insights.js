/**
 * AI Insights Component - Portfolio Scorecard v2
 * Property-level analysis with actionable recommendations
 */

import { propertyHistory } from '../data/rise-data.js';

/**
 * Generate AI insights for a property
 */
export function generatePropertyInsights(prop) {
  const insights = [];
  
  // Skip lease-up properties
  if (prop.defaultLeaseUp) {
    return [{
      type: 'info',
      title: 'Lease-Up Property',
      message: 'This property is in lease-up phase. Standard metrics do not apply.',
      recommendations: ['Focus on marketing velocity', 'Track weekly leasing pace vs. pro forma']
    }];
  }
  
  // Get historical data for trend analysis
  const history = propertyHistory[prop.name] || {};
  
  // Analyze Occupancy
  if (prop.physOcc != null) {
    if (prop.physOcc < 0.90) {
      insights.push({
        type: 'critical',
        title: 'Occupancy Below Target',
        message: `Physical occupancy at ${(prop.physOcc * 100).toFixed(1)}% is significantly below the 93% target. This represents approximately ${Math.round((0.93 - prop.physOcc) * (prop.units || prop.beds || 100))} vacant units that should be occupied.`,
        recommendations: [
          'Review pricing strategy vs. comps within 1-mile radius',
          'Audit lead response times — target under 5 minutes',
          'Consider limited-time concession to drive traffic',
          'Evaluate curb appeal and tour path condition'
        ]
      });
    } else if (prop.physOcc < 0.93) {
      insights.push({
        type: 'warning',
        title: 'Occupancy Trending Low',
        message: `Physical occupancy at ${(prop.physOcc * 100).toFixed(1)}% is below the 93% target threshold.`,
        recommendations: [
          'Increase marketing spend on high-converting channels',
          'Review renewal offers for upcoming expirations',
          'Ensure availability on all ILS platforms'
        ]
      });
    }
  }
  
  // Analyze Delinquency
  if (prop.delinq != null) {
    if (prop.delinq > 0.02) {
      insights.push({
        type: 'critical',
        title: 'Delinquency Elevated',
        message: `Delinquency at ${(prop.delinq * 100).toFixed(2)}% exceeds the 2% threshold. Estimated at-risk revenue: $${Math.round(prop.delinq * (prop.avgRent || 1500) * (prop.units || prop.beds || 100)).toLocaleString()}/month.`,
        recommendations: [
          'Prioritize outreach to residents with balances >60 days',
          'Review and update payment plan agreements',
          'Escalate accounts >90 days to collections process',
          'Audit income verification procedures for new leases'
        ]
      });
    } else if (prop.delinq > 0.01) {
      insights.push({
        type: 'warning',
        title: 'Delinquency Above Benchmark',
        message: `Delinquency at ${(prop.delinq * 100).toFixed(2)}% is above the 1% ideal benchmark.`,
        recommendations: [
          'Send friendly payment reminders before due dates',
          'Offer autopay incentives to reduce late payments',
          'Schedule check-in calls with at-risk residents'
        ]
      });
    }
  }
  
  // Analyze Maintenance
  if (prop.woSla != null && prop.woSla > 0 && prop.woSla < 0.90) {
    insights.push({
      type: 'warning',
      title: 'Maintenance Response Lagging',
      message: `Only ${(prop.woSla * 100).toFixed(1)}% of work orders completed on time (target: 95%). Delayed maintenance impacts resident satisfaction and renewal rates.`,
      recommendations: [
        'Review technician workload distribution',
        'Prioritize emergency and urgent requests',
        'Audit parts inventory for common repairs',
        'Consider temporary staffing support'
      ]
    });
  }
  
  // Analyze Google Rating
  if (prop.googleStars != null) {
    if (prop.googleStars < 3.5) {
      insights.push({
        type: 'critical',
        title: 'Reputation at Risk',
        message: `Google rating of ${prop.googleStars.toFixed(1)}★ is critically low. This significantly impacts prospect conversion rates and search visibility.`,
        recommendations: [
          'Respond to all negative reviews within 24 hours',
          'Identify and resolve top resident complaints',
          'Implement review request process for happy residents',
          'Consider reputation management service'
        ]
      });
    } else if (prop.googleStars < 4.0) {
      insights.push({
        type: 'warning',
        title: 'Google Rating Below Average',
        message: `Google rating of ${prop.googleStars.toFixed(1)}★ is below the 4.5 target. Each star improvement can increase conversion by 5-10%.`,
        recommendations: [
          'Ask satisfied residents to leave reviews after positive interactions',
          'Address common themes in recent negative reviews',
          'Highlight improvements made in response to feedback'
        ]
      });
    }
  }
  
  // Analyze Training
  if (prop.training != null && prop.training < 0.95) {
    insights.push({
      type: 'info',
      title: 'Training Compliance Gap',
      message: `Training completion at ${(prop.training * 100).toFixed(0)}% — ${Math.round((1 - prop.training) * 10)} team members have outstanding modules.`,
      recommendations: [
        'Schedule dedicated training time blocks',
        'Follow up with individuals who are behind',
        'Tie completion to performance reviews'
      ]
    });
  }
  
  // Analyze Renewals (if applicable)
  if (prop.renewalRatio != null && prop.type !== 'OC') {
    if (prop.renewalRatio < 0.50) {
      insights.push({
        type: 'warning',
        title: 'Renewal Rate Concerning',
        message: `Renewal ratio of ${(prop.renewalRatio * 100).toFixed(0)}% is below the 55% target. High turnover increases make-ready costs and vacancy loss.`,
        recommendations: [
          'Conduct exit interviews to identify reasons for move-outs',
          'Review renewal offer competitiveness vs. market',
          'Start renewal conversations 90+ days before expiration',
          'Consider loyalty incentives for long-term residents'
        ]
      });
    }
  }
  
  // Analyze NOI Variance
  if (prop.noiVariance != null && prop.noiVariance < 0.95) {
    insights.push({
      type: 'warning',
      title: 'NOI Below Budget',
      message: `NOI variance at ${(prop.noiVariance * 100).toFixed(1)}% of budget. The property is underperforming by approximately ${((1 - prop.noiVariance) * 100).toFixed(1)}%.`,
      recommendations: [
        'Review controllable expenses vs. budget line by line',
        'Identify revenue opportunities (RUBS, parking, storage)',
        'Evaluate vendor contracts for renegotiation',
        'Analyze recent capital needs vs. reserves'
      ]
    });
  }
  
  // Analyze Lead-to-Tour (if applicable)
  if (prop.leadToTour != null && prop.type !== 'OC') {
    if (prop.leadToTour < 0.20) {
      insights.push({
        type: 'info',
        title: 'Lead Conversion Opportunity',
        message: `Lead-to-tour conversion at ${(prop.leadToTour * 100).toFixed(0)}% is below the 30% target. Improving this metric directly increases leasing velocity.`,
        recommendations: [
          'Audit lead response time — target under 5 minutes',
          'Review email/call scripts for effectiveness',
          'Ensure self-scheduling tours are available',
          'Verify pricing shown online matches actual availability'
        ]
      });
    }
  }
  
  // Positive insights
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      title: 'Strong Performance',
      message: 'This property is performing well across all key metrics. Continue current operational practices.',
      recommendations: [
        'Document best practices to share with other properties',
        'Recognize team members for strong performance',
        'Look for opportunities to exceed targets'
      ]
    });
  }
  
  // Add trend-based insight if available
  if (history.physOcc && history.physOcc.length >= 4) {
    const trend = history.physOcc.slice(-4);
    const change = trend[3] - trend[0];
    if (change < -0.03) {
      insights.unshift({
        type: 'warning',
        title: 'Declining Trend Detected',
        message: `Occupancy has declined ${(Math.abs(change) * 100).toFixed(1)}% over the past 4 weeks. This trend requires immediate attention.`,
        recommendations: [
          'Identify root cause — move-outs, leasing pace, or both',
          'Increase leasing team focus and accountability',
          'Review competitive positioning'
        ]
      });
    }
  }
  
  return insights;
}

/**
 * Render insights panel HTML
 */
export function renderInsightsPanel(prop) {
  const insights = generatePropertyInsights(prop);
  
  return `
    <div class="ai-insights">
      <div class="ai-insights__header">
        <span class="ai-insights__title">🤖 AI Insights</span>
        <span class="ai-insights__badge">${insights.length} ${insights.length === 1 ? 'insight' : 'insights'}</span>
      </div>
      <div class="ai-insights__list">
        ${insights.map(insight => `
          <div class="insight-card insight-card--${insight.type}">
            <div class="insight-card__header">
              <span class="insight-card__icon">${getInsightIcon(insight.type)}</span>
              <span class="insight-card__title">${insight.title}</span>
            </div>
            <p class="insight-card__message">${insight.message}</p>
            ${insight.recommendations && insight.recommendations.length > 0 ? `
              <div class="insight-card__recommendations">
                <span class="recommendations-label">Recommended Actions:</span>
                <ul class="recommendations-list">
                  ${insight.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getInsightIcon(type) {
  switch (type) {
    case 'critical': return '🚨';
    case 'warning': return '⚠️';
    case 'info': return '💡';
    case 'success': return '✅';
    default: return '📊';
  }
}

export default {
  generatePropertyInsights,
  renderInsightsPanel
};

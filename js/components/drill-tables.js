/**
 * Drill-In Tables Component - Portfolio Scorecard v2
 * Detailed, filterable, sortable tables for each metric
 */

// Generate mock data helpers
function randomUnit(building = null) {
  const bldg = building || Math.floor(Math.random() * 8) + 1;
  const unit = Math.floor(Math.random() * 40) + 1;
  return `${bldg}-${String(unit).padStart(3, '0')}`;
}

const FLOORPLANS = ['Studio', '1BR/1BA', '1BR/1BA+Den', '2BR/1BA', '2BR/2BA', '3BR/2BA'];
const MAKE_READY_STATUS = ['Not Started', 'In Progress', 'Complete', 'Pending Inspection'];
const AGENTS = ['Sarah Johnson', 'Mike Chen', 'Lisa Brown', 'James Wilson', 'Maria Garcia', 'David Kim'];
const TECHNICIANS = ['John Smith', 'Carlos Rodriguez', 'Marcus Taylor', 'Robert Lee'];
const WO_CATEGORIES = ['Plumbing', 'HVAC', 'Electrical', 'Appliance', 'General', 'Flooring', 'Pest Control', 'Locks/Keys'];
const WO_TYPES = ['Routine', 'Emergency', 'Make Ready', 'Preventive'];
const LEAD_SOURCES = ['Website', 'Apartments.com', 'Zillow', 'Walk-in', 'Referral', 'Facebook', 'Google', 'ILS'];

/**
 * Generate Physical Occupancy drill-in data
 */
export function generatePhysOccData(prop, count = 15) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      unit: randomUnit(),
      floorplan: FLOORPLANS[Math.floor(Math.random() * FLOORPLANS.length)],
      daysVacant: Math.floor(Math.random() * 45) + 1,
      makeReadyStatus: MAKE_READY_STATUS[Math.floor(Math.random() * MAKE_READY_STATUS.length)],
      lastMoveOut: new Date(Date.now() - Math.floor(Math.random() * 45) * 86400000).toISOString().split('T')[0],
      marketRent: 1200 + Math.floor(Math.random() * 800)
    });
  }
  return data.sort((a, b) => a.unit.localeCompare(b.unit));
}

/**
 * Generate Leased % drill-in data
 */
export function generateLeasedData(prop, count = 20) {
  const data = [];
  const types = ['Pending Move-In', 'Scheduled Move-Out', 'Notice Given'];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const date = new Date(Date.now() + Math.floor(Math.random() * 30) * 86400000);
    data.push({
      unit: randomUnit(),
      floorplan: FLOORPLANS[Math.floor(Math.random() * FLOORPLANS.length)],
      unitType: type,
      date: date.toISOString().split('T')[0],
      resident: type === 'Pending Move-In' ? `New Resident ${i + 1}` : `Current Resident ${i + 1}`,
      rent: 1200 + Math.floor(Math.random() * 800)
    });
  }
  return data.sort((a, b) => a.unit.localeCompare(b.unit));
}

/**
 * Generate Lead-to-Tour drill-in data
 */
export function generateLeadToTourData(prop, count = 30) {
  const data = [];
  const statuses = ['Lead', 'Tour Scheduled', 'Tour Completed', 'Applied', 'Denied', 'Leased'];
  for (let i = 0; i < count; i++) {
    const source = LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)];
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const leadDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000);
    const responseMin = Math.floor(Math.random() * 120) + 5;
    data.push({
      leadId: `L-${10000 + i}`,
      source,
      agent,
      leadDate: leadDate.toISOString().split('T')[0],
      responseTime: `${responseMin} min`,
      status,
      floorplanInterest: FLOORPLANS[Math.floor(Math.random() * FLOORPLANS.length)]
    });
  }
  return data;
}

/**
 * Generate Delinquency drill-in data
 */
export function generateDelinquencyData(prop, count = 12) {
  const data = [];
  const agingBuckets = ['1-30', '31-60', '61-90', '90+'];
  for (let i = 0; i < count; i++) {
    const bucket = agingBuckets[Math.floor(Math.random() * agingBuckets.length)];
    const balance = Math.floor(Math.random() * 3000) + 200;
    data.push({
      unit: randomUnit(),
      floorplan: FLOORPLANS[Math.floor(Math.random() * FLOORPLANS.length)],
      resident: `Resident ${i + 1}`,
      balance: balance,
      agingBucket: bucket,
      lastPayment: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000).toISOString().split('T')[0],
      paymentPlan: Math.random() > 0.7 ? 'Yes' : 'No',
      notes: Math.random() > 0.5 ? 'Payment arrangement in place' : ''
    });
  }
  return data.sort((a, b) => a.unit.localeCompare(b.unit));
}

/**
 * Generate Maintenance drill-in data
 */
export function generateWOSLAData(prop, count = 25) {
  const data = [];
  for (let i = 0; i < count; i++) {
    const openDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000);
    const isComplete = Math.random() > 0.3;
    const closeDate = isComplete ? new Date(openDate.getTime() + Math.floor(Math.random() * 5) * 86400000) : null;
    
    // Calculate business days
    let businessDays = null;
    if (closeDate) {
      let days = 0;
      let current = new Date(openDate);
      while (current < closeDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
        current.setDate(current.getDate() + 1);
      }
      businessDays = days;
    }
    
    data.push({
      unit: randomUnit(),
      ticketId: `WO-${20000 + i}`,
      category: WO_CATEGORIES[Math.floor(Math.random() * WO_CATEGORIES.length)],
      ticketType: WO_TYPES[Math.floor(Math.random() * WO_TYPES.length)],
      openDate: openDate.toISOString().split('T')[0],
      closeDate: closeDate ? closeDate.toISOString().split('T')[0] : '—',
      timeToComplete: businessDays !== null ? `${businessDays} days` : 'Open',
      technician: TECHNICIANS[Math.floor(Math.random() * TECHNICIANS.length)],
      status: isComplete ? 'Complete' : 'Open'
    });
  }
  return data.sort((a, b) => a.unit.localeCompare(b.unit));
}

/**
 * Generate Closing Ratio drill-in data (by agent)
 */
export function generateClosingRatioData(prop) {
  return AGENTS.map((agent, i) => {
    const tours = Math.floor(Math.random() * 20) + 5;
    const leases = Math.floor(Math.random() * tours * 0.6);
    return {
      agent,
      tours,
      leases,
      closingRatio: ((leases / tours) * 100).toFixed(1) + '%',
      avgResponseTime: `${Math.floor(Math.random() * 30) + 5} min`,
      topSource: LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)]
    };
  });
}

/**
 * Generate Renewal Ratio drill-in data
 */
export function generateRenewalRatioData(prop, count = 18) {
  const data = [];
  const statuses = ['Offer Sent', 'Accepted', 'Declined', 'Pending', 'NTV'];
  for (let i = 0; i < count; i++) {
    const currentRent = 1200 + Math.floor(Math.random() * 800);
    const offerRent = Math.round(currentRent * (1 + Math.random() * 0.08));
    const leaseEnd = new Date(Date.now() + Math.floor(Math.random() * 90) * 86400000);
    data.push({
      unit: randomUnit(),
      floorplan: FLOORPLANS[Math.floor(Math.random() * FLOORPLANS.length)],
      resident: `Resident ${i + 1}`,
      leaseEnd: leaseEnd.toISOString().split('T')[0],
      currentRent: `$${currentRent.toLocaleString()}`,
      offer12Month: `$${offerRent.toLocaleString()}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      daysUntilExpiry: Math.floor((leaseEnd - Date.now()) / 86400000)
    });
  }
  return data.sort((a, b) => a.unit.localeCompare(b.unit));
}

/**
 * Render a sortable, filterable table
 */
export function renderDrillTable(containerId, columns, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Store original data for filtering
  let filteredData = [...data];
  let sortCol = options.defaultSort || null;
  let sortDir = 'asc';
  
  const render = () => {
    container.innerHTML = `
      <div class="drill-table-wrap">
        <div class="drill-table-filters">
          <input type="text" class="drill-table-search" placeholder="Filter..." data-action="filter">
        </div>
        <table class="drill-table">
          <thead>
            <tr>
              ${columns.map(col => `
                <th data-col="${col.key}" class="sortable ${sortCol === col.key ? `sorted-${sortDir}` : ''}">
                  ${col.label}
                  <span class="sort-icon">${sortCol === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(row => `
              <tr>
                ${columns.map(col => `<td>${col.format ? col.format(row[col.key], row) : row[col.key]}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${filteredData.length === 0 ? '<div class="drill-table-empty">No data matching filter</div>' : ''}
      </div>
    `;
    
    // Attach sort handlers
    container.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (sortCol === col) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortCol = col;
          sortDir = 'asc';
        }
        
        filteredData.sort((a, b) => {
          let aVal = a[col];
          let bVal = b[col];
          
          // Handle numeric strings
          if (typeof aVal === 'string' && aVal.match(/^[\$\d,\.%]+$/)) {
            aVal = parseFloat(aVal.replace(/[\$,%]/g, '')) || 0;
            bVal = parseFloat(bVal.replace(/[\$,%]/g, '')) || 0;
          }
          
          if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
          return 0;
        });
        
        render();
      });
    });
    
    // Attach filter handler
    const filterInput = container.querySelector('.drill-table-search');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filteredData = data.filter(row => {
          return columns.some(col => {
            const val = String(row[col.key] || '').toLowerCase();
            return val.includes(query);
          });
        });
        render();
        // Re-focus input
        const newInput = container.querySelector('.drill-table-search');
        if (newInput) {
          newInput.focus();
          newInput.value = query;
        }
      });
    }
  };
  
  render();
}

/**
 * Generate Avg Rent drill-in data (rent roll)
 */
export function generateAvgRentData(prop, count = 20) {
  const data = [];
  const statuses = ['Occupied', 'Occupied', 'Occupied', 'Occupied', 'Notice', 'Vacant']; // Weighted towards occupied
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isOccupied = status !== 'Vacant';
    const marketRent = 1200 + Math.floor(Math.random() * 800);
    const effectiveRent = isOccupied ? marketRent - Math.floor(Math.random() * 100) : 0;
    data.push({
      unit: randomUnit(),
      floorplan: FLOORPLANS[Math.floor(Math.random() * FLOORPLANS.length)],
      status,
      marketRent: `$${marketRent.toLocaleString()}`,
      effectiveRent: isOccupied ? `$${effectiveRent.toLocaleString()}` : '—',
      variance: isOccupied ? `$${(effectiveRent - marketRent).toLocaleString()}` : '—',
      leaseEnd: isOccupied ? new Date(Date.now() + Math.floor(Math.random() * 180) * 86400000).toISOString().split('T')[0] : '—'
    });
  }
  return data.sort((a, b) => a.unit.localeCompare(b.unit));
}

// Column definitions for each metric
export const DRILL_COLUMNS = {
  physOcc: [
    { key: 'unit', label: 'Bldg-Unit' },
    { key: 'floorplan', label: 'Floorplan' },
    { key: 'daysVacant', label: 'Days Vacant' },
    { key: 'makeReadyStatus', label: 'Make Ready Status' },
    { key: 'lastMoveOut', label: 'Move-Out Date' },
    { key: 'marketRent', label: 'Market Rent', format: (v) => `$${v.toLocaleString()}` }
  ],
  leased: [
    { key: 'unit', label: 'Bldg-Unit' },
    { key: 'floorplan', label: 'Floorplan' },
    { key: 'unitType', label: 'Type' },
    { key: 'date', label: 'Date' },
    { key: 'resident', label: 'Resident' },
    { key: 'rent', label: 'Rent', format: (v) => `$${v.toLocaleString()}` }
  ],
  leadToTour: [
    { key: 'source', label: 'Source' },
    { key: 'agent', label: 'Agent' },
    { key: 'leadId', label: 'Lead ID' },
    { key: 'leadDate', label: 'Lead Date' },
    { key: 'responseTime', label: 'Response Time' },
    { key: 'status', label: 'Status' },
    { key: 'floorplanInterest', label: 'Floorplan' }
  ],
  avgRent: [
    { key: 'unit', label: 'Bldg-Unit' },
    { key: 'floorplan', label: 'Floorplan' },
    { key: 'status', label: 'Status' },
    { key: 'marketRent', label: 'Market Rent' },
    { key: 'effectiveRent', label: 'Effective Rent' },
    { key: 'variance', label: 'Variance' },
    { key: 'leaseEnd', label: 'Lease End' }
  ],
  delinq: [
    { key: 'unit', label: 'Bldg-Unit' },
    { key: 'floorplan', label: 'Floorplan' },
    { key: 'resident', label: 'Resident' },
    { key: 'balance', label: 'Balance', format: (v) => `$${v.toLocaleString()}` },
    { key: 'agingBucket', label: 'Aging' },
    { key: 'lastPayment', label: 'Last Payment' },
    { key: 'paymentPlan', label: 'Payment Plan' },
    { key: 'notes', label: 'Notes' }
  ],
  woSla: [
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Bldg-Unit' },
    { key: 'ticketId', label: 'Ticket #' },
    { key: 'ticketType', label: 'Type' },
    { key: 'technician', label: 'Technician' },
    { key: 'openDate', label: 'Open Date' },
    { key: 'closeDate', label: 'Close Date' },
    { key: 'timeToComplete', label: 'Time (Bus. Days)' },
    { key: 'status', label: 'Status' }
  ],
  closingRatio: [
    { key: 'agent', label: 'Agent' },
    { key: 'tours', label: 'Tours' },
    { key: 'leases', label: 'Leases' },
    { key: 'closingRatio', label: 'Closing %' },
    { key: 'avgResponseTime', label: 'Avg Response' },
    { key: 'topSource', label: 'Top Source' }
  ],
  renewalRatio: [
    { key: 'unit', label: 'Bldg-Unit' },
    { key: 'floorplan', label: 'Floorplan' },
    { key: 'resident', label: 'Resident' },
    { key: 'leaseEnd', label: 'Lease End' },
    { key: 'currentRent', label: 'Current Rent' },
    { key: 'offer12Month', label: '12-Mo Offer' },
    { key: 'status', label: 'Status' },
    { key: 'daysUntilExpiry', label: 'Days Left' }
  ]
};

// Training-related constants
const EMPLOYEES = ['Sarah Johnson', 'Mike Chen', 'Lisa Brown', 'James Wilson', 'Maria Garcia', 'David Kim', 'Emily Davis', 'Chris Thompson'];
const TRAINING_COURSES = [
  'Fair Housing Fundamentals',
  'Leasing 101',
  'Emergency Response',
  'Safety & OSHA Compliance',
  'Customer Service Excellence',
  'Rent Collection Best Practices',
  'Property Maintenance Basics',
  'Sexual Harassment Prevention',
  'Lead-Based Paint Disclosure',
  'ADA Compliance',
  'Fire Safety & Evacuation',
  'Conflict Resolution'
];

/**
 * Generate Training Table data (completion % by person)
 */
export function generateTrainingTableData(prop) {
  return EMPLOYEES.map(name => {
    const totalCourses = TRAINING_COURSES.length;
    const completed = Math.floor(Math.random() * 4) + (totalCourses - 4); // Most are high
    const pastDue = totalCourses - completed;
    return {
      employee: name,
      completed,
      total: totalCourses,
      completionPct: ((completed / totalCourses) * 100).toFixed(0) + '%',
      pastDue,
      status: pastDue === 0 ? 'Complete' : pastDue <= 2 ? 'In Progress' : 'Behind'
    };
  });
}

/**
 * Generate Training Drill-In data (past-due classes by person)
 */
export function generateTrainingDrillInData(prop) {
  const data = [];
  EMPLOYEES.forEach(employee => {
    // Random subset of courses that are past due
    const pastDueCount = Math.floor(Math.random() * 4);
    const shuffled = [...TRAINING_COURSES].sort(() => Math.random() - 0.5);
    const pastDueCourses = shuffled.slice(0, pastDueCount);
    
    pastDueCourses.forEach(course => {
      const dueDate = new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000);
      data.push({
        employee,
        course,
        dueDate: dueDate.toISOString().split('T')[0],
        daysPastDue: Math.floor((Date.now() - dueDate.getTime()) / 86400000),
        status: 'Past Due'
      });
    });
  });
  return data.sort((a, b) => a.employee.localeCompare(b.employee) || b.daysPastDue - a.daysPastDue);
}

/**
 * Generate Maintenance summary by technician
 */
export function generateWOTechnicianData(prop) {
  const TECHNICIANS = ['John Smith', 'Carlos Rodriguez', 'Marcus Taylor', 'Robert Lee', 'Kevin Brown'];
  return TECHNICIANS.map(tech => {
    const total = Math.floor(Math.random() * 30) + 10;
    const open = Math.floor(Math.random() * 5);
    const completed = total - open;
    const slaCompliant = Math.floor(completed * (0.75 + Math.random() * 0.25));
    return {
      technician: tech,
      open,
      completed,
      total,
      slaPct: ((slaCompliant / completed) * 100).toFixed(0) + '%'
    };
  });
}

/**
 * Generate Move Activity data (New Leases vs Move-outs by month)
 */
export function generateMoveActivityData(prop, months = 6) {
  const data = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Generate realistic move activity numbers
    const baseUnits = prop?.units || 200;
    const newLeases = Math.floor(Math.random() * (baseUnits * 0.08)) + Math.floor(baseUnits * 0.02);
    const moveOuts = Math.floor(Math.random() * (baseUnits * 0.06)) + Math.floor(baseUnits * 0.015);
    
    data.push({
      month: monthLabel,
      newLeases,
      moveOuts,
      net: newLeases - moveOuts
    });
  }
  return data;
}

/**
 * Generate Move-out Reasons data (Pareto style - top reasons)
 */
export function generateMoveOutReasonsData(prop) {
  const reasons = [
    { reason: 'Rent Increase', count: Math.floor(Math.random() * 25) + 15 },
    { reason: 'Job Relocation', count: Math.floor(Math.random() * 20) + 10 },
    { reason: 'Home Purchase', count: Math.floor(Math.random() * 18) + 8 },
    { reason: 'Lease Violation', count: Math.floor(Math.random() * 12) + 5 },
    { reason: 'Roommate Issues', count: Math.floor(Math.random() * 10) + 4 },
    { reason: 'Maintenance Issues', count: Math.floor(Math.random() * 8) + 3 },
    { reason: 'Noise/Neighbors', count: Math.floor(Math.random() * 7) + 2 },
    { reason: 'Downsizing', count: Math.floor(Math.random() * 6) + 2 },
    { reason: 'Upgrading', count: Math.floor(Math.random() * 5) + 1 },
    { reason: 'Other', count: Math.floor(Math.random() * 8) + 3 }
  ];
  
  // Sort by count descending
  reasons.sort((a, b) => b.count - a.count);
  
  // Calculate percentages and cumulative
  const total = reasons.reduce((sum, r) => sum + r.count, 0);
  let cumulative = 0;
  
  return reasons.map(r => {
    cumulative += r.count;
    return {
      ...r,
      percentage: ((r.count / total) * 100).toFixed(1),
      cumulative: ((cumulative / total) * 100).toFixed(1)
    };
  });
}

// Column definitions for move-out reasons drill-in
DRILL_COLUMNS.moveOutReasons = [
  { key: 'reason', label: 'Reason' },
  { key: 'count', label: 'Count' },
  { key: 'percentage', label: '% of Total', format: (v) => `${v}%` },
  { key: 'cumulative', label: 'Cumulative %', format: (v) => `${v}%` }
];

export default {
  generatePhysOccData,
  generateLeasedData,
  generateLeadToTourData,
  generateDelinquencyData,
  generateWOSLAData,
  generateClosingRatioData,
  generateRenewalRatioData,
  generateAvgRentData,
  generateTrainingTableData,
  generateTrainingDrillInData,
  generateWOTechnicianData,
  generateMoveActivityData,
  generateMoveOutReasonsData,
  renderDrillTable,
  DRILL_COLUMNS
};

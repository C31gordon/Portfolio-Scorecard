/**
 * Mock Drill-Down Data - Portfolio Scorecard v2
 * Sample data for Level 2 data views
 */

// Generate random date within range
function randomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Generate lease data for a property
export function generateLeaseData(propertyId, count = 50) {
  const agents = ['Sarah Johnson', 'Mike Chen', 'Lisa Brown', 'James Wilson', 'Maria Garcia'];
  const floorplans = ['1BR/1BA', '2BR/1BA', '2BR/2BA', '3BR/2BA', 'Studio'];
  const sources = ['Website', 'Apartments.com', 'Zillow', 'Walk-in', 'Referral', 'Facebook'];
  const statuses = ['Signed', 'Pending', 'Cancelled'];
  
  const data = [];
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const signDate = randomDate(monthAgo, now);
    const startDate = new Date(signDate);
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    data.push({
      id: `lease-${propertyId}-${i}`,
      unit: `${Math.floor(Math.random() * 4) + 1}${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}`,
      floorplan: floorplans[Math.floor(Math.random() * floorplans.length)],
      resident: `Resident ${i + 1}`,
      rent: 1200 + Math.floor(Math.random() * 800),
      agent: agents[Math.floor(Math.random() * agents.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      signDate,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 3)]
    });
  }
  
  return data.sort((a, b) => new Date(b.signDate) - new Date(a.signDate));
}

// Generate work order data for a property
export function generateWorkOrderData(propertyId, count = 75) {
  const techs = ['John Smith', 'Carlos Rodriguez', 'David Kim', 'Marcus Johnson'];
  const categories = ['Plumbing', 'HVAC', 'Electrical', 'Appliance', 'General', 'Flooring', 'Pest Control'];
  const priorities = ['Emergency', 'Urgent', 'Normal', 'Low'];
  const statuses = ['Open', 'In Progress', 'Completed', 'On Hold'];
  
  const data = [];
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const createDate = randomDate(monthAgo, now);
    const isCompleted = Math.random() < 0.7;
    let completedDate = null;
    let daysToComplete = null;
    
    if (isCompleted) {
      const created = new Date(createDate);
      daysToComplete = Math.floor(Math.random() * 5) + 1;
      const completed = new Date(created.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
      completedDate = completed.toISOString().split('T')[0];
    }
    
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    data.push({
      id: `wo-${propertyId}-${i}`,
      unit: `${Math.floor(Math.random() * 4) + 1}${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      description: `Work order #${i + 1000}`,
      priority,
      tech: techs[Math.floor(Math.random() * techs.length)],
      createDate,
      completedDate,
      daysToComplete,
      status: isCompleted ? 'Completed' : statuses[Math.floor(Math.random() * 3)]
    });
  }
  
  return data.sort((a, b) => new Date(b.createDate) - new Date(a.createDate));
}

// Generate agent performance data
export function generateAgentData(propertyId) {
  const agents = [
    { name: 'Sarah Johnson', leads: 45, tours: 28, apps: 18, leases: 14, avgResponseMin: 12 },
    { name: 'Mike Chen', leads: 38, tours: 22, apps: 14, leases: 10, avgResponseMin: 18 },
    { name: 'Lisa Brown', leads: 42, tours: 31, apps: 22, leases: 16, avgResponseMin: 8 },
    { name: 'James Wilson', leads: 35, tours: 18, apps: 10, leases: 6, avgResponseMin: 25 },
    { name: 'Maria Garcia', leads: 40, tours: 25, apps: 16, leases: 12, avgResponseMin: 15 }
  ];
  
  return agents.map((agent, i) => ({
    id: `agent-${propertyId}-${i}`,
    ...agent,
    leadToTour: ((agent.tours / agent.leads) * 100).toFixed(1),
    tourToLease: ((agent.leases / agent.tours) * 100).toFixed(1),
    closingRatio: ((agent.leases / agent.tours) * 100).toFixed(1)
  }));
}

// Generate financial data
export function generateFinancialData(propertyId) {
  const categories = [
    { code: '4000', name: 'Rental Income', actual: 485000, budget: 478000 },
    { code: '4100', name: 'Other Income', actual: 28500, budget: 25000 },
    { code: '4200', name: 'Parking Income', actual: 8200, budget: 9000 },
    { code: '5000', name: 'Payroll', actual: 42000, budget: 40000 },
    { code: '5100', name: 'Repairs & Maintenance', actual: 18500, budget: 15000 },
    { code: '5200', name: 'Contract Services', actual: 12000, budget: 12500 },
    { code: '5300', name: 'Utilities', actual: 22000, budget: 20000 },
    { code: '5400', name: 'Marketing', actual: 8500, budget: 10000 },
    { code: '5500', name: 'Administrative', actual: 6500, budget: 7000 },
    { code: '5600', name: 'Insurance', actual: 15000, budget: 15000 },
    { code: '5700', name: 'Property Tax', actual: 35000, budget: 35000 }
  ];
  
  return categories.map((cat, i) => ({
    id: `fin-${propertyId}-${i}`,
    ...cat,
    variance: cat.actual - cat.budget,
    variancePct: (((cat.actual - cat.budget) / cat.budget) * 100).toFixed(1),
    isExpense: cat.code.startsWith('5')
  }));
}

// Generate rent roll data
export function generateRentRollData(propertyId, units = 80) {
  const floorplans = [
    { name: 'Studio', sqft: 525, marketRent: 1150 },
    { name: '1BR/1BA', sqft: 725, marketRent: 1350 },
    { name: '2BR/1BA', sqft: 925, marketRent: 1550 },
    { name: '2BR/2BA', sqft: 1050, marketRent: 1750 },
    { name: '3BR/2BA', sqft: 1250, marketRent: 2050 }
  ];
  
  const statuses = ['Occupied', 'Vacant', 'Notice', 'Down'];
  const data = [];
  
  for (let i = 0; i < units; i++) {
    const floor = Math.floor(i / 20) + 1;
    const unit = (i % 20) + 1;
    const fp = floorplans[Math.floor(Math.random() * floorplans.length)];
    const statusRoll = Math.random();
    let status = 'Occupied';
    if (statusRoll > 0.94) status = 'Vacant';
    else if (statusRoll > 0.90) status = 'Notice';
    else if (statusRoll > 0.88) status = 'Down';
    
    const isOccupied = status === 'Occupied' || status === 'Notice';
    const rentVariance = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const effectiveRent = isOccupied ? Math.round(fp.marketRent * (1 + rentVariance)) : 0;
    
    const leaseStart = new Date();
    leaseStart.setMonth(leaseStart.getMonth() - Math.floor(Math.random() * 11));
    const leaseEnd = new Date(leaseStart);
    leaseEnd.setFullYear(leaseEnd.getFullYear() + 1);
    
    data.push({
      id: `unit-${propertyId}-${i}`,
      unit: `${floor}${String(unit).padStart(2, '0')}`,
      floorplan: fp.name,
      sqft: fp.sqft,
      marketRent: fp.marketRent,
      effectiveRent,
      status,
      resident: isOccupied ? `Resident ${i + 1}` : null,
      leaseStart: isOccupied ? leaseStart.toISOString().split('T')[0] : null,
      leaseEnd: isOccupied ? leaseEnd.toISOString().split('T')[0] : null,
      moveInDate: isOccupied ? leaseStart.toISOString().split('T')[0] : null
    });
  }
  
  return data.sort((a, b) => a.unit.localeCompare(b.unit));
}

// Historical data for charts (weekly)
export function generateHistoricalData(weeks = 12) {
  const data = {
    occupancy: [],
    leasing: [],
    delinquency: [],
    revenue: []
  };
  
  let occ = 92 + Math.random() * 4;
  let leases = 8 + Math.floor(Math.random() * 6);
  let delinq = 1 + Math.random() * 1.5;
  let revenue = 480000 + Math.floor(Math.random() * 30000);
  
  for (let i = 0; i < weeks; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (weeks - i - 1) * 7);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    occ += (Math.random() - 0.5) * 1.5;
    occ = Math.max(85, Math.min(98, occ));
    
    leases += Math.floor((Math.random() - 0.5) * 4);
    leases = Math.max(4, Math.min(18, leases));
    
    delinq += (Math.random() - 0.5) * 0.5;
    delinq = Math.max(0.2, Math.min(4, delinq));
    
    revenue += Math.floor((Math.random() - 0.5) * 15000);
    revenue = Math.max(450000, Math.min(550000, revenue));
    
    data.occupancy.push({ label, value: parseFloat(occ.toFixed(1)) });
    data.leasing.push({ label, value: leases });
    data.delinquency.push({ label, value: parseFloat(delinq.toFixed(2)) });
    data.revenue.push({ label, value: revenue });
  }
  
  return data;
}

export default {
  generateLeaseData,
  generateWorkOrderData,
  generateAgentData,
  generateFinancialData,
  generateRentRollData,
  generateHistoricalData
};

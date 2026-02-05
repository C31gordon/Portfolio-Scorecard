/**
 * Mock Data - Portfolio Scorecard v2
 * Realistic sample data for development
 */

export const mockPortfolio = {
  name: 'RISE Residential',
  totalUnits: 8245,
  totalBeds: 12890,
  totalProperties: 18,
  regions: ['Southeast', 'Texas', 'Midwest']
};

export const mockProperties = [
  {
    id: 'prop-001',
    name: 'The Meridian',
    type: 'CON',
    address: { street: '1200 Park Ave', city: 'Jacksonville', state: 'FL', zip: '32204' },
    units: 312,
    beds: null,
    sqft_avg: 985,
    year_built: 2019,
    region: 'Southeast',
    regional_manager: 'Sarah Mitchell',
    general_manager: 'James Wilson',
    submarket_id: 'jax-downtown',
    is_lease_up: false,
    metrics: {
      occupancy: { physical: 94.2, economic: 92.8, leased: 96.1 },
      leasing: { mtd_leads: 145, mtd_tours: 52, mtd_applications: 28, mtd_leases: 18, mtd_cancellations: 2, mtd_denials: 3, lead_to_tour_pct: 35.9, tour_to_app_pct: 53.8, app_to_lease_pct: 64.3, closing_ratio: 34.6 },
      revenue: { avg_rent: 1485, avg_rent_psf: 1.51, new_lease_trade_out: 3.2, renewal_trade_out: 4.1, concessions_mtd: 2400, other_income_mtd: 8950 },
      retention: { renewal_ratio: 58.3, mtd_renewals: 14, mtd_move_outs: 10, avg_tenancy_months: 18.4 },
      delinquency: { current: 1.2, '30_day': 0.8, '60_day': 0.3, '90_plus': 0.1 },
      maintenance: { open_work_orders: 23, avg_completion_days: 2.1, sla_compliance: 94.2, emergency_response_hrs: 1.8 },
      reputation: { google_rating: 4.6, google_reviews: 287, tali_score: 7.4, ora_score: 78, nps: 52 },
      financial: { noi_actual: 428500, noi_budget: 445000, noi_variance: -3.7, revenue_actual: 512000, revenue_budget: 525000, expenses_actual: 83500, expenses_budget: 80000 },
      team: { training_completion: 92, mystery_shop_score: 88, employee_turnover: 18 }
    }
  },
  {
    id: 'prop-002',
    name: 'Lakeside Commons',
    type: 'CON',
    address: { street: '4500 Lake Blvd', city: 'Orlando', state: 'FL', zip: '32801' },
    units: 456,
    beds: null,
    sqft_avg: 1042,
    year_built: 2017,
    region: 'Southeast',
    regional_manager: 'Sarah Mitchell',
    general_manager: 'Maria Garcia',
    submarket_id: 'orl-downtown',
    is_lease_up: false,
    metrics: {
      occupancy: { physical: 96.5, economic: 95.2, leased: 97.8 },
      leasing: { mtd_leads: 198, mtd_tours: 78, mtd_applications: 42, mtd_leases: 32, mtd_cancellations: 3, mtd_denials: 4, lead_to_tour_pct: 39.4, tour_to_app_pct: 53.8, app_to_lease_pct: 76.2, closing_ratio: 41.0 },
      revenue: { avg_rent: 1625, avg_rent_psf: 1.56, new_lease_trade_out: 4.8, renewal_trade_out: 5.2, concessions_mtd: 1800, other_income_mtd: 12400 },
      retention: { renewal_ratio: 62.1, mtd_renewals: 23, mtd_move_outs: 14, avg_tenancy_months: 21.2 },
      delinquency: { current: 0.4, '30_day': 0.2, '60_day': 0.1, '90_plus': 0 },
      maintenance: { open_work_orders: 18, avg_completion_days: 1.8, sla_compliance: 97.1, emergency_response_hrs: 1.2 },
      reputation: { google_rating: 4.7, google_reviews: 412, tali_score: 7.8, ora_score: 82, nps: 58 },
      financial: { noi_actual: 695000, noi_budget: 680000, noi_variance: 2.2, revenue_actual: 825000, revenue_budget: 810000, expenses_actual: 130000, expenses_budget: 130000 },
      team: { training_completion: 98, mystery_shop_score: 94, employee_turnover: 12 }
    }
  },
  {
    id: 'prop-003',
    name: 'University Village',
    type: 'STU',
    address: { street: '800 Campus Dr', city: 'Gainesville', state: 'FL', zip: '32601' },
    units: 280,
    beds: 892,
    sqft_avg: 425,
    year_built: 2021,
    region: 'Southeast',
    regional_manager: 'Sarah Mitchell',
    general_manager: 'David Chen',
    submarket_id: 'gnv-uf',
    is_lease_up: false,
    university: { name: 'University of Florida', enrollment: 52000, enrollment_trend: 'growing' },
    metrics: {
      occupancy: { physical: 99.1, economic: 98.2, leased: 99.4 },
      leasing: { mtd_leads: 85, mtd_tours: 42, mtd_applications: 35, mtd_leases: 28, mtd_cancellations: 1, mtd_denials: 2, lead_to_tour_pct: 49.4, tour_to_app_pct: 83.3, app_to_lease_pct: 80.0, closing_ratio: 66.7 },
      revenue: { avg_rent: 785, avg_rent_psf: 1.85, new_lease_trade_out: 2.5, renewal_trade_out: 3.0, concessions_mtd: 500, other_income_mtd: 4200 },
      retention: { renewal_ratio: 48.2, mtd_renewals: 42, mtd_move_outs: 45, avg_tenancy_months: 11.5 },
      delinquency: { current: 0.8, '30_day': 0.4, '60_day': 0.2, '90_plus': 0.1 },
      maintenance: { open_work_orders: 31, avg_completion_days: 1.5, sla_compliance: 96.8, emergency_response_hrs: 0.8 },
      reputation: { google_rating: 4.4, google_reviews: 524, tali_score: 7.2, ora_score: 75, nps: 45 },
      financial: { noi_actual: 385000, noi_budget: 375000, noi_variance: 2.7, revenue_actual: 498000, revenue_budget: 485000, expenses_actual: 113000, expenses_budget: 110000 },
      team: { training_completion: 88, mystery_shop_score: 82, employee_turnover: 24 }
    }
  },
  {
    id: 'prop-004',
    name: 'Sunset Gardens',
    type: '55+',
    address: { street: '2200 Retirement Ln', city: 'Sarasota', state: 'FL', zip: '34231' },
    units: 198,
    beds: null,
    sqft_avg: 1150,
    year_built: 2015,
    region: 'Southeast',
    regional_manager: 'Sarah Mitchell',
    general_manager: 'Patricia Adams',
    submarket_id: 'srq-55plus',
    is_lease_up: false,
    metrics: {
      occupancy: { physical: 97.5, economic: 97.0, leased: 98.0 },
      leasing: { mtd_leads: 42, mtd_tours: 18, mtd_applications: 12, mtd_leases: 8, mtd_cancellations: 0, mtd_denials: 1, lead_to_tour_pct: 42.9, tour_to_app_pct: 66.7, app_to_lease_pct: 66.7, closing_ratio: 44.4 },
      revenue: { avg_rent: 1875, avg_rent_psf: 1.63, new_lease_trade_out: 2.8, renewal_trade_out: 3.5, concessions_mtd: 0, other_income_mtd: 6800 },
      retention: { renewal_ratio: 82.4, mtd_renewals: 14, mtd_move_outs: 3, avg_tenancy_months: 36.8 },
      delinquency: { current: 0.02, '30_day': 0, '60_day': 0, '90_plus': 0 },
      maintenance: { open_work_orders: 12, avg_completion_days: 1.2, sla_compliance: 98.5, emergency_response_hrs: 0.5 },
      reputation: { google_rating: 4.9, google_reviews: 156, tali_score: 8.4, ora_score: 91, nps: 72 },
      financial: { noi_actual: 312000, noi_budget: 305000, noi_variance: 2.3, revenue_actual: 385000, revenue_budget: 378000, expenses_actual: 73000, expenses_budget: 73000 },
      team: { training_completion: 100, mystery_shop_score: 96, employee_turnover: 8 }
    }
  },
  {
    id: 'prop-005',
    name: 'Cypress Pointe',
    type: 'CON',
    address: { street: '5600 Cypress Rd', city: 'Tampa', state: 'FL', zip: '33607' },
    units: 384,
    beds: null,
    sqft_avg: 998,
    year_built: 2020,
    region: 'Southeast',
    regional_manager: 'Sarah Mitchell',
    general_manager: 'Robert Taylor',
    submarket_id: 'tpa-westshore',
    is_lease_up: false,
    metrics: {
      occupancy: { physical: 87.2, economic: 84.5, leased: 89.1 },
      leasing: { mtd_leads: 210, mtd_tours: 58, mtd_applications: 22, mtd_leases: 12, mtd_cancellations: 4, mtd_denials: 5, lead_to_tour_pct: 27.6, tour_to_app_pct: 37.9, app_to_lease_pct: 54.5, closing_ratio: 20.7 },
      revenue: { avg_rent: 1545, avg_rent_psf: 1.55, new_lease_trade_out: -1.2, renewal_trade_out: 2.1, concessions_mtd: 8500, other_income_mtd: 9200 },
      retention: { renewal_ratio: 42.5, mtd_renewals: 8, mtd_move_outs: 18, avg_tenancy_months: 14.2 },
      delinquency: { current: 3.8, '30_day': 2.1, '60_day': 1.2, '90_plus': 0.5 },
      maintenance: { open_work_orders: 52, avg_completion_days: 4.2, sla_compliance: 78.5, emergency_response_hrs: 3.5 },
      reputation: { google_rating: 3.4, google_reviews: 198, tali_score: 5.8, ora_score: 58, nps: 18 },
      financial: { noi_actual: 385000, noi_budget: 468000, noi_variance: -17.7, revenue_actual: 548000, revenue_budget: 595000, expenses_actual: 163000, expenses_budget: 127000 },
      team: { training_completion: 72, mystery_shop_score: 65, employee_turnover: 45 }
    }
  },
  {
    id: 'prop-006',
    name: 'The Heights at Austin',
    type: 'CON',
    address: { street: '1800 Congress Ave', city: 'Austin', state: 'TX', zip: '78701' },
    units: 425,
    beds: null,
    sqft_avg: 1025,
    year_built: 2022,
    region: 'Texas',
    regional_manager: 'Michael Brown',
    general_manager: 'Jennifer Lee',
    submarket_id: 'aus-downtown',
    is_lease_up: false,
    metrics: {
      occupancy: { physical: 93.8, economic: 92.5, leased: 95.3 },
      leasing: { mtd_leads: 285, mtd_tours: 112, mtd_applications: 58, mtd_leases: 42, mtd_cancellations: 5, mtd_denials: 8, lead_to_tour_pct: 39.3, tour_to_app_pct: 51.8, app_to_lease_pct: 72.4, closing_ratio: 37.5 },
      revenue: { avg_rent: 2150, avg_rent_psf: 2.10, new_lease_trade_out: 2.8, renewal_trade_out: 4.2, concessions_mtd: 4200, other_income_mtd: 15800 },
      retention: { renewal_ratio: 54.2, mtd_renewals: 26, mtd_move_outs: 22, avg_tenancy_months: 16.8 },
      delinquency: { current: 0.6, '30_day': 0.3, '60_day': 0.1, '90_plus': 0 },
      maintenance: { open_work_orders: 28, avg_completion_days: 1.9, sla_compliance: 95.8, emergency_response_hrs: 1.5 },
      reputation: { google_rating: 4.5, google_reviews: 342, tali_score: 7.5, ora_score: 79, nps: 48 },
      financial: { noi_actual: 725000, noi_budget: 710000, noi_variance: 2.1, revenue_actual: 895000, revenue_budget: 880000, expenses_actual: 170000, expenses_budget: 170000 },
      team: { training_completion: 95, mystery_shop_score: 91, employee_turnover: 15 }
    }
  }
];

export const mockSubmarkets = [
  {
    id: 'jax-downtown',
    name: 'Jacksonville Downtown',
    type: 'conventional',
    metrics: { avg_occupancy: 93.5, avg_rent: 1425, avg_rent_psf: 1.48, rent_growth_yoy: 3.2, supply_growth: 2.1, absorption_rate: 85 }
  },
  {
    id: 'orl-downtown',
    name: 'Orlando Downtown',
    type: 'conventional',
    metrics: { avg_occupancy: 94.8, avg_rent: 1580, avg_rent_psf: 1.52, rent_growth_yoy: 4.5, supply_growth: 3.2, absorption_rate: 92 }
  },
  {
    id: 'gnv-uf',
    name: 'Gainesville - UF',
    type: 'student',
    metrics: { avg_occupancy: 97.2, avg_rent: 745, avg_rent_psf: 1.78, rent_growth_yoy: 2.8, supply_growth: 1.5, absorption_rate: 95 }
  },
  {
    id: 'srq-55plus',
    name: 'Sarasota 55+',
    type: 'senior',
    metrics: { avg_occupancy: 96.5, avg_rent: 1750, avg_rent_psf: 1.58, rent_growth_yoy: 3.8, supply_growth: 2.8, absorption_rate: 88 }
  },
  {
    id: 'tpa-westshore',
    name: 'Tampa Westshore',
    type: 'conventional',
    metrics: { avg_occupancy: 92.8, avg_rent: 1520, avg_rent_psf: 1.52, rent_growth_yoy: 2.5, supply_growth: 4.2, absorption_rate: 78 }
  },
  {
    id: 'aus-downtown',
    name: 'Austin Downtown',
    type: 'conventional',
    metrics: { avg_occupancy: 93.2, avg_rent: 2080, avg_rent_psf: 2.05, rent_growth_yoy: 5.2, supply_growth: 4.8, absorption_rate: 82 }
  }
];

export default {
  mockPortfolio,
  mockProperties,
  mockSubmarkets
};

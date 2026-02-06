// New drill cards layout template
// Row 1: Physical Occ, Leased %, Avg Effective Rent, Trade-out (3 lines)
// Row 2: Leasing Funnel (full width)
// Row 3: Lead-to-Tour, Tour-to-Lease, Renewal Ratio, Delinquency
// Row 4: Google, Satisfaction, ORA, Training
// Row 5: NOI vs Budget, WO SLA

const drillCardsTemplate = (prop, propId, isLeaseUp, hist, clicks, traffic, apps, leases, trafPct, appPct, leasePct, getMetricColor, TURNER_TALI_AVG, TURNER_PI_AVG) => `
        <!-- ROW 1: Occupancy & Rent -->
        <div class="drill-grid drill-grid--4">
          <!-- Physical Occupancy -->
          <div class="drill-card drill-card--chart ${isLeaseUp ? 'drill-card--excluded' : ''}" data-metric="physOcc" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Physical Occupancy ${isLeaseUp ? '<span class="excluded-badge">Not Scored</span>' : ''}</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${isLeaseUp ? 'grayed' : getMetricColor(prop.physOcc, 'physOcc', prop.type)}">${prop.physOcc ? (prop.physOcc * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart ${isLeaseUp ? 'chart--grayed' : ''}" id="chart_physOcc_${propId}"></div>
              <div class="drill-card__target">Target: ${prop.type === 'STU' ? '98%' : '93%'}</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_physOcc_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_physOcc_${propId}"></div>
            </div>
          </div>

          <!-- Leased % -->
          <div class="drill-card drill-card--chart ${isLeaseUp ? 'drill-card--excluded' : ''}" data-metric="leased" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Leased Occupancy ${isLeaseUp ? '<span class="excluded-badge">Not Scored</span>' : ''}</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${isLeaseUp ? 'grayed' : getMetricColor(prop.leased, 'leased', prop.type)}">${prop.leased ? (prop.leased * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart ${isLeaseUp ? 'chart--grayed' : ''}" id="chart_leased_${propId}"></div>
              <div class="drill-card__target">Target: ${prop.type === 'STU' ? '98%' : '95%'}</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_leased_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_leased_${propId}"></div>
            </div>
          </div>

          <!-- Avg Effective Rent -->
          <div class="drill-card drill-card--chart" data-metric="avgRent" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Avg Effective Rent</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value">\${prop.avgRent ? '$' + Math.round(prop.avgRent).toLocaleString() : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_avgRent_${propId}"></div>
              <div class="drill-card__target">Trend</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_avgRent_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_avgRent_${propId}"></div>
            </div>
          </div>

          <!-- Trade-Out (3 lines) -->
          <div class="drill-card drill-card--chart" data-metric="tradeOut" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Trade-Out</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value-multi">
              <div class="trade-line">
                <span class="trade-label">New Lease</span>
                <span class="trade-value" style="color: var(--success)">+2.1%</span>
              </div>
              <div class="trade-line">
                <span class="trade-label">Renewal</span>
                <span class="trade-value" style="color: var(--success)">+3.5%</span>
              </div>
              <div class="trade-line trade-line--total">
                <span class="trade-label">Total Avg</span>
                <span class="trade-value" style="color: ${prop.newTradeOut >= 0 ? 'var(--success)' : prop.newTradeOut != null ? 'var(--danger)' : 'inherit'}">
                  ${prop.newTradeOut != null ? (prop.newTradeOut >= 0 ? '+' : '') + (prop.newTradeOut * 100).toFixed(1) + '%' : '—'}
                </span>
              </div>
            </div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_tradeOut_${propId}"></div>
              <div class="drill-card__target">Target: ≥0%</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_tradeOut_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_tradeOut_${propId}"></div>
            </div>
          </div>
        </div>

        <!-- ROW 2: Leasing Funnel (Full Width) -->
        <div class="funnel-section">
          <h4>Leasing Funnel (MTD)</h4>
          <div class="funnel-bar">
            <div class="funnel-step">
              <div class="funnel-step__label">Clicks</div>
              <div class="funnel-step__value">${clicks}</div>
              <div class="funnel-step__pct">—</div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-step">
              <div class="funnel-step__label">Tours</div>
              <div class="funnel-step__value">${traffic}</div>
              <div class="funnel-step__pct">${trafPct}%</div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-step">
              <div class="funnel-step__label">Apps</div>
              <div class="funnel-step__value">${apps}</div>
              <div class="funnel-step__pct">${appPct}%</div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-step">
              <div class="funnel-step__label">Leases</div>
              <div class="funnel-step__value">${leases}</div>
              <div class="funnel-step__pct">${leasePct}%</div>
            </div>
          </div>
        </div>

        <!-- ROW 3: Conversion Metrics -->
        <div class="drill-grid drill-grid--4">
          <!-- Lead-to-Tour -->
          <div class="drill-card drill-card--chart" data-metric="leadToTour" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Lead-to-Tour</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${getMetricColor(prop.leadToTour, 'leadToTour', prop.type)}">${prop.leadToTour ? (prop.leadToTour * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_leadToTour_${propId}"></div>
              <div class="drill-card__target">Target: 30%</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_leadToTour_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_leadToTour_${propId}"></div>
            </div>
          </div>

          <!-- Tour-to-Lease (Closing Ratio) -->
          <div class="drill-card drill-card--chart" data-metric="closingRatio" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Tour-to-Lease</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${getMetricColor(prop.mtdClosing, 'mtdClosing', prop.type)}">${prop.mtdClosing ? (Math.min(prop.mtdClosing, 1) * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_closing_${propId}"></div>
              <div class="drill-card__target">Target: ${prop.type === 'STU' ? '60%' : prop.type === '55+' ? '30%' : '40%'}</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_closing_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_closing_${propId}"></div>
            </div>
          </div>

          <!-- Renewal Ratio -->
          <div class="drill-card drill-card--chart ${isLeaseUp ? 'drill-card--excluded' : ''}" data-metric="renewalRatio" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Renewal Ratio ${isLeaseUp ? '<span class="excluded-badge">Not Scored</span>' : ''}</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${isLeaseUp ? 'grayed' : getMetricColor(prop.renewalRatio, 'renewalRatio', prop.type)}">${prop.renewalRatio ? (prop.renewalRatio * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart ${isLeaseUp ? 'chart--grayed' : ''}" id="chart_renewal_${propId}"></div>
              <div class="drill-card__target">Target: ${prop.type === '55+' ? '75%' : prop.type === 'STU' ? '45%' : '55%'}</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_renewal_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_renewal_${propId}"></div>
            </div>
          </div>

          <!-- Delinquency -->
          <div class="drill-card drill-card--chart ${isLeaseUp ? 'drill-card--excluded' : ''}" data-metric="delinq" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Delinquency ${isLeaseUp ? '<span class="excluded-badge">Not Scored</span>' : ''}</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${isLeaseUp ? 'grayed' : getMetricColor(prop.delinq, 'delinq', prop.type)}">${prop.delinq != null ? (prop.delinq * 100).toFixed(2) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart ${isLeaseUp ? 'chart--grayed' : ''}" id="chart_delinq_${propId}"></div>
              <div class="drill-card__target">Target: ≤${prop.type === '55+' ? '0.025%' : prop.type === 'STU' ? '1%' : '0.5%'}</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_delinq_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_delinq_${propId}"></div>
            </div>
          </div>
        </div>

        <!-- ROW 4: Reputation -->
        <div class="drill-grid drill-grid--4">
          <!-- Google Rating -->
          <div class="drill-card drill-card--chart" data-metric="googleStars" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Google Rating</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value">${prop.googleStars ? prop.googleStars.toFixed(1) + ' ⭐' : '—'}<span class="drill-card__sub">(${prop.googleReviews || 0} reviews)</span></div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_googleStars_${propId}"></div>
              <div class="drill-card__target">Target: ≥4.5</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_googleStars_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_googleStars_${propId}"></div>
            </div>
          </div>

          <!-- TALi (Satisfaction) -->
          <div class="drill-card drill-card--chart" data-metric="tali" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Satisfaction (TALi)</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value">${prop.tali ? prop.tali.toFixed(2) : '—'}<span class="drill-card__sub">(Avg: ${TURNER_TALI_AVG})</span></div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_tali_${propId}"></div>
              <div class="drill-card__target">Target: ≥7.5</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_tali_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_tali_${propId}"></div>
            </div>
          </div>

          <!-- ORA Score -->
          <div class="drill-card drill-card--chart" data-metric="propIndex" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>ORA Score</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value">${prop.propIndex ? prop.propIndex.toFixed(1) : '—'}<span class="drill-card__sub">(Avg: ${TURNER_PI_AVG})</span></div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_propIndex_${propId}"></div>
              <div class="drill-card__target">Target: ≥8.5</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_propIndex_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_propIndex_${propId}"></div>
            </div>
          </div>

          <!-- Training -->
          <div class="drill-card drill-card--chart" data-metric="training" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Training</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${getMetricColor(prop.training, 'training', prop.type)}">${prop.training ? (prop.training * 100).toFixed(0) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_training_${propId}"></div>
              <div class="drill-card__target">Target: 100%</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_training_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_training_${propId}"></div>
            </div>
          </div>
        </div>

        <!-- ROW 5: Operations -->
        <div class="drill-grid drill-grid--2">
          <!-- NOI vs Budget -->
          <div class="drill-card drill-card--chart" data-metric="noiVariance" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>NOI vs Budget</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${getMetricColor(prop.noiVariance, 'noiVariance', prop.type)}">${prop.noiVariance ? (prop.noiVariance * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_noiVariance_${propId}"></div>
              <div class="drill-card__target">Target: ≥100%</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_noiVariance_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_noiVariance_${propId}"></div>
            </div>
          </div>

          <!-- WO SLA -->
          <div class="drill-card drill-card--chart" data-metric="woSla" data-prop="${propId}">
            <div class="drill-card__header">
              <h4>Work Order SLA</h4>
              <div class="view-toggle">
                <button class="view-toggle__btn view-toggle__btn--active" data-view="graph">Graph</button>
                <button class="view-toggle__btn" data-view="table">Table</button>
                <button class="view-toggle__btn" data-view="drillin">Drill In</button>
              </div>
            </div>
            <div class="drill-card__value ${getMetricColor(prop.woSla, 'woSla', prop.type)}">${prop.woSla ? (prop.woSla * 100).toFixed(1) + '%' : '—'}</div>
            <div class="drill-card__view drill-card__view--active" data-view-content="graph">
              <div class="drill-card__chart" id="chart_woSla_${propId}"></div>
              <div class="drill-card__target">Target: 95%</div>
            </div>
            <div class="drill-card__view" data-view-content="table">
              <div class="drill-card__table-view" id="table_woSla_${propId}"></div>
            </div>
            <div class="drill-card__view" data-view-content="drillin">
              <div class="drill-card__drillin" id="drillin_woSla_${propId}"></div>
            </div>
          </div>
        </div>
`;

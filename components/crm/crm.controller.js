/* ============================================================
   CRM Controller
   components/crm/crm.controller.js
   ============================================================ */

angular.module('nexusERP').controller('CrmCtrl', [
  '$scope', '$timeout', 'DS', 'GRID', 'CrmService',
  function ($scope, $timeout, DS, GRID, CrmService) {

    var charts = [];
    var a = function (t, o) { return t.r + o + ')'; };

    $scope.$on('$destroy', function () { charts.forEach(function (c) { c.destroy(); }); });

    $scope.kpis = [
      { icon: 'group',             label: 'Total Customers',   value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'star',              label: 'Avg Satisfaction',  value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'workspace_premium', label: 'Premium Customers', value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'warning',           label: 'High Churn Risk',   value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-error',   barWidth: '0%' },
      { icon: 'monetization_on',   label: 'Avg Lifetime Value',value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' }
    ];

    $timeout(function () {
      CrmService.getData().then(function (rows) {

        /* ── Helpers ── */
        var sign      = function (n) { return n >= 0 ? '+' : ''; };
        var trendIcon = function (n) { return n > 0 ? 'trending_up' : n < 0 ? 'trending_down' : 'trending_flat'; };
        var goodBadge = function (n) { return n >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var badBadge  = function (n) { return n <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var barPct    = function (v, max) { return (max > 0 ? Math.min(100, Math.round(Math.abs(v) / max * 100)) : 0) + '%'; };

        /* ── Computed values ── */
        var totalCust    = rows.length;
        var totalSat     = rows.reduce(function (s, r) { return s + parseFloat(r.SatisfactionScore || 0); }, 0);
        var avgSat       = totalCust > 0 ? (totalSat / totalCust) : 0;
        var premiumCount = rows.filter(function (r) { return r.Segment === 'Premium'; }).length;
        var highChurn    = rows.filter(function (r) { return r.ChurnRisk === 'High'; }).length;
        var totalLTV     = rows.reduce(function (s, r) { return s + parseFloat(r.LifetimeValue || 0); }, 0);
        var avgLTV       = totalCust > 0 ? Math.round(totalLTV / totalCust) : 0;
        var premiumPct   = totalCust > 0 ? Math.round((premiumCount / totalCust) * 100) : 0;
        var churnPct     = totalCust > 0 ? Math.round((highChurn   / totalCust) * 100) : 0;
        var SAT_BENCHMARK = 7.0; /* acceptable satisfaction threshold */
        var satDiff      = parseFloat((avgSat - SAT_BENCHMARK).toFixed(1));
        var maxLTV       = Math.max.apply(null, rows.map(function (r) { return parseFloat(r.LifetimeValue || 0); }));
        var medianLTVApprox = totalLTV / totalCust;
        var ltvVsMedianPct  = medianLTVApprox > 0 ? Math.round(((avgLTV - medianLTVApprox) / medianLTVApprox) * 100) : 0;

        /* ── Update KPI cards ── */
        $scope.kpis[0].value      = totalCust;
        $scope.kpis[0].badge      = '+' + totalCust + ' total';
        $scope.kpis[0].trend      = 'trending_up';
        $scope.kpis[0].badgeClass = 'text-emerald-600 bg-emerald-50';
        $scope.kpis[0].barWidth   = barPct(totalCust, 20);

        $scope.kpis[1].value      = avgSat.toFixed(1) + ' / 10';
        $scope.kpis[1].badge      = sign(satDiff) + satDiff + ' vs 7.0';
        $scope.kpis[1].trend      = trendIcon(satDiff);
        $scope.kpis[1].badgeClass = goodBadge(satDiff);
        $scope.kpis[1].barWidth   = barPct(avgSat, 10);

        $scope.kpis[2].value      = premiumCount;
        $scope.kpis[2].badge      = premiumPct + '% of all';
        $scope.kpis[2].trend      = premiumPct >= 30 ? 'trending_up' : 'trending_down';
        $scope.kpis[2].badgeClass = goodBadge(premiumPct - 30);
        $scope.kpis[2].barWidth   = barPct(premiumCount, totalCust);

        $scope.kpis[3].value      = highChurn + ' Customers';
        $scope.kpis[3].badge      = churnPct + '% at risk';
        $scope.kpis[3].trend      = churnPct > 25 ? 'trending_up' : 'trending_flat';
        $scope.kpis[3].badgeClass = badBadge(churnPct - 25);
        $scope.kpis[3].barWidth   = barPct(highChurn, totalCust);

        $scope.kpis[4].value      = '$' + avgLTV.toLocaleString();
        $scope.kpis[4].badge      = sign(ltvVsMedianPct) + ltvVsMedianPct + '% vs med';
        $scope.kpis[4].trend      = trendIcon(ltvVsMedianPct);
        $scope.kpis[4].badgeClass = goodBadge(ltvVsMedianPct);
        $scope.kpis[4].barWidth   = barPct(avgLTV, maxLTV);

        /* Chart 1 — Pie: Customer Segments */
        var segments  = ['Premium', 'Standard', 'Basic'];
        var segCounts = segments.map(function (s) {
          return rows.filter(function (r) { return r.Segment === s; }).length;
        });
        charts.push(new Chart(document.getElementById('crm-chart1').getContext('2d'), {
          type: 'pie',
          data: { labels: segments, datasets: [{ data: segCounts,
            backgroundColor: [a(DS.primary, 0.80), a(DS.teal, 0.80), a(DS.slate, 0.65)],
            borderColor: '#fff', borderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { padding: 12 } } } }
        }));

        /* Chart 2 — Bar: Avg Satisfaction by Region */
        var regions = ['West', 'East'];
        var avgSats = regions.map(function (rg) {
          var sub = rows.filter(function (r) { return r.Region === rg; });
          return sub.length ? (sub.reduce(function (s, r) { return s + parseFloat(r.SatisfactionScore || 0); }, 0) / sub.length).toFixed(2) : 0;
        });
        charts.push(new Chart(document.getElementById('crm-chart2').getContext('2d'), {
          type: 'bar',
          data: { labels: regions, datasets: [{ label: 'Avg Satisfaction', data: avgSats,
            backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75)], borderRadius: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true, max: 10,
              ticks: { callback: function (v) { return v + '/10'; } } } }
          }
        }));

        /* Chart 3 — Scatter: LTV vs Satisfaction */
        var scatterPts = rows.map(function (r) {
          return { x: parseFloat(r.SatisfactionScore), y: parseFloat(r.LifetimeValue), name: r.Name };
        });
        charts.push(new Chart(document.getElementById('crm-chart3').getContext('2d'), {
          type: 'scatter',
          data: { datasets: [{ label: 'Customers', data: scatterPts,
            backgroundColor: a(DS.blue2, 0.65), pointRadius: 8, pointHoverRadius: 10 }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false },
              tooltip: { callbacks: { label: function (ctx) {
                return ctx.raw.name + ': Score ' + ctx.raw.x + ', LTV $' + ctx.raw.y.toLocaleString();
              } } } },
            scales: {
              x: { grid: GRID, title: { display: true, text: 'Satisfaction Score' }, min: 0, max: 10 },
              y: { grid: GRID, title: { display: true, text: 'Lifetime Value ($)' }, beginAtZero: true,
                ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } }
            }
          }
        }));

        /* Chart 4 — Bar: Support Tickets by Customer */
        var names         = rows.map(function (r) { return r.Name.split(' ')[0]; });
        var tickets       = rows.map(function (r) { return parseFloat(r.SupportTickets || 0); });
        var ticketColors  = rows.map(function (r) {
          return r.ChurnRisk === 'High' ? a(DS.error, 0.75) : r.ChurnRisk === 'Medium' ? a(DS.amber, 0.75) : a(DS.teal, 0.75);
        });
        charts.push(new Chart(document.getElementById('crm-chart4').getContext('2d'), {
          type: 'bar',
          data: { labels: names, datasets: [{ label: 'Support Tickets', data: tickets,
            backgroundColor: ticketColors, borderRadius: 5 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true, ticks: { stepSize: 1 } } }
          }
        }));

        /* Chart 5 — Doughnut: Churn Risk */
        var risks      = ['Low', 'Medium', 'High'];
        var riskCounts = risks.map(function (r) {
          return rows.filter(function (row) { return row.ChurnRisk === r; }).length;
        });
        charts.push(new Chart(document.getElementById('crm-chart5').getContext('2d'), {
          type: 'doughnut',
          data: { labels: risks, datasets: [{ data: riskCounts,
            backgroundColor: [a(DS.teal, 0.80), a(DS.amber, 0.80), a(DS.error, 0.80)],
            borderColor: '#fff', borderWidth: 2, hoverOffset: 8 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
            plugins: { legend: { position: 'bottom', labels: { padding: 12 } } } }
        }));
      });
    }, 100);
  }
]);

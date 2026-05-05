/* ============================================================
   Finance Controller
   components/finance/finance.controller.js
   ============================================================ */

angular.module('nexusERP').controller('FinanceCtrl', [
  '$scope', '$timeout', 'DS', 'GRID', 'FinanceService',
  function ($scope, $timeout, DS, GRID, FinanceService) {

    var charts = [];
    var a = function (t, o) { return t.r + o + ')'; };

    $scope.$on('$destroy', function () { charts.forEach(function (c) { c.destroy(); }); });

    $scope.kpis = [
      { icon: 'payments',       label: 'Sales Revenue',     value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'receipt_long',   label: 'Total Expenses',    value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-error',   barWidth: '0%' },
      { icon: 'show_chart',     label: 'Sales Dept Profit', value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'calendar_month', label: 'Avg Monthly Rev',   value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'campaign',       label: 'Ad & Ops Spend',    value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-error',   barWidth: '0%' }
    ];

    $timeout(function () {
      FinanceService.getData().then(function (rows) {

        var months      = ['2025-01', '2025-02', '2025-03', '2025-04'];
        var monthLabels = ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025'];
        var depts       = ['Sales', 'Marketing', 'Operations'];

        var revenue  = months.map(function (m) {
          return rows.filter(function (r) { return r.Date === m; })
                     .reduce(function (s, r) { return s + parseFloat(r.Revenue  || 0); }, 0);
        });
        var expenses = months.map(function (m) {
          return rows.filter(function (r) { return r.Date === m; })
                     .reduce(function (s, r) { return s + parseFloat(r.Expenses || 0); }, 0);
        });

        /* ── Helpers ── */
        var sign      = function (n) { return n >= 0 ? '+' : ''; };
        var trendIcon = function (n) { return n > 0 ? 'trending_up' : n < 0 ? 'trending_down' : 'trending_flat'; };
        var goodBadge = function (n) { return n >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var badBadge  = function (n) { return n <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var barPct    = function (v, max) { return (max > 0 ? Math.min(100, Math.round(Math.abs(v) / max * 100)) : 0) + '%'; };

        /* ── Computed values ── */
        var totalRev     = revenue.reduce(function (s, v) { return s + v; }, 0);
        var totalExp     = expenses.reduce(function (s, v) { return s + v; }, 0);
        var salesProfit  = rows.filter(function (r) { return r.Department === 'Sales'; })
                              .reduce(function (s, r) { return s + parseFloat(r.Profit || 0); }, 0);
        var adsOps       = rows.filter(function (r) { return r.Department === 'Marketing' || r.Department === 'Operations'; })
                              .reduce(function (s, r) { return s + parseFloat(r.Expenses || 0); }, 0);
        var avgRev       = totalRev / months.length;
        var maxVal       = Math.max(totalRev, totalExp, 1);

        /* Period-over-period: first 2 months vs last 2 months */
        var h1Rev = revenue[0] + revenue[1],  h2Rev = revenue[2] + revenue[3];
        var h1Exp = expenses[0] + expenses[1], h2Exp = expenses[2] + expenses[3];
        var revPct  = h1Rev > 0 ? Math.round(((h2Rev - h1Rev) / h1Rev) * 100) : 0;
        var expPct  = h1Exp > 0 ? Math.round(((h2Exp - h1Exp) / h1Exp) * 100) : 0;
        var marginPct  = totalRev > 0 ? Math.round((salesProfit / totalRev) * 100) : 0;
        var adsOpsPct  = totalExp > 0 ? Math.round((adsOps / totalExp) * 100) : 0;

        /* ── Update KPI cards ── */
        $scope.kpis[0].value = '$' + Math.round(totalRev / 1000) + 'K';
        $scope.kpis[0].badge = sign(revPct) + revPct + '% vs H1';
        $scope.kpis[0].trend = trendIcon(revPct);
        $scope.kpis[0].badgeClass = goodBadge(revPct);
        $scope.kpis[0].barWidth   = barPct(totalRev, maxVal);

        $scope.kpis[1].value = '$' + Math.round(totalExp / 1000) + 'K';
        $scope.kpis[1].badge = sign(expPct) + expPct + '% vs H1';
        $scope.kpis[1].trend = trendIcon(expPct);
        $scope.kpis[1].badgeClass = badBadge(expPct);
        $scope.kpis[1].barWidth   = barPct(totalExp, maxVal);

        $scope.kpis[2].value = '$' + Math.round(salesProfit / 1000) + 'K';
        $scope.kpis[2].badge = marginPct + '% margin';
        $scope.kpis[2].trend = marginPct > 0 ? 'trending_up' : 'trending_down';
        $scope.kpis[2].badgeClass = goodBadge(marginPct);
        $scope.kpis[2].barWidth   = barPct(Math.max(0, salesProfit), maxVal);

        $scope.kpis[3].value = '$' + Math.round(avgRev / 1000) + 'K';
        $scope.kpis[3].badge = sign(revPct) + revPct + '%';
        $scope.kpis[3].trend = trendIcon(revPct);
        $scope.kpis[3].badgeClass = goodBadge(revPct);
        $scope.kpis[3].barWidth   = barPct(avgRev, maxVal / months.length);

        $scope.kpis[4].value = '$' + Math.round(adsOps / 1000) + 'K';
        $scope.kpis[4].badge = adsOpsPct + '% of exp';
        $scope.kpis[4].trend = adsOpsPct > 50 ? 'trending_up' : 'trending_flat';
        $scope.kpis[4].badgeClass = adsOpsPct > 55 ? 'text-red-600 bg-red-50' : 'text-slate-600 bg-slate-100';
        $scope.kpis[4].barWidth   = barPct(adsOps, totalExp);

        /* Chart 1 — Line: Revenue vs Expenses */
        charts.push(new Chart(document.getElementById('fin-chart1').getContext('2d'), {
          type: 'line',
          data: {
            labels: monthLabels,
            datasets: [
              { label: 'Revenue ($)',  data: revenue,  borderColor: DS.primary.s, backgroundColor: a(DS.primary, 0.08), borderWidth: 2, pointRadius: 5, tension: 0.35, fill: false },
              { label: 'Expenses ($)', data: expenses, borderColor: DS.error.s,   backgroundColor: a(DS.error,   0.08), borderWidth: 2, pointRadius: 5, tension: 0.35, fill: false }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } } }
          }
        }));

        /* Chart 2 — Bar: Profit by Department */
        var profit = depts.map(function (d) {
          return rows.filter(function (r) { return r.Department === d; })
                     .reduce(function (s, r) { return s + parseFloat(r.Profit || 0); }, 0);
        });
        charts.push(new Chart(document.getElementById('fin-chart2').getContext('2d'), {
          type: 'bar',
          data: { labels: depts, datasets: [{ label: 'Net Profit ($)', data: profit,
            backgroundColor: [a(DS.primary, 0.75), a(DS.error, 0.70), a(DS.slate, 0.65)], borderRadius: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } } }
          }
        }));

        /* Chart 3 — Pie: Expense Categories */
        var costTypes   = ['Operational', 'Advertising', 'Logistics'];
        var costAmounts = costTypes.map(function (ct) {
          return rows.filter(function (r) { return r.Cost_Type === ct; })
                     .reduce(function (s, r) { return s + parseFloat(r.Expenses || 0); }, 0);
        });
        charts.push(new Chart(document.getElementById('fin-chart3').getContext('2d'), {
          type: 'pie',
          data: { labels: costTypes, datasets: [{ data: costAmounts,
            backgroundColor: [a(DS.primary, 0.80), a(DS.teal, 0.80), a(DS.amber, 0.80)],
            borderColor: '#fff', borderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { padding: 12 } } } }
        }));

        /* Chart 4 — Stacked Bar: Dept Spending by Region */
        var regions = ['West', 'East'];
        charts.push(new Chart(document.getElementById('fin-chart4').getContext('2d'), {
          type: 'bar',
          data: {
            labels: regions,
            datasets: depts.map(function (d, i) {
              return {
                label: d,
                data: regions.map(function (rg) {
                  return rows.filter(function (r) { return r.Department === d && r.Region === rg; })
                             .reduce(function (s, r) { return s + parseFloat(r.Expenses || 0); }, 0);
                }),
                backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75), a(DS.amber, 0.75)][i],
                borderRadius: 4
              };
            })
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { x: { stacked: true, grid: GRID }, y: { stacked: true, grid: GRID, beginAtZero: true,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } } }
          }
        }));

        /* Chart 5 — Area: Monthly Revenue Trend */
        charts.push(new Chart(document.getElementById('fin-chart5').getContext('2d'), {
          type: 'line',
          data: { labels: monthLabels, datasets: [{ label: 'Revenue ($)', data: revenue,
            borderColor: DS.teal.s, backgroundColor: a(DS.teal, 0.25),
            borderWidth: 2.5, pointRadius: 5, tension: 0.4, fill: true }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } } }
          }
        }));
      });
    }, 100);
  }
]);

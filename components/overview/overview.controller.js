/* ============================================================
   Overview Controller
   components/overview/overview.controller.js
   Loads data from FinanceService, SalesService, CrmService,
   ProductionService and renders 4 cross-module overview charts.
   ============================================================ */

angular.module('nexusERP').controller('OverviewCtrl', [
  '$scope', '$timeout', 'DS', 'GRID',
  'FinanceService', 'SalesService', 'CrmService', 'ProductionService',
  function ($scope, $timeout, DS, GRID, FinanceService, SalesService, CrmService, ProductionService) {

    var charts = [];
    var a = function (t, o) { return t.r + o + ')'; };

    /* Destroy charts on route change to prevent canvas re-use errors */
    $scope.$on('$destroy', function () {
      charts.forEach(function (c) { c.destroy(); });
    });

    /* ── Helpers (available to all service callbacks) ── */
    var sign      = function (n) { return n >= 0 ? '+' : ''; };
    var trendIcon = function (n) { return n > 0 ? 'trending_up' : n < 0 ? 'trending_down' : 'trending_flat'; };
    var goodBadge = function (n) { return n >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
    var badBadge  = function (n) { return n <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
    var barPct    = function (v, max) { return (max > 0 ? Math.min(100, Math.round(Math.abs(v) / max * 100)) : 0) + '%'; };

    $scope.kpis = [
      { icon: 'account_balance',       label: 'Sales Revenue',    value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'trending_up',           label: 'Sales Orders',     value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'people',                label: 'Active Customers', value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'precision_manufacturing',label: 'Units Produced',  value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'bug_report',            label: 'Defect Rate',      value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-error',   barWidth: '0%' }
    ];

    $timeout(function () {

      /* ── Chart 1: Finance — Monthly Revenue (finance.csv) ── */
      FinanceService.getData().then(function (rows) {
        var months = ['2025-01', '2025-02', '2025-03', '2025-04'];
        var monthLabels = ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025'];
        var revenue = months.map(function (m) {
          return rows.filter(function (r) { return r.Date === m; })
                     .reduce(function (s, r) { return s + parseFloat(r.Revenue || 0); }, 0);
        });
        var totalRev = revenue.reduce(function (s, v) { return s + v; }, 0);
        var h1Rev = revenue[0] + revenue[1], h2Rev = revenue[2] + revenue[3];
        var revPct = h1Rev > 0 ? Math.round(((h2Rev - h1Rev) / h1Rev) * 100) : 0;

        $scope.kpis[0].value      = '$' + Math.round(totalRev / 1000) + 'K';
        $scope.kpis[0].badge      = sign(revPct) + revPct + '% vs H1';
        $scope.kpis[0].trend      = trendIcon(revPct);
        $scope.kpis[0].badgeClass = goodBadge(revPct);
        $scope.kpis[0].barWidth   = barPct(totalRev, 800000);

        charts.push(new Chart(document.getElementById('ov-chart1').getContext('2d'), {
          type: 'line',
          data: {
            labels: monthLabels,
            datasets: [{ label: 'Revenue ($)', data: revenue,
              borderColor: DS.primary.s, backgroundColor: a(DS.primary, 0.18),
              borderWidth: 2.5, pointRadius: 5, tension: 0.4, fill: true }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } } }
          }
        }));
      });

      /* ── Chart 2: Sales — Revenue by Product (sales.csv) ── */
      SalesService.getData().then(function (rows) {
        var products = ['Laptop', 'Phone', 'Tablet', 'Monitor'];
        var prodRev  = products.map(function (p) {
          return rows.filter(function (r) { return r.Product === p; })
                     .reduce(function (s, r) { return s + parseFloat(r.TotalRevenue || 0); }, 0);
        });
        var totalSalesRev = prodRev.reduce(function (s, v) { return s + v; }, 0);
        var monthMap = { '2025-01': 0, '2025-02': 0, '2025-03': 0, '2025-04': 0 };
        rows.forEach(function (r) { var m = r.Date.slice(0,7); if (m in monthMap) monthMap[m] += parseFloat(r.TotalRevenue || 0); });
        var mv = Object.values(monthMap);
        var h1 = mv[0] + mv[1], h2 = mv[2] + mv[3];
        var ordPct = h1 > 0 ? Math.round(((h2 - h1) / h1) * 100) : 0;

        $scope.kpis[1].value      = '$' + Math.round(totalSalesRev / 1000) + 'K';
        $scope.kpis[1].badge      = sign(ordPct) + ordPct + '% vs H1';
        $scope.kpis[1].trend      = trendIcon(ordPct);
        $scope.kpis[1].badgeClass = goodBadge(ordPct);
        $scope.kpis[1].barWidth   = barPct(rows.length, 20);

        charts.push(new Chart(document.getElementById('ov-chart2').getContext('2d'), {
          type: 'bar',
          data: {
            labels: products,
            datasets: [{ label: 'Revenue ($)', data: prodRev,
              backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75), a(DS.amber, 0.75), a(DS.slate, 0.65)],
              borderRadius: 6 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } } }
          }
        }));
      });

      /* ── Chart 3: CRM — Customer Segments (customers.csv) ── */
      CrmService.getData().then(function (rows) {
        var avgSat = rows.length > 0
          ? (rows.reduce(function (s, r) { return s + parseFloat(r.SatisfactionScore || 0); }, 0) / rows.length)
          : 0;
        var satDiff = parseFloat((avgSat - 7.0).toFixed(1));

        $scope.kpis[2].value      = rows.length + ' Active';
        $scope.kpis[2].badge      = avgSat.toFixed(1) + '/10 sat';
        $scope.kpis[2].trend      = trendIcon(satDiff);
        $scope.kpis[2].badgeClass = goodBadge(satDiff);
        $scope.kpis[2].barWidth   = barPct(rows.length, 20);

        /* Segment counts needed for the chart */
        var segments  = ['Premium', 'Standard', 'Basic'];
        var segCounts = segments.map(function (s) {
          return rows.filter(function (r) { return r.Segment === s; }).length;
        });

        charts.push(new Chart(document.getElementById('ov-chart3').getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: segments,
            datasets: [{ data: segCounts,
              backgroundColor: [a(DS.primary, 0.80), a(DS.teal, 0.80), a(DS.slate, 0.65)],
              borderColor: '#fff', borderWidth: 2, hoverOffset: 8 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: { legend: { position: 'right', labels: { padding: 16 } } }
          }
        }));
      });

      /* ── Chart 4: Production — Day vs Night (production.csv) ── */
      ProductionService.getData().then(function (rows) {
        var products = ['P101', 'P102', 'P103', 'P104'];
        var totalUnits   = rows.reduce(function (s, r) { return s + parseFloat(r.UnitsProduced  || 0); }, 0);
        var totalDefects = rows.reduce(function (s, r) { return s + parseFloat(r.DefectiveUnits || 0); }, 0);
        var defectRate   = totalUnits > 0 ? parseFloat(((totalDefects / totalUnits) * 100).toFixed(2)) : 0;
        var dayTotal     = rows.filter(function (r) { return r.Shift === 'Day'; })
                              .reduce(function (s, r) { return s + parseFloat(r.UnitsProduced || 0); }, 0);
        var dayPct = totalUnits > 0 ? Math.round((dayTotal / totalUnits) * 100) : 0;
        var dayUnits  = products.map(function (p) {
          return rows.filter(function (r) { return r.ProductID === p && r.Shift === 'Day'; })
                     .reduce(function (s, r) { return s + parseFloat(r.UnitsProduced || 0); }, 0);
        });
        var nightUnits = products.map(function (p) {
          return rows.filter(function (r) { return r.ProductID === p && r.Shift === 'Night'; })
                     .reduce(function (s, r) { return s + parseFloat(r.UnitsProduced || 0); }, 0);
        });

        $scope.kpis[3].value      = totalUnits.toLocaleString();
        $scope.kpis[3].badge      = dayPct + '% day shift';
        $scope.kpis[3].trend      = 'trending_up';
        $scope.kpis[3].badgeClass = 'text-emerald-600 bg-emerald-50';
        $scope.kpis[3].barWidth   = barPct(totalUnits, 6000);

        $scope.kpis[4].value      = totalDefects + ' units';
        $scope.kpis[4].badge      = defectRate + '% rate';
        $scope.kpis[4].trend      = defectRate > 5 ? 'trending_up' : 'trending_down';
        $scope.kpis[4].badgeClass = badBadge(defectRate - 5);
        $scope.kpis[4].barWidth   = barPct(totalDefects, totalUnits);

        charts.push(new Chart(document.getElementById('ov-chart4').getContext('2d'), {
          type: 'bar',
          data: {
            labels: products,
            datasets: [
              { label: 'Day Shift',   data: dayUnits,   backgroundColor: a(DS.primary, 0.75), borderRadius: 4 },
              { label: 'Night Shift', data: nightUnits, backgroundColor: a(DS.teal,    0.75), borderRadius: 4 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { x: { stacked: true, grid: GRID }, y: { stacked: true, grid: GRID, beginAtZero: true } }
          }
        }));
      });

    }, 100);
  }
]);

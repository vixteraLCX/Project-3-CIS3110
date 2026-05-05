/* ============================================================
   Sales Controller
   components/sales/sales.controller.js
   ============================================================ */

angular.module('nexusERP').controller('SalesCtrl', [
  '$scope', '$timeout', 'DS', 'GRID', 'SalesService',
  function ($scope, $timeout, DS, GRID, SalesService) {

    var charts = [];
    var a = function (t, o) { return t.r + o + ')'; };

    $scope.$on('$destroy', function () { charts.forEach(function (c) { c.destroy(); }); });

    $scope.kpis = [
      { icon: 'attach_money', label: 'Total Revenue',    value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'receipt',      label: 'Total Orders',     value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'smartphone',   label: 'Top Product',      value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'person',       label: 'Top Sales Rep',    value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'shopping_bag', label: 'Avg Order Value',  value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' }
    ];

    $timeout(function () {
      SalesService.getData().then(function (rows) {

        var sumRev = function (arr) {
          return arr.reduce(function (s, r) { return s + parseFloat(r.TotalRevenue || 0); }, 0);
        };

        /* ── Helpers ── */
        var sign      = function (n) { return n >= 0 ? '+' : ''; };
        var trendIcon = function (n) { return n > 0 ? 'trending_up' : n < 0 ? 'trending_down' : 'trending_flat'; };
        var goodBadge = function (n) { return n >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var barPct    = function (v, max) { return (max > 0 ? Math.min(100, Math.round(Math.abs(v) / max * 100)) : 0) + '%'; };

        /* ── Aggregations ── */
        var totalRev = sumRev(rows);
        var products = ['Laptop', 'Phone', 'Tablet', 'Monitor'];
        var prodRevs = products.map(function (p) { return sumRev(rows.filter(function (r) { return r.Product === p; })); });
        var topProdIdx = prodRevs.indexOf(Math.max.apply(null, prodRevs));
        var reps = ['Alice', 'Bob', 'Charlie'];
        var repRevs = reps.map(function (rp) { return sumRev(rows.filter(function (r) { return r.SalesRep === rp; })); });
        var topRepIdx = repRevs.indexOf(Math.max.apply(null, repRevs));
        var avgOrder  = totalRev / rows.length;

        /* Period-over-period via monthly buckets */
        var monthMap = { '2025-01': 0, '2025-02': 0, '2025-03': 0, '2025-04': 0 };
        var monthCnt = { '2025-01': 0, '2025-02': 0, '2025-03': 0, '2025-04': 0 };
        rows.forEach(function (r) {
          var m = r.Date.slice(0, 7);
          if (m in monthMap) { monthMap[m] += parseFloat(r.TotalRevenue || 0); monthCnt[m]++; }
        });
        var monthLabels  = ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025'];
        var monthRevenue = Object.values(monthMap);
        var monthOrders  = Object.values(monthCnt);
        var h1Rev = monthRevenue[0] + monthRevenue[1], h2Rev = monthRevenue[2] + monthRevenue[3];
        var h1Ord = monthOrders[0]  + monthOrders[1],  h2Ord = monthOrders[2]  + monthOrders[3];
        var revPct = h1Rev > 0 ? Math.round(((h2Rev - h1Rev) / h1Rev) * 100) : 0;
        var h1Avg  = h1Ord > 0 ? h1Rev / h1Ord : 0;
        var h2Avg  = h2Ord > 0 ? h2Rev / h2Ord : 0;
        var avgPct = h1Avg > 0 ? Math.round(((h2Avg - h1Avg) / h1Avg) * 100) : 0;
        var topProdPct = totalRev > 0 ? Math.round((prodRevs[topProdIdx] / totalRev) * 100) : 0;
        var topRepPct  = totalRev > 0 ? Math.round((repRevs[topRepIdx]  / totalRev) * 100) : 0;

        /* ── Update KPI cards ── */
        $scope.kpis[0].value = '$' + totalRev.toLocaleString();
        $scope.kpis[0].badge = sign(revPct) + revPct + '% vs H1';
        $scope.kpis[0].trend = trendIcon(revPct);
        $scope.kpis[0].badgeClass = goodBadge(revPct);
        $scope.kpis[0].barWidth   = barPct(totalRev, 100000);

        $scope.kpis[1].value = rows.length;
        $scope.kpis[1].badge = rows.length + ' orders';
        $scope.kpis[1].trend = h2Ord >= h1Ord ? 'trending_up' : 'trending_down';
        $scope.kpis[1].badgeClass = goodBadge(h2Ord - h1Ord);
        $scope.kpis[1].barWidth   = barPct(rows.length, 20);

        $scope.kpis[2].value = products[topProdIdx] + ' $' + Math.round(prodRevs[topProdIdx] / 1000) + 'K';
        $scope.kpis[2].badge = topProdPct + '% of rev';
        $scope.kpis[2].trend = 'trending_up';
        $scope.kpis[2].badgeClass = 'text-emerald-600 bg-emerald-50';
        $scope.kpis[2].barWidth   = barPct(prodRevs[topProdIdx], totalRev);

        $scope.kpis[3].value = reps[topRepIdx] + ' $' + Math.round(repRevs[topRepIdx] / 1000) + 'K';
        $scope.kpis[3].badge = topRepPct + '% of rev';
        $scope.kpis[3].trend = 'trending_up';
        $scope.kpis[3].badgeClass = 'text-emerald-600 bg-emerald-50';
        $scope.kpis[3].barWidth   = barPct(repRevs[topRepIdx], totalRev);

        $scope.kpis[4].value = '$' + Math.round(avgOrder).toLocaleString();
        $scope.kpis[4].badge = sign(avgPct) + avgPct + '% vs H1';
        $scope.kpis[4].trend = trendIcon(avgPct);
        $scope.kpis[4].badgeClass = goodBadge(avgPct);
        $scope.kpis[4].barWidth   = barPct(avgOrder, 10000);

        /* Chart 1 — Line: Revenue over time */
        charts.push(new Chart(document.getElementById('sal-chart1').getContext('2d'), {
          type: 'line',
          data: { labels: monthLabels, datasets: [{ label: 'Revenue ($)', data: monthRevenue,
            borderColor: DS.primary.s, backgroundColor: a(DS.primary, 0.10),
            borderWidth: 2, pointRadius: 5, tension: 0.35, fill: false }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(1) + 'K'; } } } }
          }
        }));

        /* Chart 2 — Bar: Revenue by Product */
        charts.push(new Chart(document.getElementById('sal-chart2').getContext('2d'), {
          type: 'bar',
          data: { labels: products, datasets: [{ label: 'Revenue ($)', data: prodRevs,
            backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75), a(DS.amber, 0.75), a(DS.slate, 0.65)],
            borderRadius: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } } }
          }
        }));

        /* Chart 3 — Pie: Sales by Region */
        var regions  = ['West', 'East'];
        var regRevs  = regions.map(function (rg) { return sumRev(rows.filter(function (r) { return r.Region === rg; })); });
        charts.push(new Chart(document.getElementById('sal-chart3').getContext('2d'), {
          type: 'pie',
          data: { labels: regions, datasets: [{ data: regRevs,
            backgroundColor: [a(DS.primary, 0.80), a(DS.teal, 0.80)],
            borderColor: '#fff', borderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { padding: 12 } } } }
        }));

        /* Chart 4 — Scatter: Units Sold vs Revenue */
        var scatterPts = rows.map(function (r) {
          return { x: parseFloat(r.UnitsSold), y: parseFloat(r.TotalRevenue), label: r.Product };
        });
        charts.push(new Chart(document.getElementById('sal-chart4').getContext('2d'), {
          type: 'scatter',
          data: { datasets: [{ label: 'Orders', data: scatterPts,
            backgroundColor: a(DS.blue2, 0.65), pointRadius: 7, pointHoverRadius: 9 }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false },
              tooltip: { callbacks: { label: function (ctx) {
                return ctx.raw.label + ': ' + ctx.raw.x + ' units / $' + ctx.raw.y.toLocaleString();
              } } } },
            scales: {
              x: { grid: GRID, title: { display: true, text: 'Units Sold' }, beginAtZero: true },
              y: { grid: GRID, title: { display: true, text: 'Revenue ($)' }, beginAtZero: true,
                ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } }
            }
          }
        }));

        /* Chart 5 — Bar: Revenue by Sales Rep */
        charts.push(new Chart(document.getElementById('sal-chart5').getContext('2d'), {
          type: 'bar',
          data: { labels: reps, datasets: [{ label: 'Revenue ($)', data: repRevs,
            backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75), a(DS.amber, 0.75)], borderRadius: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true,
              ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } } }
          }
        }));
      });
    }, 100);
  }
]);

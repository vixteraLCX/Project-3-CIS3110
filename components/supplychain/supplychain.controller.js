/* ============================================================
   Supply Chain Controller
   components/supplychain/supplychain.controller.js
   ============================================================ */

angular.module('nexusERP').controller('SupplyChainCtrl', [
  '$scope', '$timeout', 'DS', 'GRID', 'SupplyChainService',
  function ($scope, $timeout, DS, GRID, SupplyChainService) {

    var charts = [];
    var a = function (t, o) { return t.r + o + ')'; };

    $scope.$on('$destroy', function () { charts.forEach(function (c) { c.destroy(); }); });

    $scope.kpis = [
      { icon: 'package_2',    label: 'Total Orders',     value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'check_circle', label: 'On-Time Delivery', value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'timer',        label: 'Avg Lead Time',    value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'inventory',    label: 'Total Quantity',   value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'warning',      label: 'Delayed Orders',   value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-error',   barWidth: '0%' }
    ];

    $timeout(function () {
      SupplyChainService.getData().then(function (rows) {

        /* ── Helpers ── */
        var sign      = function (n) { return n >= 0 ? '+' : ''; };
        var trendIcon = function (n) { return n > 0 ? 'trending_up' : n < 0 ? 'trending_down' : 'trending_flat'; };
        var goodBadge = function (n) { return n >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var badBadge  = function (n) { return n <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var barPct    = function (v, max) { return (max > 0 ? Math.min(100, Math.round(Math.abs(v) / max * 100)) : 0) + '%'; };

        /* ── Computed values ── */
        var totalOrders  = rows.length;
        var onTime       = rows.filter(function (r) { return r.Status === 'Delivered'; }).length;
        var delayed      = rows.filter(function (r) { return r.Status === 'Delayed'; }).length;
        var totalQty     = rows.reduce(function (s, r) { return s + parseFloat(r.Quantity || 0); }, 0);
        var totalLead    = rows.reduce(function (s, r) { return s + parseFloat(r.LeadTimeDays || 0); }, 0);
        var avgLead      = totalOrders > 0 ? parseFloat((totalLead / totalOrders).toFixed(1)) : 0;
        var onTimePct    = totalOrders > 0 ? parseFloat(((onTime   / totalOrders) * 100).toFixed(1)) : 0;
        var delayedPct   = totalOrders > 0 ? parseFloat(((delayed  / totalOrders) * 100).toFixed(1)) : 0;
        /* Lead time vs 5-day benchmark */
        var LEAD_BENCH   = 5;
        var leadDiff     = parseFloat((avgLead - LEAD_BENCH).toFixed(1));
        /* Supplier with best avg lead time */
        var suppliers    = ['Supplier A', 'Supplier B', 'Supplier C'];
        var supLeads     = suppliers.map(function (s) {
          var sub = rows.filter(function (r) { return r.SupplierName === s; });
          return sub.length ? sub.reduce(function (t, r) { return t + parseFloat(r.LeadTimeDays || 0); }, 0) / sub.length : 999;
        });
        var bestSupIdx   = supLeads.indexOf(Math.min.apply(null, supLeads));

        /* ── Update KPI cards ── */
        $scope.kpis[0].value      = totalOrders;
        $scope.kpis[0].badge      = totalOrders + ' orders';
        $scope.kpis[0].trend      = 'trending_up';
        $scope.kpis[0].badgeClass = 'text-emerald-600 bg-emerald-50';
        $scope.kpis[0].barWidth   = barPct(totalOrders, 20);

        $scope.kpis[1].value      = onTime + ' / ' + totalOrders;
        $scope.kpis[1].badge      = onTimePct + '% on time';
        $scope.kpis[1].trend      = onTimePct >= 80 ? 'trending_up' : onTimePct >= 60 ? 'trending_flat' : 'trending_down';
        $scope.kpis[1].badgeClass = goodBadge(onTimePct - 70);
        $scope.kpis[1].barWidth   = barPct(onTime, totalOrders);

        $scope.kpis[2].value      = avgLead + ' days';
        $scope.kpis[2].badge      = (leadDiff >= 0 ? '+' : '') + leadDiff + ' vs 5d';
        $scope.kpis[2].trend      = trendIcon(-leadDiff); /* fewer days = better */
        $scope.kpis[2].badgeClass = leadDiff <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-100';
        $scope.kpis[2].barWidth   = barPct(avgLead, 10);

        $scope.kpis[3].value      = totalQty.toLocaleString() + ' units';
        $scope.kpis[3].badge      = suppliers[bestSupIdx] + ' fastest';
        $scope.kpis[3].trend      = 'trending_up';
        $scope.kpis[3].badgeClass = 'text-emerald-600 bg-emerald-50';
        $scope.kpis[3].barWidth   = barPct(totalQty, 2000);

        $scope.kpis[4].value      = delayed + ' / ' + totalOrders;
        $scope.kpis[4].badge      = delayedPct + '% delayed';
        $scope.kpis[4].trend      = delayedPct > 30 ? 'trending_up' : 'trending_flat';
        $scope.kpis[4].badgeClass = badBadge(delayedPct - 30);
        $scope.kpis[4].barWidth   = barPct(delayed, totalOrders);

        /* Chart 1 — Line: Lead Time Trend by Order */
        var orderIds  = rows.map(function (r) { return 'Order ' + r.OrderID; });
        var leadTimes = rows.map(function (r) { return parseFloat(r.LeadTimeDays || 0); });
        var ptColors  = rows.map(function (r) { return r.Status === 'Delayed' ? DS.error.s : DS.teal.s; });

        charts.push(new Chart(document.getElementById('sc-chart1').getContext('2d'), {
          type: 'line',
          data: { labels: orderIds, datasets: [{ label: 'Lead Time (days)', data: leadTimes,
            borderColor: DS.primary.s, backgroundColor: a(DS.primary, 0.10),
            borderWidth: 2, pointRadius: 6, pointBackgroundColor: ptColors, tension: 0.3, fill: false }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
              x: { grid: GRID, ticks: { maxRotation: 30 } },
              y: { grid: GRID, beginAtZero: true, title: { display: true, text: 'Days' } }
            }
          }
        }));

        /* Chart 2 — Bar: Avg Lead Time by Supplier */
        var suppliers = ['Supplier A', 'Supplier B', 'Supplier C'];
        var avgLeads  = suppliers.map(function (s) {
          var sub = rows.filter(function (r) { return r.SupplierName === s; });
          return sub.length
            ? (sub.reduce(function (t, r) { return t + parseFloat(r.LeadTimeDays || 0); }, 0) / sub.length).toFixed(1)
            : 0;
        });
        charts.push(new Chart(document.getElementById('sc-chart2').getContext('2d'), {
          type: 'bar',
          data: { labels: suppliers, datasets: [{ label: 'Avg Lead Time (days)', data: avgLeads,
            backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75), a(DS.amber, 0.75)], borderRadius: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true, title: { display: true, text: 'Days' } } }
          }
        }));

        /* Chart 3 — Pie: Order Status Distribution */
        var statuses      = ['Delivered', 'Delayed'];
        var statusCounts  = statuses.map(function (s) {
          return rows.filter(function (r) { return r.Status === s; }).length;
        });
        charts.push(new Chart(document.getElementById('sc-chart3').getContext('2d'), {
          type: 'pie',
          data: { labels: statuses, datasets: [{ data: statusCounts,
            backgroundColor: [a(DS.teal, 0.80), a(DS.error, 0.80)],
            borderColor: '#fff', borderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { padding: 12 } } } }
        }));

        /* Chart 4 — Scatter: Cost per Unit vs Quantity */
        var scatterPts = rows.map(function (r) {
          return { x: parseFloat(r.Quantity), y: parseFloat(r.CostPerUnit),
                   supplier: r.SupplierName, product: r.ProductID };
        });
        charts.push(new Chart(document.getElementById('sc-chart4').getContext('2d'), {
          type: 'scatter',
          data: { datasets: [{ label: 'Orders', data: scatterPts,
            backgroundColor: a(DS.blue2, 0.65), pointRadius: 8, pointHoverRadius: 10 }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false },
              tooltip: { callbacks: { label: function (ctx) {
                return ctx.raw.supplier + ' / ' + ctx.raw.product + ': ' + ctx.raw.x + ' units @ $' + ctx.raw.y + '/unit';
              } } } },
            scales: {
              x: { grid: GRID, title: { display: true, text: 'Quantity (units)' }, beginAtZero: true },
              y: { grid: GRID, title: { display: true, text: 'Cost per Unit ($)' }, beginAtZero: true }
            }
          }
        }));

        /* Chart 5 — Bar: Quantity by Warehouse */
        var warehouses = ['LA', 'Dallas'];
        var whQty      = warehouses.map(function (w) {
          return rows.filter(function (r) { return r.Warehouse === w; })
                     .reduce(function (s, r) { return s + parseFloat(r.Quantity || 0); }, 0);
        });
        charts.push(new Chart(document.getElementById('sc-chart5').getContext('2d'), {
          type: 'bar',
          data: { labels: warehouses, datasets: [{ label: 'Total Quantity', data: whQty,
            backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75)], borderRadius: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true } }
          }
        }));
      });
    }, 100);
  }
]);

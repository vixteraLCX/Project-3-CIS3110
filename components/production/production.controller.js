/* ============================================================
   Production Controller
   components/production/production.controller.js
   ============================================================ */

angular.module('nexusERP').controller('ProductionCtrl', [
  '$scope', '$timeout', 'DS', 'GRID', 'ProductionService',
  function ($scope, $timeout, DS, GRID, ProductionService) {

    var charts = [];
    var a = function (t, o) { return t.r + o + ')'; };

    $scope.$on('$destroy', function () { charts.forEach(function (c) { c.destroy(); }); });

    $scope.kpis = [
      { icon: 'inventory_2',             label: 'Total Units',    value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'bug_report',              label: 'Total Defects',  value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-error',   barWidth: '0%' },
      { icon: 'precision_manufacturing', label: 'Top Machine',    value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'schedule',                label: 'Avg Prod. Time', value: '—', badge: '…', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '0%' },
      { icon: 'location_on',             label: 'Factory Sites',  value: 'CA & TX', badge: '2 sites', trend: 'trending_flat', badgeClass: 'text-slate-600 bg-slate-100', barClass: 'bg-primary', barWidth: '100%' }
    ];

    $timeout(function () {
      ProductionService.getData().then(function (rows) {

        /* ── Helpers ── */
        var trendIcon = function (n) { return n > 0 ? 'trending_up' : n < 0 ? 'trending_down' : 'trending_flat'; };
        var goodBadge = function (n) { return n >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var badBadge  = function (n) { return n <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'; };
        var barPct    = function (v, max) { return (max > 0 ? Math.min(100, Math.round(Math.abs(v) / max * 100)) : 0) + '%'; };

        /* ── Computed values ── */
        var totalUnits   = rows.reduce(function (s, r) { return s + parseFloat(r.UnitsProduced  || 0); }, 0);
        var totalDefects = rows.reduce(function (s, r) { return s + parseFloat(r.DefectiveUnits || 0); }, 0);
        var totalTime    = rows.reduce(function (s, r) { return s + parseFloat(r.ProductionTimeHours || 0); }, 0);
        var avgTime      = rows.length > 0 ? (totalTime / rows.length).toFixed(1) : 0;
        var defectRate   = totalUnits > 0 ? parseFloat(((totalDefects / totalUnits) * 100).toFixed(2)) : 0;
        var machines     = ['M01', 'M02', 'M03'];
        var machUnits    = machines.map(function (m) {
          return rows.filter(function (r) { return r.MachineID === m; })
                     .reduce(function (s, r) { return s + parseFloat(r.UnitsProduced || 0); }, 0);
        });
        var topMachIdx    = machUnits.indexOf(Math.max.apply(null, machUnits));
        var topMachShare  = totalUnits > 0 ? Math.round((machUnits[topMachIdx] / totalUnits) * 100) : 0;
        /* Day vs Night split */
        var dayTotal   = rows.filter(function (r) { return r.Shift === 'Day'; })
                            .reduce(function (s, r) { return s + parseFloat(r.UnitsProduced || 0); }, 0);
        var nightTotal = totalUnits - dayTotal;
        var dayPct     = totalUnits > 0 ? Math.round((dayTotal / totalUnits) * 100) : 50;
        /* Avg time: compare to 8-hour benchmark */
        var timeDiff   = parseFloat((parseFloat(avgTime) - 8).toFixed(1));

        /* ── Update KPI cards ── */
        $scope.kpis[0].value      = totalUnits.toLocaleString();
        $scope.kpis[0].badge      = dayPct + '% day shift';
        $scope.kpis[0].trend      = dayPct >= 50 ? 'trending_up' : 'trending_down';
        $scope.kpis[0].badgeClass = 'text-emerald-600 bg-emerald-50';
        $scope.kpis[0].barWidth   = barPct(totalUnits, 6000);

        $scope.kpis[1].value      = totalDefects + ' units';
        $scope.kpis[1].badge      = defectRate + '% rate';
        $scope.kpis[1].trend      = defectRate > 5 ? 'trending_up' : 'trending_down';
        $scope.kpis[1].badgeClass = badBadge(defectRate - 5);
        $scope.kpis[1].barWidth   = barPct(totalDefects, totalUnits);

        $scope.kpis[2].value      = machines[topMachIdx] + ': ' + machUnits[topMachIdx].toLocaleString();
        $scope.kpis[2].badge      = topMachShare + '% of output';
        $scope.kpis[2].trend      = 'trending_up';
        $scope.kpis[2].badgeClass = 'text-emerald-600 bg-emerald-50';
        $scope.kpis[2].barWidth   = barPct(machUnits[topMachIdx], totalUnits);

        $scope.kpis[3].value      = avgTime + ' hrs';
        $scope.kpis[3].badge      = (timeDiff >= 0 ? '+' : '') + timeDiff + ' vs 8h';
        $scope.kpis[3].trend      = trendIcon(-timeDiff); /* less time = better */
        $scope.kpis[3].badgeClass = timeDiff <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 bg-slate-100';
        $scope.kpis[3].barWidth   = barPct(parseFloat(avgTime), 12);

        /* Chart 1 — Line: Units over time */
        var dates = rows.map(function (r) { return r.Date; });
        var units = rows.map(function (r) { return parseFloat(r.UnitsProduced || 0); });
        charts.push(new Chart(document.getElementById('prd-chart1').getContext('2d'), {
          type: 'line',
          data: { labels: dates, datasets: [{ label: 'Units Produced', data: units,
            borderColor: DS.primary.s, backgroundColor: a(DS.primary, 0.10),
            borderWidth: 2, pointRadius: 5, tension: 0.3, fill: false }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID, ticks: { maxRotation: 30 } }, y: { grid: GRID, beginAtZero: true } }
          }
        }));

        /* Chart 2 — Bar: Defects by Product */
        var products = ['P101', 'P102', 'P103', 'P104'];
        var defects  = products.map(function (p) {
          return rows.filter(function (r) { return r.ProductID === p; })
                     .reduce(function (s, r) { return s + parseFloat(r.DefectiveUnits || 0); }, 0);
        });
        charts.push(new Chart(document.getElementById('prd-chart2').getContext('2d'), {
          type: 'bar',
          data: { labels: products, datasets: [{ label: 'Defective Units', data: defects,
            backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75), a(DS.amber, 0.75), a(DS.error, 0.70)],
            borderRadius: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true } }
          }
        }));

        /* Chart 3 — Scatter: Prod. Time vs Output */
        var scatterPts = rows.map(function (r) {
          return { x: parseFloat(r.ProductionTimeHours), y: parseFloat(r.UnitsProduced), id: r.ProductionID };
        });
        charts.push(new Chart(document.getElementById('prd-chart3').getContext('2d'), {
          type: 'scatter',
          data: { datasets: [{ label: 'Production Runs', data: scatterPts,
            backgroundColor: a(DS.blue2, 0.65), pointRadius: 8, pointHoverRadius: 10 }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false },
              tooltip: { callbacks: { label: function (ctx) {
                return ctx.raw.id + ': ' + ctx.raw.x + 'h → ' + ctx.raw.y + ' units';
              } } } },
            scales: {
              x: { grid: GRID, title: { display: true, text: 'Production Hours' }, beginAtZero: true },
              y: { grid: GRID, title: { display: true, text: 'Units Produced' },   beginAtZero: true }
            }
          }
        }));

        /* Chart 4 — Bar: Machine Performance */
        charts.push(new Chart(document.getElementById('prd-chart4').getContext('2d'), {
          type: 'bar',
          data: { labels: machines, datasets: [{ label: 'Units Produced', data: machUnits,
            backgroundColor: [a(DS.primary, 0.75), a(DS.teal, 0.75), a(DS.amber, 0.75)], borderRadius: 6 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { grid: GRID }, y: { grid: GRID, beginAtZero: true } }
          }
        }));

        /* Chart 5 — Stacked Bar: Day vs Night by Product */
        var dayUnits   = products.map(function (p) {
          return rows.filter(function (r) { return r.ProductID === p && r.Shift === 'Day'; })
                     .reduce(function (s, r) { return s + parseFloat(r.UnitsProduced || 0); }, 0);
        });
        var nightUnits = products.map(function (p) {
          return rows.filter(function (r) { return r.ProductID === p && r.Shift === 'Night'; })
                     .reduce(function (s, r) { return s + parseFloat(r.UnitsProduced || 0); }, 0);
        });
        charts.push(new Chart(document.getElementById('prd-chart5').getContext('2d'), {
          type: 'bar',
          data: { labels: products, datasets: [
            { label: 'Day Shift',   data: dayUnits,   backgroundColor: a(DS.primary, 0.75), borderRadius: 4 },
            { label: 'Night Shift', data: nightUnits, backgroundColor: a(DS.teal,    0.75), borderRadius: 4 }
          ] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } },
            scales: { x: { stacked: true, grid: GRID }, y: { stacked: true, grid: GRID, beginAtZero: true } }
          }
        }));
      });
    }, 100);
  }
]);

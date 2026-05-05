/* ============================================================
   NexusCorp ERP — AngularJS Application Module
   app.js
   ============================================================ */

var app = angular.module('nexusERP', ['ngRoute']);

/* ── Design-System Colours (shared constant) ── */
app.constant('DS', {
  primary:   { s: '#002d85', r: 'rgba(0,45,133,'   },
  teal:      { s: '#60cec1', r: 'rgba(96,206,193,' },
  blue2:     { s: '#0041b6', r: 'rgba(0,65,182,'   },
  slate:     { s: '#515f74', r: 'rgba(81,95,116,'  },
  tealLight: { s: '#89f5e7', r: 'rgba(137,245,231,'},
  error:     { s: '#ba1a1a', r: 'rgba(186,26,26,'  },
  blueDim:   { s: '#b5c4ff', r: 'rgba(181,196,255,'},
  amber:     { s: '#c87800', r: 'rgba(200,120,0,'  }
});

app.constant('GRID', { color: 'rgba(195,198,212,0.15)' });

/* ── Route Configuration ── */
app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  /* Restore classic '#/route' hash format (AngularJS 1.6+ defaults to '#!/') */
  $locationProvider.hashPrefix('');

  $routeProvider
    .when('/overview',    { templateUrl: 'components/overview/overview.html',       controller: 'OverviewCtrl'    })
    .when('/finance',     { templateUrl: 'components/finance/finance.html',         controller: 'FinanceCtrl'     })
    .when('/sales',       { templateUrl: 'components/sales/sales.html',             controller: 'SalesCtrl'       })
    .when('/crm',         { templateUrl: 'components/crm/crm.html',                 controller: 'CrmCtrl'         })
    .when('/production',  { templateUrl: 'components/production/production.html',   controller: 'ProductionCtrl'  })
    .when('/supplychain', { templateUrl: 'components/supplychain/supplychain.html', controller: 'SupplyChainCtrl' })
    .otherwise({ redirectTo: '/overview' });
}]);

/* ── App (Shell) Controller — drives sidebar active state ── */
app.controller('AppCtrl', ['$scope', '$location', function ($scope, $location) {
  $scope.isActive = function (path) {
    return $location.path() === path;
  };
}]);

/* ── Global Chart.js Defaults ── */
Chart.defaults.font.family = 'Inter';
Chart.defaults.color = '#434652';

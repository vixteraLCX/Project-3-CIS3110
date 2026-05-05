/* ============================================================
   FinanceService — loads finance.csv via CsvService
   services/finance.service.js
   ============================================================ */

angular.module('nexusERP').factory('FinanceService', ['CsvService', function (CsvService) {
  return {
    getData: function () {
      return CsvService.fetch('finance.csv').then(function (rows) {
        return rows.filter(function (r) { return r.Date && r.Department; });
      });
    }
  };
}]);

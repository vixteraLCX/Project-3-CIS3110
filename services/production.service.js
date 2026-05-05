/* ============================================================
   ProductionService — loads production.csv via CsvService
   services/production.service.js
   ============================================================ */

angular.module('nexusERP').factory('ProductionService', ['CsvService', function (CsvService) {
  return {
    getData: function () {
      return CsvService.fetch('production.csv').then(function (rows) {
        return rows.filter(function (r) { return r.ProductionID && r.Date; });
      });
    }
  };
}]);

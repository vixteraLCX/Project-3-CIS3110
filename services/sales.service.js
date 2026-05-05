/* ============================================================
   SalesService — loads sales.csv via CsvService
   services/sales.service.js
   ============================================================ */

angular.module('nexusERP').factory('SalesService', ['CsvService', function (CsvService) {
  return {
    getData: function () {
      return CsvService.fetch('sales.csv').then(function (rows) {
        return rows.filter(function (r) { return r.OrderID && r.Product; });
      });
    }
  };
}]);

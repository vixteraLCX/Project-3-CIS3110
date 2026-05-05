/* ============================================================
   SupplyChainService — loads supply_chain.csv via CsvService
   services/supplychain.service.js
   ============================================================ */

angular.module('nexusERP').factory('SupplyChainService', ['CsvService', function (CsvService) {
  return {
    getData: function () {
      return CsvService.fetch('supply_chain.csv').then(function (rows) {
        return rows.filter(function (r) { return r.OrderID && r.SupplierName; });
      });
    }
  };
}]);

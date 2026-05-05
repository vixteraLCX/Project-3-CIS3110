/* ============================================================
   CrmService — loads customers.csv via CsvService
   services/crm.service.js
   ============================================================ */

angular.module('nexusERP').factory('CrmService', ['CsvService', function (CsvService) {
  return {
    getData: function () {
      return CsvService.fetch('customers.csv').then(function (rows) {
        return rows.filter(function (r) { return r.CustomerID && r.Name; });
      });
    }
  };
}]);

/* ============================================================
   NexusCorp ERP — Generic CSV Service
   services/csv.service.js
   ============================================================
   Wraps PapaParse with Angular $q promises.
   Results are cached in-memory by filename to avoid repeat fetches.
   ============================================================ */

angular.module('nexusERP').factory('CsvService', ['$q', function ($q) {
  var cache = {};

  return {
    /**
     * fetch(filename) → Promise<Array<Object>>
     * Downloads and parses a CSV file. Returns cached result on repeat calls.
     */
    fetch: function (filename) {
      if (cache[filename]) {
        return $q.resolve(cache[filename]);
      }

      var deferred = $q.defer();

      Papa.parse(filename, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          cache[filename] = results.data;
          deferred.resolve(results.data);
        },
        error: function (error) {
          console.error('[CsvService] Error loading ' + filename, error);
          deferred.reject(error);
        }
      });

      return deferred.promise;
    }
  };
}]);

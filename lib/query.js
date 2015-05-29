var request = require('request');
var _ = require('highland');
var graph = require('./graph');
var elasticsearch = require('./elasticsearch');
var params = require('./params');
var config = require(process.env.HISTOGRAPH_CONFIG);
var CoreApiUri = 'http://' + config.core.traversal.host +
  ':' + config.core.traversal.port +
  '/';

module.exports = function(type, value, query, callback) {

  if (query['hg:liesIn']) {
    var liesInType = params.searchTypeFromValue(query['hg:liesIn']);
    var liesInValue = query['hg:liesIn'];

    _([
      function(callback) {
        elasticsearch.search(type, value, query, callback);
      },

      function(callback) {
        var liesInQuery = {
          highlight: query.highlight,
          exact: query.exact
        };
        elasticsearch.search(liesInType, liesInValue, liesInQuery, callback);
      }

    ]).nfcall([]).parallel(2).map(function(results) {
      return results.map(function(item) {
        return item._source.hgid;
      });
    }).apply(function(hgidsFrom, hgidsTo) {
      graph.shortestPath(hgidsFrom, hgidsTo, function(err, hgids) {
        if (err) {
          callback(err);
        } else {
          traverse(hgids, function(err, geojson) {
            callback(err, geojson);
          });
        }
      });
    });
  } else {

    _([
      function(callback) {
        elasticsearch.search(type, value, query, callback);
      }

    ]).nfcall([]).parallel(2).map(function(results) {
      return results.map(function(item) {
        return item._source.hgid;
      });
    }).sequence().toArray(function(hgids) {
      traverse(hgids, function(err, geojson) {
        callback(err, geojson);
      });
    });
  }
};

function traverse(hgids, callback) {
  var reqOptions = {
    uri: CoreApiUri + 'traversal',
    method: 'POST',
    json: {
      hgids: hgids
    }
  };

  request(reqOptions, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(null, body);
    } else {
      callback(error);
    }
  });
}

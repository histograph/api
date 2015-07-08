var request = require('request');
var _ = require('highland');
var graph = require('./graph');
var elasticsearch = require('./elasticsearch');
var params = require('./params');
var config = require(process.env.HISTOGRAPH_CONFIG);
var neo4jUrl = 'http://' + config.core.neo4j.host + ':' + config.core.neo4j.port;

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
        return item._id;
      });
    })
    .errors(function(err) {
      console.log(err)
    })
    .apply(function(idsFrom, idsTo) {
      graph.shortestPath(idsFrom, idsTo, function(err, ids) {
        if (err) {
          callback(err);
        } else {
          expand(ids, function(err, geojson) {
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
    ]).nfcall([]).series().map(function(results) {
      return results.map(function(item) {
        return item._id;
      });
    })
    .errors(function(err) {
      console.log(err)
    })
    .sequence().toArray(function(ids) {
      expand(ids, function(err, geojson) {
        callback(err, geojson);
      });
    });

  }
};

function expand(ids, callback) {
  var reqOptions = {
    uri: neo4jUrl + '/histograph/expand',
    method: 'POST',
    json: {
      ids: ids
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

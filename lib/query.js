var _ = require('highland');
var graph = require('./graph');
var elasticsearch = require('./elasticsearch');
var structure = require('./structure');

function esParams(query, includeRelated) {
  var prefix = structure.query.relation + '.';

  var params = [];
  Object.keys(query).forEach(function(param) {
    if (param !== structure.query.relation) {
      var prefixed = param.indexOf(prefix) === 0;
      if ((includeRelated && prefixed) || (!includeRelated && !prefixed) || param === 'exact') {
        params[param.replace(prefix, '')] = query[param];
      }
    }
  });

  return params;
}

module.exports = function(query, callback) {
  var esQueryFrom = elasticsearch.searchQuery(esParams(query, false));

  if (!query.related) {
    _([esQueryFrom])
      .nfcall([])
      .series()
      .errors(function(err) {
        callback(err);
      })
      .sequence()
      .toArray(function(ids) {
        graph.expand(ids, [], function(err, concepts) {
          callback(err, concepts);
        });
      });
  } else {
    var esQueryTo = elasticsearch.searchQuery(esParams(query, true));
    _([esQueryFrom, esQueryTo])
      .nfcall([])
      .parallel(2)
      .errors(function(err) {
        callback(err);
      })
      .apply(function(idsFrom, idsTo) {
        graph.shortestPath(idsFrom, idsTo, query.related, function(err, ids) {
          if (err) {
            callback(err);
          } else {
            graph.expand(ids, [], function(err, concepts) {
              callback(err, concepts);
            });
          }
        });
      });
  }
};

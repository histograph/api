var _ = require('highland');
var graph = require('./graph');
var elasticsearch = require('./elasticsearch');

function esParams(query, includeRelated) {
  var prefix = 'related.';

  var params = [];
  Object.keys(query).forEach(function(param) {
    if (param !== 'related') {
      var prefixed = param.indexOf(prefix) === 0;
      if ((includeRelated && prefixed) || (!includeRelated && !prefixed) || param === 'exact') {
        params[param.replace(prefix, '')] = query[param];
      }
    }
  });

 return params;
}

function related(esParams, relations, direction, callback) {

  // TODO: find better way to stop stream on error
  var error = false;

  _([esParams])
    .nfcall([])
    .series()
    .errors(function(err) {
      error = true;
      callback(err);
    })
    .apply(function(ids) {
      if (!error) {
        graph.related(ids, relations, direction, function(err, ids) {
          if (err) {
            callback(err);
          } else {
            graph.expand(ids, function(err, concepts) {
              callback(err, concepts);
            });
          }
        });
      }
    });
}

module.exports = function(query, callback) {
  var error = false;

  var esQueryFrom = elasticsearch.searchQuery(esParams(query, false));
  var esQueryTo = elasticsearch.searchQuery(esParams(query, true));

  // Query types:
  //
  // 1. [q, uri, name, id]:
  //      Elasticsearch -> Expand
  //
  // 2. [q, uri, name, id] && related:
  //      Elasticsearch -> Related -> Expand
  //
  // 3. [q, uri, name, id] && related && [related.q, related.uri, related.name, related.id]:
  //      (Elasticsearch, Elasticsearch) -> Shortest path -> Expand
  //
  // 4.                       related && [related.q, related.uri, related.name, related.id]:
  //      Elasticsearch -> Related -> Expand

  var hasSearchParam = query.q || query.id || query.uri || query.name;
  if(hasSearchParam || hasSearchParam == "")//empty q should also be allowed
  {
	  hasSearchParam = true;
  }

  var hasRelatedParam = query.related;
  var hasRelatedSearchParam = query['related.q'] || query['related.id'] || query['related.uri'] || query['related.name'];

  if (hasSearchParam && hasRelatedParam && hasRelatedSearchParam) {
    _([esQueryFrom, esQueryTo])
      .nfcall([])
      .parallel(2)
      .errors(function(err) {
        error = true;
        callback(err);
      })
      .apply(function(idsFrom, idsTo) {
        if (!error) {
          graph.shortestPath(idsFrom, idsTo, query.related, function(err, ids) {
            if (err) {
              callback(err);
            } else {
              graph.expand(ids, function(err, concepts) {
                callback(err, concepts);
              });
            }
          });
        }
      });

  } else if (hasSearchParam && hasRelatedParam) {
    related(esQueryFrom, query.related, 'to', callback);

  } else if (hasRelatedParam && hasRelatedSearchParam) {
    related(esQueryTo, query.related, 'from', callback);
  } 
  else if (hasSearchParam) { //in case of empty q
    _([esQueryFrom])
      .nfcall([])
      .series()
      .errors(function(err) {
        error = true;
        callback(err);
      })
      .sequence()
      .toArray(function(ids) {
        if (!error) {
          graph.expand(ids, function(err, concepts) {
            callback(err, concepts);
          });
        }
      });

  } else {

    callback('Please supply at least one search parameter: `q`, `uri`, `name` or `id`');

  }
};

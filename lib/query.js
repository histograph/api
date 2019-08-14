const _ = require('highland');
const graph = require('./graph');
const elasticsearch = require('./elasticsearch');

const log = require("histograph-logging");

const my_log = new log("api");

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

  my_log.debug("params: " + params);
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

  my_log.debug("query: " + JSON.stringify(query));

  var error = false;

  var esQueryFrom = elasticsearch.searchQuery(esParams(query, false));
  var esQueryTo = elasticsearch.searchQuery(esParams(query, true));

  // my_log.debug("esQueryFrom: " + esQueryFrom);
  // my_log.debug("esQueryTo: " + esQueryTo);

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
  if (hasSearchParam || hasSearchParam === '') {
    hasSearchParam = true;
  }

  var hasRelatedParam = query.related;
  var hasRelatedSearchParam = query['related.q'] || query['related.id'] || query['related.uri'] || query['related.name'];

  my_log.debug("hasSearchParam: " + hasSearchParam);
  my_log.debug("hasRelatedParam: " + hasRelatedParam);
  my_log.debug("hasRelatedSearchParam: " + hasRelatedSearchParam);

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
        my_log.error("Errors querying Elasticsearch: " + JSON.stringify(err));
        error = true;
        callback(err);
      })
      .sequence()
      .toArray(function(ids) {
        my_log.debug("Retrieved ids: " + ids);
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

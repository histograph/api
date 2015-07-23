var fs = require('fs');
var path = require('path');
var config = require(process.env.HISTOGRAPH_CONFIG);
var request = require('request');
var neo4j = require('neo4j');
var neo4jUrl = 'http://' + config.neo4j.host + ':' + config.neo4j.port;
var graphDb = new neo4j.GraphDatabase(neo4jUrl);

var shortestPathQuery = fs.readFileSync(path.join(__dirname, '..', 'data', 'shortest-path.cypher'), {encoding: 'utf8'});

exports.shortestPath = function(idsFrom, idsTo, relations, callback) {
  var query = shortestPathQuery.replace('{{relations}}', relations.map(function(relation) {
    return relation.replace(':', '_');
  }).join('|'));

  graphDb.cypher({
    query: query,
    params: {
      idsFrom: idsFrom,
      idsTo: idsTo
    }
  }, function(err, results) {
    var ids;
    if (results) {
      ids = results.map(function(result) {
        return result['p.id'];
      });
    }

    callback(err, ids);
  });
};

exports.expand = function(ids, hairs, callback) {
  // TODO: send hairs to neo4j plugin!

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
};
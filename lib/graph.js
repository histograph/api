var fs = require('fs');
var path = require('path');
var config = require('histograph-config');
var request = require('request');
var neo4j = require('neo4j');

if (config.neo4j.user && config.neo4j.password) {
  var neo4jUrl = 'http://' + config.neo4j.user + ':' + config.neo4j.password + '@' +
    config.neo4j.host + ':' + config.neo4j.port;
} else {
  var neo4jUrl = 'http://' + config.neo4j.host + ':' + config.neo4j.port;
}

var graphDb = new neo4j.GraphDatabase(neo4jUrl);

var shortestPathQuery = fs.readFileSync(path.join(__dirname, '..', 'data', 'shortest-path.cypher'), {encoding: 'utf8'});

exports.shortestPath = function(idsFrom, idsTo, relations, callback) {
  graphDb.cypher({
    query: shortestPathQuery,
    params: {
      idsFrom: idsFrom,
      idsTo: idsTo,
      relations: relations
    }
  }, function(err, results) {
    var ids;
    if (results) {
      ids = results.map(function(result) {
        return result.id;
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

  request(reqOptions, function(error, response) {
    if (!error && response.statusCode == 200) {
      try {
        callback(null, response.body);
      } catch (e) {
        callback({
          message: 'Neo4j plugin returned incorrect JSON data'
        });
      }
    } else {
      callback(error);
    }
  });

};

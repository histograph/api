var fs = require('fs');
var path = require('path');
var config = require(process.env.HISTOGRAPH_CONFIG);
var neo4j = require('neo4j');
var neo4jUrl = 'http://' + config.neo4j.host + ':' + config.neo4j.port;
var graphDb = new neo4j.GraphDatabase(neo4jUrl);

var shortestPathQuery = fs.readFileSync(path.join(__dirname, '..', 'data', 'shortest-path.cypher'), {encoding: 'utf8'});

exports.shortestPath = function(idsFrom, idsTo, callback) {
  graphDb.cypher({
    query: shortestPathQuery,
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

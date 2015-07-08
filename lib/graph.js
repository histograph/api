var fs = require('fs');
var path = require('path');
var config = require(process.env.HISTOGRAPH_CONFIG);
var neo4j = require('neo4j');
var url = 'http://' + config.core.neo4j.host + ':' + config.core.neo4j.port;
var db = new neo4j.GraphDatabase(url);

var shortestPathQuery = fs.readFileSync(path.join(__dirname, '..', 'data', 'shortest-path.cypher'), {encoding: 'utf8'});

exports.shortestPath = function(hgidsFrom, hgidsTo, callback) {
  db.cypher({
    query: shortestPathQuery,
    params: {
      hgidsFrom: hgidsFrom,
      hgidsTo: hgidsTo
    }
  }, function(err, results) {
    var hgids;
    if (results) {
      hgids = results.map(function(result) {
        return result['p.hgid'];
      });
    }

    callback(err, hgids);
  });
};

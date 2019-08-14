const fs = require('fs');
const path = require('path');
const config = require('histograph-config');
const request = require('request');
const neo4j = require('neo4j');

const log = require("histograph-logging");

const my_log = new log("api");

if (config.neo4j.user && config.neo4j.password) {
  var neo4jUrl = 'http://' + config.neo4j.user + ':' + config.neo4j.password + '@' +
    config.neo4j.host + ':' + config.neo4j.port;
} else {
  var neo4jUrl = 'http://' + config.neo4j.host + ':' + config.neo4j.port;
}

var graphDb = new neo4j.GraphDatabase(neo4jUrl);

var shortestPathQuery = fs.readFileSync(path.join(__dirname, '..', 'queries', 'shortest-path.cypher'), {encoding: 'utf8'});
var relatedQuery = fs.readFileSync(path.join(__dirname, '..', 'queries', 'related.cypher'), {encoding: 'utf8'});

function replaceRelations(query, relations) {
  return query.replace('«relations»', relations.map(function(relation) {
    return '`' + relation + '`';
  }).join('|'));
}

exports.shortestPath = function(idsFrom, idsTo, relations, callback) {
  var query = replaceRelations(shortestPathQuery, relations);

  my_log.debug("Neo4j shortestPath query: " + query);

  my_log.debug("idsFrom: " + idsFrom);
  my_log.debug("idsTo: " + idsTo);
  my_log.debug("relations: " + relations);

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
        return result.id;
      });
    }

    callback(err, ids);
  });
};

exports.related = function(ids, relations, direction, callback) {
  var query = replaceRelations(relatedQuery, relations);

  if (direction === 'from') {
    query = query.replace('«directionFrom»', '-').replace('«directionTo»', '->');
  } else if (direction === 'to') {
    query = query.replace('«directionFrom»', '<-').replace('«directionTo»', '-');
  }

  my_log.debug("Neo4j related query: " + query);

  graphDb.cypher({
    query: query,
    params: {
      ids: ids
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

exports.expand = function(ids, callback) {
  var reqOptions = {
    uri: neo4jUrl + '/histograph/expand',
    method: 'POST',
    json: {
      ids: ids,
      equivalence: config.schemas.equivalence,
      hairs: config.api.hairRelations
    }
  };

  my_log.debug("Query to Neo4J: " + reqOptions);

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
      my_log.error("Error querying Neo4J: " + error + ", status code: " + response.statusCode);
      callback(error);
    }
  });

};

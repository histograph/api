#!/usr/local/bin/node

var grex = require('grex'),
    async = require('async'),
    fs = require('fs'),
    options = {
      'host': 'localhost',
      'port': 8182,
      'graph': 'graph'
    },
    client = grex.createClient(options),
    gremlin = grex.gremlin,
    g = grex.g;

var json = JSON.parse(fs.readFileSync('molenstraat2.json', 'utf8'));

function execute(query, callback) {
  client.execute(query, function(err, response) {
    if (response) {
      return callback(response);
    }
    if (err) {
      console.log("ERROR:");
      console.log(err);
      callback(null);
    }
  });
}

async.each(json.graph.vertices, function(vertex, callback) {
  console.log("Adding vertex: " + vertex.name);
  var query = gremlin(g.addVertex(vertex));
  execute(query, function(response) {
    callback();
  });
});

async.each(json.graph.edges, function(edge, callback) {
  var outVId, inVId;
  execute(gremlin(g.V('uri', edge._outV)), function(response) {
    outVId = response.results[0]._id;
    execute(gremlin(g.V('uri', edge._inV)), function(response) {
      inVId = response.results[0]._id;

      var query = gremlin();
      var outV = query.var(g.v(outVId));
      var inV = query.var(g.v(inVId));
      query(g.addEdge(outV, inV, edge._label));
      execute(query, function(response) {
        console.log("Jaaatjes, added edge!");
        callback();
      });
    });
  });
});
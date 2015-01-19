#!/usr/local/bin/node

// TODO: make importer use stdin!
// http://shapeshed.com/command-line-utilities-with-nodejs/

var grex = require('grex'),
    argv =require('optimist')
      .usage('Load a GraphSON file into Titan.\nUsage: $0')
      .demand('f')
      .alias('f', 'file')
      .describe('f', 'Load a file')
      .argv
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

var json = JSON.parse(fs.readFileSync(argv.file, 'utf8'));

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

function addVertices(callback) {
  var i = 1;
  async.each(json.graph.vertices, function(vertex, callback) {
    var query = gremlin(g.addVertex(vertex));
    execute(query, function(response) {
      console.log("Added vertex " + (i++) + "/" + json.graph.edges.length + ": " + vertex.name);
      callback();
    });
  });
  callback(null, true);
}

function addEdges(callback) {
  var i = 1;
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
          console.log("Added edge " + (i++) + "/" + json.graph.edges.length + "!");
          callback();
        });
      });
    });
  });
<<<<<<< HEAD:example/import.js
});
=======
  callback(null, true);
}

async.series([
    addVertices,
    addEdges
  ]
);
>>>>>>> decfab01117f97cae710c37c67d9b5d14665b74c:import.js
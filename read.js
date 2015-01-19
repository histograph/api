#!/usr/local/bin/node

var grex = require('grex'),
    argv =require('optimist')
      .usage('Uses Rexster to read complete or partial graph and outputs JSON.\nUsage: $0')
      .alias('u', 'uri')
      .describe('u', 'Only reads subgraph with BFS, starting at vertex with URI <uri>')
      .argv
    async = require('async'),
    fs = require('fs'),
    options = JSON.parse(fs.readFileSync('config.json', 'utf8')),
    client = grex.createClient(options),
    gremlin = grex.gremlin,
    g = grex.g;

function execute(query, callback) {
  client.execute(query, function(err, response) {
    if (response) {
      return callback(response);
    }
    if (err) {
      process.stderr.write("ERROR:");
      process.stderr.write(err);
      callback(null);
    }
  });
}

if (argv.uri) {
  //console.log("Ja, URI: " + argv.uri);

  execute(gremlin(g.V('uri', argv.uri.toString())), function(response) {
    if (response && response.results.length > 0) {
      var id = response.results[0]._id;
      var query = g.v(id)
          .outE().gather().scatter()
          .inV().gather().scatter()
          .inE().gather().scatter()
          .outV().gather().scatter();
      //var query = g.v(id).outE().inV().inE().outV();

      // TODO: maken!
      execute(gremlin(query), function(response) {
        //console.log(response);
      });
    } else {
      process.stderr.write("Vertex with URI '" + argv.uri + "' not found...\n");
    }
  });
} else {

  function readVertices(callback) {
    var vertices = {},
      query = gremlin(g.V());
    client.execute(query, function(err, response) {
      response.results.forEach(function(result) {
        vertices[result._id] = {
          geo: result.geo,
          source: result.source,
          name: result.name,
          type: result.type,
          date: result.date,
          uri: result.uri
        }
      });
      callback(null, vertices);
    });
  }

  function readEdges(callback) {
    var query = gremlin(g.E());
    client.execute(query, function(err, response) {
      var edges = response.results.map(function(result) {
        return {
          source: result._outV,
          target: result._inV,
          label: result._label
        }
      });
      callback(null, edges);
    });
  }

  async.series({
      vertices: readVertices,
      edges: readEdges
    },
    function(err, results) {
      var output = JSON.stringify({
        nodes: results.vertices,
        links: results.edges
      }, null, 2);

      console.log(output);
    }
  );
}

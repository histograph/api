var fs = require('fs'),
    options = JSON.parse(fs.readFileSync('config.json', 'utf8')),
    grex = require('grex'),
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

function gremlinToD3(query, callback) {
  execute(gremlin(query), function(response) {
    if (response.results.length > 0) {
      var graph = {
        nodes: {},
        links: {}
      };
      response.results.forEach(function(pathOrVertex) {
        path = [];
        if (pathOrVertex.constructor === Array) {
          path = pathOrVertex;
        } else {
          path = [pathOrVertex];
        }
        path.forEach(function(object) {
          if (object._type === "vertex") {
            graph.nodes[object._id] = {
              startDate: object.startDate,
              source: object.source,
              name: object.name,
              endDate: object.endDate,
              type: object.type,
              uri: object.uri,
              geometry: object.geometry
            };
          } else {
            // Edge!
            graph.links[object._id] = {
              "source": object._outV,
              "target": object._inV,
              "label": object._label
            };
          }
        });
      });
      callback(graph);
    } else {
      callback({
        "message": "Nothing found..."
      });
    }
  });
}

module.exports.gremlinToD3 = gremlinToD3;
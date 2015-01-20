#!/usr/local/bin/node

var express = require('express'),
    app = express();
    grex = require('grex'),
    fs = require('fs'),
    path = require('path'),
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

app.get('/', function (req, res) {
  res.send({
    name: 'histograph',
    version: '0.0.1',
    message: 'Hallootjes!'
  });
})

app.get('/:source/:id', function (req, res) {
  var uri = req.params.source + '/' +  req.params.id,
      query = "g.V('uri', '" + uri + "').as('x').outE.inV.loop('x'){it.loops < 100}{true}.path";

  execute(gremlin(query), function(response) {
    if (response.results.length > 0) {
      var graph = {
        nodes: {},
        links: []
      };
      response.results.forEach(function(path) {
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
            graph.links.push({
              "source": object._outV,
              "target": object._inV,
              "label": object._label
            });
          }
        });
      });
      res.send(graph);
    } else {
      res.send({
        "message": "Vertex with URI '" + uri + "' not found..."
      });
    }
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
});

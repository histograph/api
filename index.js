#!/usr/local/bin/node

var express = require('express'),
    cors = require('cors'),
    app = express(),
    grex = require('grex'),
    fs = require('fs'),
    path = require('path'),
    options = JSON.parse(fs.readFileSync('config.json', 'utf8')),
    client = grex.createClient(options),
    gremlin = grex.gremlin,
    g = grex.g;

app.use(cors());

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

app.get('/', function (req, res) {
  res.send({
    name: 'histograph',
    version: '0.0.1',
    message: 'Hallootjes!'
  });
})

var GREMLIN_DFS = ".as('x').outE.inV.loop('x'){it.loops < 100}{true}.path";

app.get('/q', function (req, res) {
  if (req.query.uri) {
    var uri = req.query.uri,
        query = "g.V('uri', '" + uri + "')" + GREMLIN_DFS;

    gremlinToD3(query, function(result) {
      res.send(result);
    });
  } else if (req.query.name) {
    var name = req.query.name,
        query = "g.V.has('name', Text.CONTAINS_REGEX, '" + name + "')" + GREMLIN_DFS;

    gremlinToD3(query, function(result) {
      res.send(result);
    });
  } else {
    var host = server.address().address,
        port = server.address().port;
    res.send({
      "message": "Please use `uri` or `name` parameter, e.g. http://" +  host + ":" + port + "/q?name=amsterdam"
    });
  }
});

var server = app.listen(3000, function () {
  var host = server.address().address,
      port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

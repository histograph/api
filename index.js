#!/usr/local/bin/node

var express = require('express'),
    cors = require('cors'),
    app = express(),
    graph = require('./graph-functions');

app.use(cors());

app.get('/', function (req, res) {
  var host = server.address().address,
      port = server.address().port;

  res.send({
    name: 'histograph',
    version: '0.0.1',
    message: 'Hallootjes!',
    examples: [
       'http://' +  host + ":" + port + '/search?name=utrecht',
       'http://' +  host + ":" + port + '/search?uri=geonames/2758064'
    ]
  });
});

//var GREMLIN_DFS = ".as('x').outE.inV.loop('x'){it.loops < 100}{true}.path";
var GREMLIN_DFS = ".copySplit(_(), _().as('x').outE('hg:conceptIdentical').inV.loop('x'){it.loops < 100}{true}.path).exhaustMerge()";

app.get('/search', function (req, res) {
  if (req.query.uri) {
    var uri = req.query.uri,
        query = "g.V('uri', '" + uri + "')" + GREMLIN_DFS;

    graph.gremlinToGeoJSON(query, function(result) {
      res.send(result);
    });
  } else if (req.query.name) {
    var name = req.query.name,
        query = "g.V.has('name', Text.CONTAINS_REGEX, '" + name + "')" + GREMLIN_DFS;

    graph.gremlinToGeoJSON(query, function(result) {
      res.send(result);
    });
  } else {
    var host = server.address().address,
        port = server.address().port;
    res.send({
      "message": "Please use `uri` or `name` parameter, e.g. http://" +  host + ":" + port + "/search?name=amsterdam"
    });
  }
});

var server = app.listen(3000, function () {
  var host = server.address().address,
      port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

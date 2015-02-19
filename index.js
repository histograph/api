var fs = require('fs'),
    express = require('express'),
    cors = require('cors'),
    app = express(),
    graph = require('./graph-functions'),
    logo = fs.readFileSync('./histograph.txt', 'utf8');

app.use(cors());

app.get('/', function (req, res) {
  var host = server.address().address,
      port = server.address().port;

  res.send({
    name: 'histograph',
    version: '0.1.0',
    message: 'Hallootjes!',
    examples: [
       'http://' +  host + ":" + port + '/search?name=utrecht',
       'http://' +  host + ":" + port + '/search?hgid=geonames/2758064'
    ]
  });
});

var GREMLIN_DFS = ".emit().repeat(__.outE().inV()).times(100).path()";
//var GREMLIN_DFS = ".copySplit(_(), _().as('x').outE('hg:conceptIdentical').inV.loop('x'){it.loops < 100}{true}.path).exhaustMerge()";

app.get('/search', function (req, res) {
  if (req.query.hgid) {
    var hgid = req.query.hgid,
        query = "g.V().has('hgid', '" + hgid + "')";// + GREMLIN_DFS;

    graph.gremlinToGeoJSON(query, function(result) {
      res.send(result);
    });
  } else if (req.query.name) {
    var name = req.query.name,
        query = "g.V().has('name', '" + name + "')";

    graph.gremlinToGeoJSON(query, function(result) {
      res.send(result);
    });
  } else {
    var host = server.address().address,
        port = server.address().port;
    res.send({
      "message": "Please use `hgid` or `name` parameter, e.g. http://" +  host + ":" + port + "/search?name=amsterdam"
    });
  }
});

var server = app.listen(3001, function () {
  var host = server.address().address,
      port = server.address().port;
  console.log(logo);
  console.log('Histograph API listening at http://%s:%s', host, port);
});

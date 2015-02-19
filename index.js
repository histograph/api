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

app.get('/search', function (req, res) {
  if (req.query.hgid) {
    graph.findById(req.query.hgid, function(result) {
      res.send(result);
    });
  } else if (req.query.name) {
    graph.findByName(req.query.name, function(result) {
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

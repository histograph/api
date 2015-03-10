var fs = require('fs'),
    express = require('express'),
    request = require('request'),
    cors = require('cors'),
    config = require(process.env.HISTOGRAPH_CONFIG),
    app = express(),
    elasticsearch = require('./elasticsearch'),
    logo = fs.readFileSync('./histograph.txt', 'utf8'),
    traversalApiUri = 'http://' + config.core.traversal.host
        + ':' + config.core.traversal.port
        + '/traversal',
    // Set URI of this API, from config
    apiUri = config.api.host + (config.api.port ? ':' + config.api.port : '');

app.use(cors());

app.get('/', function (req, res) {
  var host = server.address().address,
      port = server.address().port;

  res.send({
    name: 'histograph',
    version: '0.1.0',
    message: 'Hallootjes!',
    examples: [
       'http://' + apiUri + '/search?name=utrecht',
       'http://' + apiUri + '/search?hgid=geonames/2758064'
    ]
  });
});

app.get('/search', function (req, res) {
  elasticsearch.findByName(req.query.name, function(result) {
    var hgids = result.map(function(hit) { return hit._id; });

    // TODO: load from config repo/env var.
    var options = {
      uri: traversalApiUri,
      method: 'POST',
      json: {
        hgids: hgids
      }
    };

    request(options, function (error, response, body) {
      // TODO: handle errors!
      if (!error && response.statusCode == 200) {
        res.send(body);
      }
    });

  });
});


var port = 3000;
var server = app.listen(port, function () {
  console.log(logo);
  console.log('Histograph API listening at port ' + port);
});

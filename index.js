var url = require('url');
var express = require('express');
var cors = require('cors');
var config = require('histograph-config');
var schemas = require('histograph-schemas');
var io = require('histograph-io');
var stats = require('histograph-stats');
var app = express();
var query = require('./lib/query');
var jsonld = require('./lib/jsonld');
var geojson = require('./lib/geojson');
var params = require('./lib/params');

app.use(cors());

// Mount Histograph IO
app.use('/', io);

// Mount Histograph Stats
app.use('/stats', stats);

var ontology;
schemas.ontology(function(err, results) {
  ontology = results;
});

var exampleUrls = config.api.exampleUrls || [];

function formatError(err) {
  if (err && err.message && err.message.indexOf('IndexMissingException') === 0) {
    var match = err.message.match(/\[\[(.*?)\]/);
    if (match) {
      return 'Dataset not found: ' + match[1];
    }
  }

  return err;
}

app.get('/', function(req, res) {
  res.send({
    name: 'Histograph API',
    version: '0.5.1',
    message: 'Histograph - Historical Geocoder',
    docs: 'http://histograph.io/',
    examples: exampleUrls.map(function(query) {
      return url.resolve(config.api.baseUrl, query);
    })
  });
});

app.get('/ontology', function(req, res) {
  res.set('Content-Type', 'text/turtle');
  res.send(ontology);
});

app.get('/schemas/:schema(pits|relations)', function(req, res) {
  res.send(schemas[req.params.schema]);
});

app.get('/search',
  params.preprocess,
  params.check,
  function(req, res) {
    query(req.processedQuery, function(err, results) {
      if (err) {
        res.status(err.status || 400).send({
          message: formatError(err)
        });
      } else {
        results = jsonld(geojson(results, req.processedQuery), req.processedQuery);
        res.send(results);
      }
    });
  }

);

app.listen(config.api.bindPort, function() {
  console.log(config.logo.join('\n'));
  console.log('Histograph API listening at port ' + config.api.bindPort);
});

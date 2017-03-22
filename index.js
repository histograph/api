const url = require('url');
const express = require('express');
const cors = require('cors');
const config = require('histograph-config');
const schemas = require('histograph-schemas');
const io = require('histograph-io');
const stats = require('histograph-stats');
const app = express();
const query = require('./lib/query');
const jsonld = require('./lib/jsonld');
const geojson = require('./lib/geojson');
const params = require('./lib/params');
const package = require('./package');
const log = require('histograph-logging');

const my_log = new log("api");


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
    version: package.version,
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
  my_log.info("\n" + config.logo.join('\n'));
  my_log.info('Histograph API listening at port ' + config.api.bindPort);
});

var express = require('express');
var request = require('request');
var cors = require('cors');
var config = require(process.env.HISTOGRAPH_CONFIG);
var io = require(config.api.io);
var queue = require('./lib/queue');
var exampleUrls = require('./data/exampleUrls.json');
var context = require('./data/jsonldContext.json');
var app = express();
var elasticsearch = require('./lib/elasticsearch');
var CoreApiUri = 'http://' + config.core.traversal.host +
        ':' + config.core.traversal.port +
        '/';
var apiUri = config.api.host + (config.api.externalPort != 80 ? ':' + config.api.externalPort : '');
var validSearchReqParams = [
      'name',
      'uri',
      'hgid'
    ];
var validFilterReqParams = [
      'type'
    ];

app.use(cors());

// Mount Histograph IO
app.use('/', io);

app.get('/status/queue', queue.status);

app.get('/', function(req, res) {
  res.send({
    name: 'Histograph API',
    version: '0.1.3',
    message: 'Histograph - historical geocoder (alpha version)',
    docs: 'http://histograph.io/docs',
    examples: exampleUrls.map(function(query) { return 'https://' + apiUri + query; })
  });
});

app.get('/search', function(req, res) {

  // Check request params for valid search and filter parameters
  var searchReqParams = paramsFromRequest(validSearchReqParams, req.query);
  var filterReqParams = paramsFromRequest(validFilterReqParams, req.query);
  var options = {};

  // TODO: make function paramIsTrue()
  if (req.query.highlight === 'true') {
    options.highlight = true;
  }

  if (req.query.exact === 'true') {
    options.exactMatch = true;
  } else {
    options.exactMatch = false;
  }

  if (req.query.geometry === 'false') {
    options.geometry = false;
  } else {
    options.geometry = true;
  }

  if (searchReqParams.length == 1) {
    elasticsearch.search(
        searchReqParams[0].param,
        searchReqParams[0].value,
        filterReqParams,
        options,
        function(error, result) {
      if (error) {
        res.status(400).send({
          error: 'Error getting data from Elasticsearch',
          message: result
        });

      } else {
        var hgids = result.map(function(hit) { return hit._id; });

        var reqOptions = {
              uri: CoreApiUri + 'traversal',
              method: 'POST',
              json: {
                hgids: hgids
              }
            };

        request(reqOptions, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            res.send({
              '@context': context,
              type: body.type,
              features: body.features.map(function(feature) {
                feature.properties.pits = feature.properties.pits.map(function(pit) {
                  if (pit.relations) {
                    Object.keys(pit.relations).map(function(relation) {
                      pit.relations[relation] = pit.relations[relation].map(function(hgid) {
                        return {
                          '@id': hgid
                        };
                      });
                    });

                    pit.relations['@id'] = pit.hgid;
                  }

                  // Source is called sourcid in neo4j graph
                  // TODO: maybe Core should do renaming in Traversal API...
                  pit.source = pit.sourceid;
                  delete pit.sourceid;

                  pit['@id'] = pit.hgid;
                  return pit;
                });

                if (options.geometry) {
                  return {
                    type: feature.type,
                    properties: feature.properties,
                    geometry: feature.geometry
                  };
                } else {
                  return {
                    type: feature.type,
                    properties: feature.properties
                  };
                }
              })
            });
          } else {
            res.status(response.statusCode).send({
              error: 'Error getting data from Histograph Core',
              message: error
            });
          }
        });
      }
    });
  } else {
    res.status(400).send({
      error: 'Only one of the following search parameters allowed: ' +
          validSearchReqParams
              .map(function(param) { return '\'' + param + '\''; })
              .join(', ')
    });
  }
});

function paramsFromRequest(validParams, query) {
  return validParams
    .map(function(reqParam) {
      if (query[reqParam]) {
        return {
          param: reqParam,
          value: query[reqParam]
        };
      } else {
        return false;
      }
    })
    .filter(function(reqParam) {
      return reqParam;
    });
}

app.listen(config.api.internalPort, function() {
  console.log(config.logo.join('\n'));
  console.log('Histograph API listening at port ' + config.api.internalPort);
});

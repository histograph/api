var validator = require('is-my-json-valid');
var structureToSchema = require('./structure-to-schema');
var structure = require('./structure');
var validate = validator(structureToSchema(structure));
var config = require('histograph-config');
var normalizeUri = require('./normalize-uri');
var preprocessParam = require('./preprocess-param');
var formatSchemaErrors = require('./format-schema-errors');

// query parameter for specifying relation queries
var related = 'related';

function preprocessParams(query, substructure, processedQuery, prefix) {
  if (prefix) {
    prefix += '.';
  } else {
    prefix = '';
  }

  Object.keys(substructure).forEach(function(param) {
    var pParam = prefix + param;
    var type = substructure[param].type;
    if (query[pParam]) {
      processedQuery[pParam] = preprocessParam(param, type, query[pParam].trim());
    } else if (type === 'boolean') {
      processedQuery[pParam] = substructure[param].default || false;
    }
  });
}

function preprocessSearchParams(query, substructure, processedQuery, prefix) {
  if (prefix) {
    prefix += '.';
  } else {
    prefix = '';
  }

  // First, process special cases!

  // Split queries with comma into related path queries (default relation is `hg:liesIn`)
  // e.g. `?q=kerkstraat,amsterdam` will become `?q=kerkstraat&related=liesIn&related.q=amsterdam`
  if (query.q && query.q.indexOf(',') > -1 && !query.related) {
    var parts = query.q.split(',');
    var pathQuery = parts.pop().trim();

    query.related = config.api.defaultPathRelation;
    query['related.q'] = pathQuery;
    query.q = parts.join(',');
  }

  // Process id, uri and name search parameters
  Object.keys(substructure).forEach(function(param) {
    var pParam = prefix + param;
    if (query[pParam]) {
      if (param === 'uri' || param === 'id') {
        var normalized = normalizeUri(query[pParam]);
        processedQuery[pParam] = normalized.normalized;
      } else {
        processedQuery[pParam] = query[pParam];
      }
    }
  });

  // Process q search parameters
  var pQ = prefix + 'q';
  if (processedQuery[pQ]) {
    var normalized = normalizeUri(processedQuery[pQ]);
    var type = normalized.type;

    if (!processedQuery[prefix + type]) {
      processedQuery[prefix + type] = normalized.normalized;
    }

    delete processedQuery[pQ];
  }

  //if query.q is an empty string, copy the empty string,
  if(query.q == '' && processedQuery['name'] == undefined)
  {
		processedQuery['name'] = query.q
  }

}

exports.preprocess = function(req, res, next) {
  var processedQuery = {};

  // Process search params
  preprocessSearchParams(req.query, structure.query.search, processedQuery);

  // Process relation
  if (req.query[related]) {
    processedQuery[related] = req.query[related].split(',');
  }

  // Process filters
  preprocessParams(req.query, structure.query.filters, processedQuery);

  // Process related search params
  preprocessSearchParams(req.query, structure.query.search, processedQuery, related);

  // Process related filters
  preprocessParams(req.query, structure.query.filters, processedQuery, related);

  // Process modifiers, convert strings to booleans
  preprocessParams(req.query, structure.modifiers, processedQuery);

  req.processedQuery = processedQuery;
  next();
};

exports.check = function(req, res, next) {
  var valid = validate(req.processedQuery);
  if (valid) {
    next();
  } else {
    res.status(400).send({
      message: formatSchemaErrors(validate.errors)
    });
  }
};

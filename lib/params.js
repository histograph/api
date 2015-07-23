var util = require('util');
var _ = require('highland');
var structureToSchema = require('./structure-to-schema');
var structure = require('./structure');
var validator = require('is-my-json-valid');
var validate = validator(structureToSchema(structure));
// TODO: Use!!!
//var processRelation = require('./process-relation-query');
var getSearchParamType = require('./search-param-type');

function strToBool(str) {
  if (str.toLowerCase() === 'true') {
    return true;
  } else if (str.toLowerCase() === 'false') {
    return false;
  } else {
    return str;
  }
}

function strToArray(str) {
  return str.split(',');
}

function preprocessParams(query, substructure, processedQuery, prefix) {
  if (prefix) {
    prefix += '.';
  } else {
    prefix = '';
  }

  Object.keys(substructure).forEach(function(param) {
    var pParam = prefix + param;
    if (query[pParam]) {
      var type = substructure[param].type
      if (type === 'enum') {
        processedQuery[pParam] = strToArray(query[pParam]);
      } else if (type === 'boolean') {
        processedQuery[pParam] = strToBool(query[pParam]);
      } else {
        processedQuery[pParam] = query[pParam]
      }
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

  // Split queries with comma into hg:liesIn queries
  // e.g. `?q=kerkstraat,amsterdam` will become `?q=kerkstraat&hg:liesIn=amsterdam`
  if (query.q && query.q.indexOf(',') > -1 && !query['related']) {
    var parts = query.q.split(',');
    var liesIn = parts.pop().trim();

    query['related'] = 'hg:liesIn';
    query['related.q'] = liesIn;
    query.q = parts.join(',');
  }

  // Process id, uri and name search parameters
  Object.keys(substructure).forEach(function(param) {
    var pParam = prefix + param;
    if (query[pParam]) {
      processedQuery[pParam] = query[pParam];
    }
  });

  // Process q search parameters
  var pQ = prefix + 'q';
  if (processedQuery[pQ]) {
    var normalized = getSearchParamType(processedQuery[pQ]);
    var type = normalized.type;

    if (!processedQuery[prefix + type]) {
      processedQuery[prefix + type] = normalized.normalized;
    }
    delete processedQuery[pQ];
  }
}

exports.preprocess = function(req, res, next) {
  var processedQuery = {};

  // Process search params
  preprocessSearchParams(req.query, structure.query.search, processedQuery);

  // Process relation
  if (req.query[structure.query.relation]) {
    processedQuery[structure.query.relation] = strToArray(req.query[structure.query.relation]);
  }

  // Process filters
  preprocessParams(req.query, structure.query.filters, processedQuery);

  // Process related search params
  preprocessSearchParams(req.query, structure.query.search, processedQuery, structure.query.relation);

  // Process related filters
  preprocessParams(req.query, structure.query.filters, processedQuery, structure.query.relation);

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
      message: validate.errors
    });
  }
};

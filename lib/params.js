var fs = require('fs');
var util = require('util');
var path = require('path');
var _ = require('highland');

// TODO: look into:
// - http://raml.org/
// - https://www.npmjs.com/package/osprey

var searchTypes = [
  'q',
  'name',
  'hgid',
  'uri'
];

var booleanParams = [
  {
    param: 'highlight',
    default: false
  },
  {
    param: 'exact',
    default: false
  },
  {
    param: 'geometry',
    default: true
  }
];

function checkSearchTypes(query, callback) {
  var searchTypeCount = 0;
  searchTypes.forEach(function(searchType) {
    if (query[searchType]) {
      searchTypeCount += 1;
    }
  });

  if (searchTypeCount === 1) {
    if (query.q) {
      var searchType = searchTypeFromValue(query.q);
      query[searchType] = query.q;
      delete query.q;
    }

    callback(null, true);
  } else {
    var searchTypesString = searchTypes
      .map(function(param) { return '\'' + param + '\''; })
      .join(', ');
    callback(util.format('Only one of the following search parameters allowed: %s', searchTypesString));
  }
}

function checkFilters(query, callback) {
  callback(null, true);
}

function checkBooleans(query, callback) {
  _(booleanParams.map(function(booleanParam) {
    return _.curry(valueIsTrue, booleanParam.param, booleanParam.default);
  }))
  .nfcall([query]).series()
  .stopOnError(function (err) {
    callback(err);
  })
  .toArray(function (results) {
    if (results.length === booleanParams.length) {
      // No errors!
      callback(null, true);
    }
  });
}

function splitTypes(query, callback) {
  if (query.type) {
    query.type = query.type.split(',');
  }
  callback(null, true);
}

exports.preprocess = function(req, res, next) {
  if (req.query.q && req.query.q.indexOf(',') > -1 && !req.query['hg:liesIn']) {
    var parts = req.query.q.split(',');
    var liesIn = parts.pop().trim();

    req.query['hg:liesIn'] = liesIn;
    req.query.q = parts.join(',');
  }

  next();
};

exports.check = function(req, res, next) {
  var checks = [
    checkSearchTypes,
    checkFilters,
    checkBooleans,
    splitTypes,
  ];

  _(checks)
  .nfcall([req.query]).series()
  .stopOnError(function (err) {
    res.status(400).send({
      message: err
    });
  })
  .toArray(function (results) {
    if (results.length === checks.length) {
      // No errors!
      next();
    }
  });
}

function valueIsTrue(param, def, query, callback) {
  if (typeof query[param] === 'undefined') {
    query[param] = def;
    callback(null, def);
  } else if (query[param].toLowerCase() === 'true') {
    query[param] = true;
    callback(null, true);
  } else if (query[param].toLowerCase() === 'false') {
    query[param] = false;
    callback(null, false);
  } else {
    callback(util.format('URL parameter \'%s\' must either be true or false', param));
  }
};

function searchTypeFromValue(value) {
  if (value.indexOf('http') === 0) {
    return 'uri';
  } else if (value.indexOf('/') > -1) {
    return 'hgid';
  } else {
    return 'name';
  }
}

exports.searchTypeFromValue = searchTypeFromValue;

exports.getSearchParam = function(query) {
  var searchParam;
  searchTypes.forEach(function(searchType) {
    if (query[searchType]) {
      searchParam = {
        type: searchType,
        value: query[searchType]
      };
    }
  });
  return searchParam;
};

// exports.paramsFromRequest = function(query, validParams) {
//   return validParams
//     .map(function(reqParam) {
//       if (query[reqParam]) {
//         return {
//           param: reqParam,
//           value: query[reqParam]
//         };
//       } else {
//         return false;
//       }
//     })
//     .filter(function(reqParam) {
//       return reqParam;
//     });
// };
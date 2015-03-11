var config = require(process.env.HISTOGRAPH_CONFIG),
    elasticsearch = require('elasticsearch'),
    baseQuery = require('./queries/base.json'),
    client = new elasticsearch.Client({
      host: config.elasticsearch.host + ':' + config.elasticsearch.port
      //log: 'trace'
    });

// {
//   "query_string": {
//     "fields": [
//       "name"
//     ],
//     "query": "ams*"
//   }
// }

function makeQueryStringQuery(field, value) {
  return {
    "query_string": {
      "query": value,
      "fields": [
        field
      ]
    }
  };
}

// {
//   "term": {
//     "uri": "http://vocab.getty.edu/tgn/7259859"
//   }
// }

function makeTermFilter(field, value) {
  var filter = {
    "term": {}
  };
  filter.term[field] = value;
  return filter;
}

function search(searchParam, value, filterParams, options, callback) {
  // TODO: find another way to recycle baseQuery
  baseQuery.query.filtered.query.bool.must = [];
  baseQuery.query.filtered.filter.bool.must = [];

  if (options.highlight) {
    baseQuery.highlight = {
      fields : {
        name : {}
      }
    }
  } else {
    delete baseQuery.highlight;
  }

  if (searchParam === "name") {
    baseQuery.query.filtered.query.bool.must.push(makeQueryStringQuery(searchParam, value));
  } else {
    baseQuery.query.filtered.filter.bool.must.push(makeTermFilter(searchParam, value));
  }

  filterParams.forEach(function(filterParam) {
    baseQuery.query.filtered.filter.bool.must.push(makeTermFilter(filterParam.param, filterParam.value));
  });


  client.search({
    index: config.elasticsearch.index,
    type: 'pit',
    body: baseQuery
  }).then(function (resp) {
    callback(false, resp.hits.hits);
  }, function (err) {
    callback(true, err.message);
  });
}

module.exports.search = search;

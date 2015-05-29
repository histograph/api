var config = require(process.env.HISTOGRAPH_CONFIG);
var elasticsearch = require('elasticsearch');
var baseQuery = require('../data/baseQuery.json');
var client = new elasticsearch.Client({
      host: config.elasticsearch.host + ':' + config.elasticsearch.port
    });

// {
//   'query_string': {
//     'fields': [
//       'name'
//     ],
//     'query': 'ams*'
//   }
// }

function makeQueryStringQuery(field, value) {
  return {
    query_string: {
      query: value,
      fields: [
        field
      ]
    }
  };
}

// {
//   'term': {
//     'uri': 'http://vocab.getty.edu/tgn/7259859'
//   }
// }

function makeTermFilter(field, value) {
  var filter = {
    term: {}
  };
  filter.term[field] = value;
  return filter;
}

function search(searchParam, value, query, callback) {

  // TODO: find another way to recycle baseQuery
  baseQuery.query.filtered.query.bool.must = [];
  baseQuery.query.filtered.filter.bool.must = [];

  if (query.highlight) {
    baseQuery.highlight = {
      fields: {
        name: {}
      }
    };
  } else {
    delete baseQuery.highlight;
  }

  if (searchParam === 'name') {
    if (query.exact) {
      searchParam = searchParam + '.exact';
    } else {
      searchParam = searchParam + '.analyzed';
    }

    baseQuery.query.filtered.query.bool.must.push(makeQueryStringQuery(searchParam, value));
  } else {
    baseQuery.query.filtered.filter.bool.must.push(makeTermFilter(searchParam, value));
  }


  if (query.type) {
    baseQuery.query.filtered.filter.bool.must.push(makeTermFilter('type', query.type));
  }

  client.search({
    index: config.elasticsearch.index,
    type: 'pit',
    body: baseQuery
  }).then(function(resp) {
    callback(false, resp.hits.hits);
  },

  function(err) {
    callback(true, err.message);
  });
}

module.exports.search = search;

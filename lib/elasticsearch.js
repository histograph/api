var config = require(process.env.HISTOGRAPH_CONFIG);
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: config.elasticsearch.host + ':' + config.elasticsearch.port
});

function baseQuery() {
  return {
    "size": 50,
    "_source": [
      "_id"
    ],
    "query": {
      "filtered": {
        "filter": {
          "bool": {
            "must": []
          }
        },
        "query": {
          "bool": {
            "must": []
          }
        }
      }
    }
  }

}


module.exports.searchQuery = function(params) {
  return function(callback) {
    var index = '*';
    if (params.dataset) {
      index = params.dataset.join(',');
    }

    var query = baseQuery();

    if (params.name) {
      //searchParam = searchParam + '.analyzed';

      query.query.filtered.query.bool.must.push({
        query_string: {
          query: params.name,
          fields: [
            'name'
          ]
        }
      });
    }

    var id = params.uri || params.id;
    if (id) {
      query.query.filtered.filter.bool.must.push({
        term: {
          _id: id
        }
      });
    }

    if (params.type) {
      query.query.filtered.filter.bool.must.push({
        or: params.type.map(function(type) {
          return {
            type: {
              value: type
            }
          };
        })
      });
    }

    // TODO:
    // - type
    // - within (geo filter)
    // - before (date filter)
    // - after (date filter)
    // - exact

    client.search({
      index: index,
      body: query
    }).then(function(resp) {
      callback(null, resp.hits.hits.map(function(hit) {
        return hit._id;
      }));
    },

    function(err) {
      callback(err);
    });
  };
}

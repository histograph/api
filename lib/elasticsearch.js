var config = require('histograph-config');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: config.elasticsearch.host + ':' + config.elasticsearch.port
});

var pageSize = config.elasticsearch.pagesize;

function baseQuery() {
  return {
    size: pageSize,
    _source: [
      '_id'
    ],
    query: {
      bool: {
              must: [],
              filter: {
                bool: {
                  must: [],
                  should:[],
                  minimum_should_match : 1
                }
              },
              must_not: [],
              should: [],
              "minimum_should_match" : 1,
              "boost" : 1.0
      }
    }
  };
}

module.exports.searchQuery = function(params) {
  return function(callback) {
    var index = '*';
    if (params.dataset) {
      index = params.dataset.join(',');
    }

    var query = baseQuery();

    if (params.name) {
      var field = 'name.' + (params.exact ? 'exact' : 'analyzed');

      query.query.bool.must.push({
        term: {
          field: params.name
        }
      });
    }

    var id = params.uri || params.id;
    if (id) {
      query.query.bool.filter.bool.must.push({
        term: {
          _id: id
        }
      });
    }

    if (params.type) {
      params.type.forEach(function (my_type){
        query.query.bool.filter.bool.should.push(
          {term: {type: my_type}}
        );
      });
    }

    if (params.intersects) {
      query.query.bool.filter.bool.must.push({
        geo_shape: {
          geometry: {
            shape: params.intersects
          }
        }
      });
    }

    if (params.before) {
      query.query.bool.filter.bool.must.push({
        range: {
          validSince: {
            lte: params.before
          }
        }
      });
    }

    if (params.after) {
      query.query.bool.filter.bool.must.push({
        range: {
          validUntil: {
            gte: params.after
          }
        }
      });
    }

    console.log("query: " + JSON.stringify(query) );

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
};

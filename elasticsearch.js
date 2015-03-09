var config = require(process.env.HISTOGRAPH_CONFIG),
    elasticsearch = require('elasticsearch'),
    client = new elasticsearch.Client({
      host: config.elasticsearch.host + ':' + config.elasticsearch.port
      //log: 'trace'
    });

var query = {
  _source: ["hgid", "name"],
  query: {
    filtered: {
      query: {
        query_string: {
          query: "",
          fields: [
            "pit.name"
          ]
        }
      }
    }
  },
  size: 50
}

function findByName(name, callback) {
  query.query.filtered.query.query_string.query = name;
  client.search({
    index: config.elasticsearch.index,
    type: 'pit',
    body: query
  }).then(function (resp) {
    callback(resp.hits.hits);
  }, function (err) {
    callback(err.message);
  });
}

module.exports.findByName = findByName;
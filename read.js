#!/usr/local/bin/node

var grex = require('grex'),
    options = {
      'host': 'localhost',
      'port': 8182,
      'graph': 'graph'
    },
    client = grex.createClient(options),
    gremlin = grex.gremlin,
    g = grex.g;

var query = gremlin(g.V());

client.execute(query, function(err, response) {
  console.log(response)
});

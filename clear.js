#!/usr/local/bin/node

var grex = require('grex'),
    async = require('async'),
    fs = require('fs'),
    options = {
      'host': 'localhost',
      'port': 8182,
      'graph': 'graph'
    },
    client = grex.createClient(options),
    gremlin = grex.gremlin,
    g = grex.g;

var query = gremlin();
query("g.V.each{g.removeVertex(it)}");
client.execute(query, function(err, response) {
  console.log("Jaaaa alles is weg!");
});

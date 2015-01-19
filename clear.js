#!/usr/local/bin/node

var grex = require('grex'),
    async = require('async'),
    fs = require('fs'),
    options = JSON.parse(fs.readFileSync('config.json', 'utf8')),
    client = grex.createClient(options),
    gremlin = grex.gremlin,
    g = grex.g;

var query = gremlin();
query("g.V.each{g.removeVertex(it)}");
client.execute(query, function(err, response) {
  console.log("Done...");
});

#!/usr/local/bin/node

// TODO: make importer use stdin!
// http://shapeshed.com/command-line-utilities-with-nodejs/

var grex = require('grex'),
    argv =require('optimist')
      .usage('Load a GraphSON file into Titan.\nUsage: $0')
      .demand('f')
      .alias('f', 'file')
      .describe('f', 'Load a file')
      .argv
    fs = require('fs'),
    path = require('path'),
    options = JSON.parse(fs.readFileSync('config.json', 'utf8')),
    client = grex.createClient(options),
    gremlin = grex.gremlin,
    g = grex.g;

function execute(query, callback) {
  client.execute(query, function(err, response) {
    if (response) {
      return callback(response);
    }
    if (err) {
      console.log("ERROR:");
      console.log(err);
      callback(null);
    }
  });
}

var absolutePath = path.resolve(argv.file);
var query = gremlin("g.loadGraphSON('" + absolutePath + "')");
execute(query, function(response) {
  console.log("Done...");
});

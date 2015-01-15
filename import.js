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


// TODO:
// Read GraphSON file, line by line
// Create vertices and edges

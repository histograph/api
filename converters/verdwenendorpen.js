#!/usr/local/bin/node

// Conversion script for Verdwenen Dorpen data set.
// No edges!
var fileNameOut = 'verdwenen-dorpen.graphson.json';
var source = 'verdwenen-dorpen';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms Verdwenen Dorpen data set into GraphSON format.\nUsage: $0')
      .demand('f')
      .alias('f', 'file')
      .describe('f', 'Load a file')
      .argv
    fs = require('fs'),
    async = require('async'),
    parse = require('csv-parse'),
    path = require('path');

function containsObject(obj, list) {
    for (var i=0; i<list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

var verticesHeader = '{ "graph": { "mode": "NORMAL", "vertices": ',
    edgesHeader = ', "edges": ',
    footer = '} }';

var fileOut = path.join(path.dirname(path.resolve(argv.file)), fileNameOut);

// VERTICES
function parseVertices(callback) {
  
  fs.writeFileSync(fileOut, verticesHeader);

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ','}, function(err, data) {  
    console.log("Parsing vertices...");
    var vertices = [];
        
    data.shift(); // Remove CSV header

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + i;
        
      var vertex = {
        _id: uri,
        _type: "vertex",
        uri: uri,
        name: obj[2],
        source: source,
        type: "hg:Place",
        geometry: {"type": "Point", "coordinates": [parseFloat(obj[6]), parseFloat(obj[5])]},
        startDate: "",
        endDate: obj[12]
      }
      vertices.push(vertex);
    }

    console.log(data.length + " vertices parsed.");
    fs.appendFileSync(fileOut, JSON.stringify(vertices, null, 4));
    callback(null, true);
  });
}

function doneMsg(callback) {
  fs.appendFileSync(fileOut, footer);
  console.log("Done!");
  callback(null, true);
}

async.series([
    parseVertices,
    doneMsg
  ]
);
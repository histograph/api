#!/usr/local/bin/node

// Conversion script for Simon Hart data set.
var fileNameOut = 'simon-hart.graphson.json';
var source = 'simon-hart';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms Simon Hart data set into GraphSON format.\nUsage: $0')
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
    if (list[i] === obj) return true;
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

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ',', escape: '\\'}, function(err, data) {  
    console.log("Parsing vertices...");
    var vertices = [];
        
    data.shift(); // Remove CSV header

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + obj[0];
              
      var vertex = {
        _id: uri,
        _type: "vertex",
        uri: uri,
        name: obj[1],
        source: source,
        type: "hg:Place",
        geometry: "",
        startDate: "",
        endDate: ""
      }
      vertices.push(vertex);
    }

    console.log(data.length + " vertices parsed.");
    fs.appendFileSync(fileOut, JSON.stringify(vertices, null, 4));
    callback(null, true);
  });
}

function parseEdges(callback) {
  fs.appendFileSync(fileOut, edgesHeader);

  console.log("Parsing GeoNames link edges...");
  var edges = [],
      edgeCount = 0;
  
  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ',', escape: '\\'}, function(err, data) {  
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + obj[0];

      var splitGNuri = obj[2].split("/");
      
      if (!(splitGNuri[splitGNuri.length - 1] == '')) { // GeoNames URI available
        var geonamesURI = "geonames/" + splitGNuri[splitGNuri.length - 1];
        
        var edge = {
          _id: source + "/e" + ++edgeCount,
          _outV: uri,
          _inV: geonamesURI,
          source: source,
          _type: "edge",
          _label: "hg:isUsedFor"
        };

        edges.push(edge);     
      }
    }
    console.log(edgeCount + " GeoNames link edges parsed.");
    fs.appendFileSync(fileOut, JSON.stringify(edges, null, 4));
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
  parseEdges,
  doneMsg
]);
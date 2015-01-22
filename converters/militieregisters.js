#!/usr/local/bin/node

// Conversion script for Militieregisters data set
var fileNameOut = 'militieregisters.graphson.json';
var source = 'militieregisters';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms Militieregisters data set into GraphSON format.\nUsage: $0')
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

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ','}, function(err, data) {  
    console.log("Parsing vertices...");
    var vertices = [];
        
    data.shift(); // Remove CSV header

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + i;
      
      var startDate = (obj[2].length != 4) ? obj[2] : obj[2] + "-01-01";
      var endDate = (obj[3].length != 4) ? obj[3] : obj[3] + "-01-01";
        
      var vertex = {
        _id: uri,
        _type: "vertex",
        uri: uri,
        name: obj[0],
        source: source,
        type: "hg:Place",
        geometry: {},
        startDate: startDate,
        endDate: endDate
      }
      vertices.push(vertex);
    }

    console.log(data.length + " vertices parsed.");
    fs.appendFileSync(fileOut, JSON.stringify(vertices, null, 4));
    callback(null, true);
  });
}

// EDGES
function parseEdges(callback) {
  fs.appendFileSync(fileOut, edgesHeader);

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ','}, function(err, data) {    
    var edges = [];
    data.shift(); // Remove CSV header
    
    console.log("Parsing GeoNames link edges...");
    
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + i;
  
      if (obj[5].length > 0) {
        
        var splitGNuri = obj[5].split("/");
        var geonamesURI = "geonames/" + splitGNuri[splitGNuri.length - 1];
          
        var edge = {
          _id: source + "/e" + i,
          _outV: uri,
          _inV: geonamesURI,
          source: source,
          _type: "edge",
          _label: "hg:wasUsedFor"
        };

        edges.push(edge);     
      }
    }
    
    console.log(edges.length + " GeoNames link edges parsed.");
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
  ]
);
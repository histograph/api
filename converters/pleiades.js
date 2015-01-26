#!/usr/local/bin/node

// Conversion script for Pleiades data set
var fileNameOut = 'pleiades.graphson.json';
var source = 'pleiades';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms Pleiades data set into GraphSON format.\nUsage: $0')
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
      
      var startDate = (obj[2].length > 0) ? parseInt(obj[8]) + "-01-01" : "";
      var endDate = (obj[3].length > 0) ? parseInt(obj[7]) + "-01-01" : "";
      var geometry = {"type": "Point", "coordinates": [parseFloat(obj[10]), parseFloat(obj[9])]};
        
      var vertex = {
        _id: uri,
        _type: "vertex",
        uri: uri,
        name: obj[4],
        source: source,
        type: "hg:Place",
        geometry: geometry,
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

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ',', escape: '\\'}, function(err, data) {    
    var edges = [];
    data.shift(); // Remove CSV header
    
    console.log("Parsing GeoNames link edges...");
    
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + obj[0];
  
      if (obj[6] != "NULL") {
        
        var splitGNuri = obj[6].split("/");
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
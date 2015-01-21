#!/usr/local/bin/node

// Conversion script for BAG data set
var fileNameOut = 'bag.graphson.json';
var source = 'bag';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms BAG data set into GraphSON format.\nUsage: $0')
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

var usedURIs = [];
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
      var uri = source + "/" + obj[1];
      
      if (!containsObject(uri, usedURIs)) {
  
        var vertex = {
          _id: uri,
          _type: "vertex",
          uri: uri,
          name: obj[2],
          source: source,
          type: "hg:Place",
          geometry: {"type": "Point", "coordinates": [parseFloat(obj[4]), parseFloat(obj[3])]},
          startDate: "",
          endDate: ""
        }
        vertices.push(vertex);
        usedURIs.push(uri);
      }
    }

    console.log(usedURIs.length + " vertices parsed.");
    fs.appendFileSync(fileOut, JSON.stringify(vertices, null, 4));
    callback(null, true);
  });
}

// EDGES
function parseEdges(callback) {
  fs.appendFileSync(fileOut, edgesHeader);

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ','}, function(err, data) {    
    var edges = [];
    var edgeCount = 0;
    data.shift(); // Remove CSV header
    
    console.log("Parsing TGN link edges...");
        
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + obj[1];
  
      if (containsObject(uri, usedURIs) && obj[6].length > 0) {
        
        var splitTGNuri = obj[6].split("/");
        var tgnURI = "tgn/" + splitTGNuri[splitTGNuri.length - 1];
          
        var edge = {
          _id: source + "/e" + ++edgeCount,
          _outV: uri,
          _inV: tgnURI,
          source: source,
          _type: "edge",
          _label: "hg:sameAs"
        };

        edges.push(edge);     
      }
    }
    
    console.log(edgeCount + " TGN link edges parsed.");
    console.log("Parsing GeoNames link edges...");
    var tgnCount = edgeCount;
    
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + obj[1];
  
      if (containsObject(uri, usedURIs) && obj[5].length > 0) {
        
        var splitGNuri = obj[5].split("/");
        var geonamesURI = "geonames/" + splitGNuri[splitGNuri.length - 1];
          
        var edge = {
          _id: source + "/e" + ++edgeCount,
          _outV: uri,
          _inV: geonamesURI,
          source: source,
          _type: "edge",
          _label: "hg:sameAs"
        };

        edges.push(edge);     
      }
    }
    
    console.log((edgeCount - tgnCount) + " GeoNames link edges parsed.");
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
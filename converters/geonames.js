#!/usr/local/bin/node

// Conversion script for GeoNames data set
var fileNameOut = 'geonames.graphson.json';
var source = 'geonames';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms GeoNames data set into GraphSON format.\nUsage: $0')
      .demand('f')
      .alias('f', 'file')
      .describe('f', 'Load a file')
      .argv
    fs = require('fs'),
    async = require('async'),
    parse = require('csv-parse'),
    path = require('path');

// Transforms GeoNames object types to HG ontology types
var objectTypeMap = {
  "inhabited places": "place",
};

var provinceMap = {};

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
      var obj = data[i],
          objType = obj[11];
      
      var splitURI = obj[2].split("/");
      var uri = source + "/" + splitURI[splitURI.length - 1];
        
      if (objectTypeMap.hasOwnProperty(objType)) {
        if (!containsObject(uri, usedURIs)) {
    
          var objType = objectTypeMap[obj[11]];

          var vertex = {
            _id: uri,
            _type: "vertex",
            uri: uri,
            name: obj[1],
            source: source,
            type: "hg:" + objType.charAt(0).toUpperCase() + objType.slice(1),
            geometry: {"type": "Point", "coordinates": [parseFloat(obj[4]), parseFloat(obj[3])]},
            startDate: "",
            endDate: ""
          }
          vertices.push(vertex);
          usedURIs.push(uri);
        }
      }
    }

    console.log(usedURIs.length + " vertices parsed.");
    console.log("Parsing provinces...");
  
    var provinces = [],
        provCount = 0;

    for (var i=0; i<data.length; i++) {
      var obj = data[i],
          provName = obj[6];
        
      if (!containsObject(provName, provinces)) {

        var uri = source + "/p" + ++provCount;

        var vertex = {
          _id: uri,
          _type: "vertex",
          uri: uri,
          name: provName,
          source: source,
          type: "hg:Province",        
          startDate: "",
          endDate: ""
        };
        
        vertices.push(vertex);
        provinces.push(provName);
        provinceMap[provName] = uri;
      }
    }
    
    console.log(provCount + " provinces parsed.");
    fs.appendFileSync(fileOut, JSON.stringify(vertices, null, 4));
    callback(null, true);
  });
}

// EDGES
function parseEdges(callback) {
  fs.appendFileSync(fileOut, edgesHeader);

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ','}, function(err, data) {
    console.log("Parsing province edges...");
    
    var edges = [];
    var edgeCount = 0;
    data.shift(); // Remove CSV header

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      
      var splitURI = obj[2].split("/");
      var uri = source + "/" + splitURI[splitURI.length - 1];
  
      if (containsObject(uri, usedURIs) && provinceMap.hasOwnProperty(obj[6])) {
        var edge = {
          _id: source + "/e" + ++edgeCount,
          _outV: uri,
          _inV: provinceMap[obj[6]],
          source: source,
          _type: "edge",
          _label: "hg:liesIn"
        };
        edges.push(edge);
      }
    }
    
    console.log(edgeCount + " province edges parsed.");
    console.log("Parsing TGN link edges...");
    var provEdgeCount = edgeCount;
        
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var splitURI = obj[2].split("/");
      var uri = source + "/" + splitURI[splitURI.length - 1];
  
      if (containsObject(uri, usedURIs)) {
        
        var splitTGNuri = obj[7].split("/");
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
    console.log((edgeCount - provEdgeCount) + " TGN link edges parsed.");
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
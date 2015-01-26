#!/usr/local/bin/node

// TODO Edges voor gemeentes die in andere gemeentes zijn opgegaan: ontbreekt in brondata!
// TODO Provincies aparte pits voor de aparte tijden waar de gemeentes bij horen?
// TODO Edges naar GeoNames: welke relatie? sameAs is wellicht onjuist

// Conversion script for Gemeentegeschiedenis data set
var fileNameOut = 'gemeentegeschiedenis.graphson.json';
var source = 'gemeentegeschiedenis';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms Gemeentegeschiedenis data set into GraphSON format.\nUsage: $0')
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

var usedURIs = [],
    provinceMap = {},
    becameList = [];
    
var fileOut = path.join(path.dirname(path.resolve(argv.file)), fileNameOut);

// VERTICES
function parseVertices(callback) {
  
  fs.writeFileSync(fileOut, verticesHeader);

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ',', escape: '\\'}, function(err, data) {  
    console.log("Parsing vertices...");
    
    var vertices = [],
        lastVertex = {
          uri: "",
          name: "",
          endDate: ""
        };
    
    data.shift(); // Remove CSV header

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + obj[0];
      
      if (!containsObject(uri, usedURIs)) {
  
        var geometry = (obj[11] == "null") ? "" : JSON.parse(obj[11]).features[0].geometry;
        var startDate = (obj[12] == "0") ? "" : obj[12] + "-01-01";
        var endDate = (obj[13] == "heden") ? "" : obj[13] + "-01-01";
  
        var vertex = {
          _id: uri,
          _type: "vertex",
          uri: uri,
          name: obj[1],
          source: source,
          type: "hg:Municipality",
          geometry: geometry,
          startDate: startDate,
          endDate: endDate
        }
      
        vertices.push(vertex);
        usedURIs.push(uri);
        
        if (vertex.name == lastVertex.name && vertex.startDate == lastVertex.endDate) {
          becameList.push([lastVertex.uri, vertex.uri]);
        }
        
        lastVertex.uri = vertex.uri;
        lastVertex.name = vertex.name;
        lastVertex.endDate = vertex.endDate;
      }
    }

    console.log(usedURIs.length + " vertices parsed.");
    console.log("Parsing provinces...");
    
    var provinces = [],
        provCount = 0;

    for (var i=0; i<data.length; i++) {
      var obj = data[i],
          provName = obj[9];
    
      if (provName != "--" && !containsObject(provName, provinces)) {

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

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ',', escape: '\\'}, function(err, data) { 
    var edges = [];
    var edgeCount = 0;
    data.shift(); // Remove CSV header
    
    console.log("Parsing province edges...");
 
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + obj[0];
  
      if (containsObject(uri, usedURIs) && provinceMap.hasOwnProperty(obj[9])) {
        var edge = {
          _id: source + "/e" + ++edgeCount,
          _outV: uri,
          _inV: provinceMap[obj[9]],
          source: source,
          _type: "edge",
          _label: "hg:liesIn"
        };
        edges.push(edge);
      }
    }
    
    console.log(edgeCount + " province link edges parsed.");
    console.log("Parsing GeoNames link edges...");

    var provCount = edgeCount;
    
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/" + obj[0];
  
      if (containsObject(uri, usedURIs) && obj[6] != "0") {
        
        var geonamesURI = "geonames/" + obj[6];
          
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
    
    console.log((edgeCount - provCount) + " GeoNames link edges parsed.");
    console.log("Parsing municipality transition edges...");
    var GNcount = edgeCount;
    
    for (var i=0; i<becameList.length; i++) {          
      var edge = {
        _id: source + "/e" + ++edgeCount,
        _outV: becameList[i][0],
        _inV: becameList[i][1],
        source: source,
        _type: "edge",
        _label: "hg:became"
      };
      edges.push(edge);     
    }
    
    console.log((edgeCount - GNcount) + " municipality transition edges parsed.");
    
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
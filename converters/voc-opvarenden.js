#!/usr/local/bin/node

// Conversion script for VOC Opvarenden data set
var fileNameOut = 'voc-opvarenden.graphson.json';
var source = 'voc-opvarenden';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms VOC Opvarenden data set into GraphSON format.\nUsage: $0')
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
    if (JSON.stringify(list[i]) === JSON.stringify(obj)) return true;
  }
  return false;
}

var verticesHeader = '{ "graph": { "mode": "NORMAL", "vertices": ',
    edgesHeader = ', "edges": ',
    footer = '} }';

var usedURIs = [],
    currentPlacesList = [],
    oldToCurrentMap = [],
    currentPlacesURIs = {};

var fileOut = path.join(path.dirname(path.resolve(argv.file)), fileNameOut);

// VERTICES
function parseVertices(callback) {
  
  fs.writeFileSync(fileOut, verticesHeader);

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ','}, function(err, data) {
  
    var vertices = [];
    data.shift(); // Remove CSV header

    console.log("Parsing current places...");

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/c" + obj[0];
      
      var checkObj = {name: obj[2],
                      gn: obj[6]};
      
      if ((!containsObject(uri, usedURIs)) &&  (obj[2] != "") && (!containsObject(checkObj, currentPlacesList))) {
  
        var vertex = {
          _id: uri,
          _type: "vertex",
          uri: uri,
          name: obj[2],
          source: source,
          type: "hg:Place",
          geometry: "",
          startDate: "",
          endDate: ""
        }
        vertices.push(vertex);
        usedURIs.push(uri);
        currentPlacesList.push(checkObj);
        currentPlacesURIs[JSON.stringify({name: obj[2], gn: obj[6]})] = uri;
      }
    }
    console.log(usedURIs.length + " vertices parsed.");
    
    console.log("Parsing old place names...");
    
    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var uri = source + "/o" + obj[0];
      
      var startDate = (obj[3].length != 4) ? obj[3] : obj[3] + "-01-01";
      var endDate = (obj[4].length != 4) ? obj[4] : obj[4] + "-01-01";
      
      var vertex = {
        _id: uri,
        _type: "vertex",
        uri: uri,
        name: obj[1],
        source: source,
        type: "hg:Place",
        geometry: "",
        startDate: startDate,
        endDate: endDate
      };
      vertices.push(vertex);
      usedURIs.push(uri);
            
      var key = JSON.stringify({name: obj[2], gn: obj[6]});
      
      if (currentPlacesURIs.hasOwnProperty(key)) {
        // Map for creating edges later on
        oldToCurrentMap.push([uri, currentPlacesURIs[key]]);
      }
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
    var edgeCount = 0;
    data.shift(); // Remove CSV header
    
    console.log("Parsing current places to GeoNames link edges...");
        
    for (var i=0; i<currentPlacesList.length; i++) {
      var obj = currentPlacesList[i];
      var uri = currentPlacesURIs[JSON.stringify(obj)];
      
      if (obj.gn.length > 0) {
        var splitGNuri = obj.gn.split("/");
        var gnURI = "geonames/" + splitGNuri[splitGNuri.length - 1];
        
        var edge = {
          _id: source + "/e" + ++edgeCount,
          _outV: uri,
          _inV: gnURI,
          source: source,
          _type: "edge",
          _label: "hg:sameAs"
        };

        edges.push(edge);     
      }
    }
    
    var tgngnCount = edgeCount;

    console.log(tgngnCount + " current places to GeoNames link edges parsed.");
    console.log("Parsing old to current places link edges...");
        
    for (var i=0; i<oldToCurrentMap.length; i++) {
      var obj = oldToCurrentMap[i];
  
      var edge = {
        _id: source + "/e" + ++edgeCount,
        _outV: obj[0],
        _inV: obj[1],
        source: source,
        _type: "edge",
        _label: "hg:wasUsedFor"
      };

      edges.push(edge);     
    }

    console.log((edgeCount - tgngnCount) + " old to current places link edges parsed.");
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
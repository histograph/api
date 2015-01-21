#!/usr/local/bin/node

// Aggregation script for GraphSON files
var fileNameOut = 'totalGraph.graphson.json';
var rejectedEdgesOut = 'rejectedEdges.json';

var grex = require('grex'),
  argv = require('optimist')
    .usage('Combines two or more GraphSON files into one.\nUsage: $0 <data directory> <dataset name> <dataset name> [...]')
    .argv
  fs = require('fs'),
  async = require('async'),
  path = require('path');

if (argv._.length < 3) {
  console.log("A minimum of 2 data sets is required.");
  return false;
}

var dataDir = path.resolve(argv._.shift());

function containsObject(obj, list) {
  for (var i=0; i<list.length; i++) {
    if (list[i] === obj) return true;
  }
  return false;
}

function validateFiles (callback) {
  if (!fs.existsSync(dataDir)) {
    return callback("Directory \"" + dataDir + "\" does not exist or cannot be read.");
  }

  async.each(argv._, function(datasetName, callback) {
    var file = path.join(dataDir, datasetName, datasetName + ".graphson.json");
    
    if (!fs.existsSync(file)) {
      return callback("File " + file + " does not exist or cannot be read.");
    } 
    
    var g = JSON.parse(fs.readFileSync(file, {encoding: 'utf8'}));
    if (!('graph' in g && 'vertices' in g.graph && 'edges' in g.graph && 'mode' in g.graph)) {
      console.log(g);
      return callback("File " + file + " contains malformed GraphSON data.");
    }
    callback();
  }, function(err) {
    if (err) return callback(err);
    callback(null, true);
  });
};

function readVertices (callback) {
  console.log("Reading vertices...");
  
  async.each(argv._, function(datasetName, callback) {
    var file = path.join(dataDir, datasetName, datasetName + ".graphson.json");
    var g = JSON.parse(fs.readFileSync(file, {encoding: 'utf8'}));
    for (var i=0; i<g.graph.vertices.length; i++) {
      vertices.push(g.graph.vertices[i]);
      vertexMap.push(g.graph.vertices[i].uri);
    }
    callback();
  }, function(err) {
    if (err) return callback(err);
    console.log("Finished reading vertices. " + vertices.length + " vertices read.");
    callback(null, true);
  });
};

function readEdges (callback) {
  console.log("Reading edges...");
  
  async.each(argv._, function(datasetName, callback) {
    var file = path.join(dataDir, datasetName, datasetName + ".graphson.json");
    var g = JSON.parse(fs.readFileSync(file, {encoding: 'utf8'}));
    for (var i=0; i<g.graph.edges.length; i++) {
      var edge = g.graph.edges[i];
      
      if (containsObject(edge._outV, vertexMap) && containsObject(edge._inV, vertexMap)) {
        acceptedEdges.push(edge);
      } else {
        rejectedEdges.push(edge);
      }
    }
    callback();
  }, function(err) {
    if (err) return callback(err);
    console.log("Finished reading edges. " + acceptedEdges.length + " edges accepted, " + rejectedEdges.length + " edges rejected.");
    callback(null, true);
  });
};

function writeFiles (callback) {
  var verticesHeader = '{ "graph": { "mode": "NORMAL", "vertices": ',
      edgesHeader = ', "edges": ',
      footer = '} }';
  
  var fileOut = path.join(__dirname, fileNameOut);
  var rejectedOut = path.join(__dirname, rejectedEdgesOut);    
        
  fs.writeFileSync(fileOut, verticesHeader);
  fs.appendFileSync(fileOut, JSON.stringify(vertices, null, 4));
  fs.appendFileSync(fileOut, edgesHeader);
  fs.appendFileSync(fileOut, JSON.stringify(acceptedEdges, null, 4));
  fs.appendFileSync(fileOut, footer);
  
  fs.writeFileSync(rejectedOut, JSON.stringify(rejectedEdges, null, 4));
  console.log("Rejected edges written to " + rejectedEdgesOut + ".");
  
  callback(null, true);
}

var vertices = [];
var vertexMap = [];
var acceptedEdges = [];
var rejectedEdges = [];

async.series([
  validateFiles,
  readVertices,
  readEdges,
  writeFiles
], function(err, results) {
  if (err) {
    console.log("ERROR:" + err);
    return;
  }
  console.log("Done!");
});
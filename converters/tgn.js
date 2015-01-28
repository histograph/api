#!/usr/local/bin/node

// Conversion script for Getty Thesaurus of Geographic Names (TGN) data set
var fileNameOut = 'tgn.graphson.json';
var source = 'tgn';

var grex = require('grex'),
    argv = require('optimist')
      .usage('Transforms TGN data set into GraphSON format.\nUsage: $0')
      .demand('f')
      .alias('f', 'file')
      .describe('f', 'Load a file')
      .argv
    fs = require('fs'),
    async = require('async'),
    parse = require('csv-parse'),
    path = require('path');

// Transforms TGN object types to HG ontology types 
// hg:Place, hg:Polder, hg:Province or hg:Waterway
var objectTypeMap = {
  "inhabited places": "place",
  "national capitals": "place",
  "provincial capitals": "place",
  "cities": "place",
  "island groups": "place",
  "islands (landforms)": "place",
  "villages": "place",
  "towns": "place",
  "regional capitals": "place",
  "capitals (seats of government)": "place",
  
  "polders": "polder",
  
  "canals (waterways)": "waterway",
  "marine channels": "waterway",
  "ponds (water)": "waterway",
  "navigation channels": "waterway",
  "lakes (bodies of water)": "waterway",
  "stream channels": "waterway",
  "inlets": "waterway",
  "rivers": "waterway",
  "tidal watercourses": "waterway",
  "seas": "waterway",
  "sections of watercourses": "waterway",
  "distributaries (streams)": "waterway",
  "bays (bodies of water)": "waterway",
  "channels (bodies of water)": "waterway",
  "channels (water bodies)": "waterway",
  
  "provinces": "province"
};

function containsObject(obj, list) {
  for (var i=0; i<list.length; i++) {
    if (list[i] === obj) return true;
  }
  return false;
}

// TGN object types not used in our ontology. TODO Subject to change.
var notUsed = [
  "parks (recreation areas)",
  "docks",
  "ports (settlements)",
  "locales (settlements)",
  "coves (bodies of water)",
  "nature reserves",
  "heaths (landforms)",
  "estates (agricultural)",
  "castles (fortifications)",
  "railroad stations",
  "marshes",
  "forests (cultural landscapes)",
  "points (landforms)",
  "farms",
  "general regions",
  "streams",
  "ruins",
  "first level subdivisions (political entities)",
  "second level subdivisions (political entities)",
  "area (measurement)",
  "bridges (built works)",
  "reservoirs (water distribution structures)",
  "tunnels",
  "dikes",
  "churches (buildings)",
  "landhouses",
  "dunes",
  "straits",
  "locks (hydraulic structures)",
  "dams (hydraulic structures)",
  "flats (landforms)",
  "shoals (landforms)",
  "hills",
  "archaeological sites",
  "forts",
  "lighthouses",
  "beaches",
  "schools (buildings)",
  "banks (landforms)",
  "breakwaters",
  "capes (landforms)",
  "trade centers",
  "museums (buildings)",
  "textile centers",
  "bars (landforms)",
  "concentration camp sites",
  "royal residences",
  "megalithic sites",
  "uplands",
  "anabranches",
  "national parks",
  "palaces",
  "mountains",
  "episcopal sees",
  "battlefields",
  "resorts",
  "oil fields",
  "estuaries",
  "fortified settlements",
  "seaports",
  "naval bases",
  "parts of inhabited places",
  "suburbs",
  "historic sites"
];

// Hard-coded, taken from source file entries for the provinces
var provinceURIs = { 
  "Noord-Holland": "7006951",
  "Noord-Brabant": "7003624",
  "Utrecht": "7003627",
  "Zeeland": "7003635",
  "Flevoland": "7003615",
  "Groningen": "7003613",
  "Gelderland": "7003619",
  "Friesland": "7003616",
  "Limburg": "7003622",
  "Overijssel": "7003626",
  "Drenthe": "7003614",
  "Zuid-Holland": "7003632"
};

var verticesHeader = '{ "graph": { "mode": "NORMAL", "vertices": ',
    edgesHeader = ', "edges": ',
    footer = '} }';

var usedURIs = [];
var altNameEdges = [];
var fileOut = path.join(path.dirname(path.resolve(argv.file)), fileNameOut);

// VERTICES
function parseVertices(callback) {
  
  fs.writeFileSync(fileOut, verticesHeader);

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ','}, function(err, data) {
  
    console.log("Parsing vertices...");
    
    var vertices = [];
    data.shift(); // Skip CSV header

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var objType = obj[10];
      
      var splitURI = obj[1].split("/");
      var uri = splitURI[splitURI.length - 1];
  
      if (objectTypeMap.hasOwnProperty(objType)) {
        var objType = objectTypeMap[obj[10]];
        
        if (!containsObject(uri, usedURIs)) {
          var vertex = {  
            _id: source + "/" + uri,
            _type: "vertex",
            uri: source + "/" + uri,
            name: obj[2],
            source: source,
            type: "hg:" + objType.charAt(0).toUpperCase() + objType.slice(1),        
            geometry: {"type": "Point", "coordinates": [parseFloat(obj[8]), parseFloat(obj[7])]},
            startDate: "",
            endDate: ""
          };
          vertices.push(vertex);
          usedURIs.push(uri);
        } else if (obj[2] != obj[3]) {
          var altURI = source + "/" + uri + "-" + obj[0];
          var vertex = {
            _id: altURI,
            _type: "vertex",
            uri: altURI,
            name: obj[3],
            source: source,
            type: "hg:" + objType.charAt(0).toUpperCase() + objType.slice(1),
            geometry: {"type": "Point", "coordinates": [parseFloat(obj[8]), parseFloat(obj[7])]},
            startDate: "",
            endDate: ""       
          };
          vertices.push(vertex);
          altNameEdges.push([altURI, source + "/" + uri]);
        }
    
      } else if (!containsObject(obj[10], notUsed)) {
        console.log("Property " + obj[10] + " not part of object types map. Skipping...");
      }
    }
    fs.appendFileSync(fileOut, JSON.stringify(vertices, null, 4));
    callback(null, true);    
    
  });
}

// EDGES
function parseEdges(callback) {
  fs.appendFileSync(fileOut, edgesHeader);

  parse(fs.readFileSync(argv.file, {encoding: 'utf8'}), {delimiter: ','}, function(err, data){
    console.log("Parsing province edges...");
    
    var edges = [];
    var edgeCounter = 0;
    data.shift(); // Skip CSV header

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      
      var splitURI = obj[1].split("/");
      var uri = splitURI[splitURI.length - 1];
  
      if (containsObject(uri, usedURIs)) {
        if (provinceURIs.hasOwnProperty(obj[6])) {
  
          var edge = {
            _id: source + "/e" + ++edgeCounter,
            _type: "edge",
            _outV: source + "/" + uri,
            _inV: source + "/" + provinceURIs[obj[6]],
            source: source,
            _label: "hg:liesIn"
          };
          edges.push(edge);
        }
      }
    }
    
    console.log("Parsing alternative name edges...");
    
    for (var i=0; i<altNameEdges.length; i++) {
      var edge = {
        _id: source + "/e" + ++edgeCounter,
        _type: "edge",
        _outV: altNameEdges[i][0],
        _inV: altNameEdges[i][1],
        source: source,
        _label: "hg:isUsedFor"
      };
      edges.push(edge);
    }
    
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
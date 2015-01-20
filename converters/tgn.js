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
        if (list[i] === obj) {
            return true;
        }
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
  "NH": "7006951",
  "NB": "7003624",
  "Ut": "7003627",
  "Ze": "7003635",
  "Fl": "7003615",
  "Gr": "7003613",
  "Ge": "7003619",
  "Fr": "7003616",
  "Li": "7003622",
  "Ov": "7003626",
  "Dr": "7003614",
  "ZH": "7003632"
};

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
    data.shift(); // Skip CSV header

    for (var i=0; i<data.length; i++) {
      var obj = data[i];
      var objType = obj[7];
      
      var splitURI = obj[1].split("/");
      var uri = splitURI[splitURI.length - 1];
  
      if (objectTypeMap.hasOwnProperty(objType)) {
        if (!containsObject(uri, usedURIs)) {
    
          var objType = objectTypeMap[obj[7]];

          var vertex = {  
            _id: source + "/" + uri,
            _type: "vertex",
            uri: source + "/" + uri,
            name: obj[2],
            source: source,
            type: "hg:" + objType.charAt(0).toUpperCase() + objType.slice(1),        
            geometry: {"type": "Point", "coordinates": [parseFloat(obj[5]), parseFloat(obj[4])]},
            startDate: "",
            endDate: ""
          };
          vertices.push(vertex);
          usedURIs.push(uri);
        }
    
      } else if (!containsObject(obj[7], notUsed)) {
        console.log("Property " + obj[7] + " not part of object types map. Skipping...");
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
        if (provinceURIs.hasOwnProperty(obj[3])) {
  
          var edge = {
            _id: source + "/e" + ++edgeCounter,
            _type: "edge",
            _outV: source + "/" + uri,
            _inV: source + "/" + provinceURIs[obj[3]],
            source: source,
            _label: "hg:liesIn"
          };
          edges.push(edge);
        }
      }
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
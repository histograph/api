var fs = require('fs'),
    config = require('./config.json'),
    neo4j = require('neo4j'),
    graphlib = require("graphlib"),
    db = new neo4j.GraphDatabase('http://' + config.neo4j.host + ':' + config.neo4j.port);

function findById(id, callback) {
  var cypher = "MATCH (a:PIT {hgID: {id}})-[rels:CONCEPTIDENTICAL*]-(b:PIT) "
    + "UNWIND rels AS rel "
    + "RETURN distinct startNode(rel) AS a, type(rel) AS rel, endNode(rel) AS b limit 250"

  execute(cypher, {id: id}, callback);
}

function findByName(name, callback) {
  var cypher = "MATCH (a:PIT {name: {name}})-[rels:CONCEPTIDENTICAL*]-(b:PIT) "
    + "UNWIND rels AS rel "
    + "RETURN distinct startNode(rel) AS a, type(rel) AS rel, endNode(rel) AS b limit 250"

  execute(cypher, {name: name}, callback);
}

function execute(query, params, callback) {
  console.log("Executing Cypher query:");
  console.log("\t" + query);
  db.cypher({
    query: query,
    params: params,
  }, function (err, results) {
    if (err) throw err;

    if (!results) {
      neo4jToGeoJSON([], callback);
    } else {
      neo4jToGeoJSON(results, callback);
    }
  });
}

function neo4jToGeoJSON(results, callback) {
  var nodes = {},
      g = new graphlib.Graph();

  results.forEach(function(triple) {
    if (!nodes[triple.a._id]) {
      nodes[triple.a._id] = triple.a;
      g.setNode(triple.a._id);
    }

    if (!nodes[triple.b._id]) {
      nodes[triple.b._id] = triple.b;
      g.setNode(triple.b._id);
    }

    g.setEdge(triple.a._id, triple.b._id);
  });

  var components = graphlib.alg.components(g);

  var geojson = {
    type: "FeatureCollection",
    features: []
  };

  components.forEach(function(component) {
    var feature = {
        type: "Feature",
        properties: {
          type: "Feature",
          pits: [],
          relations: []
        },
        geometry: {
          type: "GeometryCollection",
          geometries: []
        }
      },
      geometryIndex = 0;

    component.forEach(function(node) {
      var pit = {
        name: nodes[node].properties.name,
        hgID: nodes[node].properties.hgID,
        layer: nodes[node].properties.layer
      };

      feature.properties.type = nodes[node].properties.type;

      if (nodes[node].properties.geometry &&
        nodes[node].properties.geometry !== '{"coordinates":[null,null],"type":"Point"}'

      ) {
        feature.geometry.geometries.push(JSON.parse(nodes[node].properties.geometry));
        pit.geometryIndex = geometryIndex;
        geometryIndex += 1;
      }
        //{ geometry: '{"coordinates":[5.730556,50.8825],"type":"Point"}',
      //console.log(nodes[node]);
      //console.log(g.outEdges(node));

      feature.properties.pits.push(pit);
    })


    geojson.features.push(feature);
  });

  callback(geojson);
  //   if (response.length > 0) {
  //     var geojson = {
  //       type: "FeatureCollection",
  //       features: []
  //     };
  //
  //     response.forEach(function(pathOrVertex) {
  //       var path = [],
  //           feature = {
  //             type: "Feature",
  //             properties: {
  //               type: "",
  //               pits: [],
  //               relations: []
  //             },
  //             geometry: {
  //               type: "GeometryCollection",
  //               geometries: []
  //             }
  //           },
  //           geometryIndex = 0;
  //
  //       if (pathOrVertex.constructor === Array) {
  //         path = pathOrVertex;
  //       } else {
  //         path = [pathOrVertex];
  //       }
  //       path.forEach(function(object) {
  //         feature.properties.type = object.properties.type.value;
  //
  //         if (object.type === "vertex") {
  //           var pit = {
  //             //startDate: object.startDate,
  //             //source: object.source,
  //             name: object.properties.name[0].value,
  //             //endDate: object.endDate,
  //             type: object.properties.type[0].value,
  //             hgid: object.properties.hgid[0].value,
  //             // TODO: matched-query: true/false
  //             matchedQuery: "TODO"
  //           };
  //
  //           if (object.geometry && object.geometry.type) {
  //             pit.geometryIndex = geometryIndex;
  //             feature.geometry.geometries.push(object.geometry);
  //             geometryIndex += 1;
  //           } else {
  //             pit.geometryIndex = -1;
  //           }
  //
  //           feature.properties.pits.push(pit);
  //         } else {
  //           // Found edge!
  //
  //           // Naming convention for edge URIs, example:
  //           // hg:conceptIdentical-inferredAtomicRelationEdge-geonames/2758064-tgn/1047690
  //
  //           var uriElements = object.uri.split("-");
  //           feature.properties.relations.push({
  //             from: uriElements[2],
  //             to: uriElements[3],
  //             source: object.source,
  //             uri: object._label
  //           });
  //         }
  //       });
  //       geojson.features.push(feature);
  //     });
  //
  //     callback(geojson);
  //   } else {
  //     callback({
  //       "message": "Nothing found..."
  //     });
  //   }
  // });
}






module.exports.findByName = findByName;
module.exports.findById = findById;

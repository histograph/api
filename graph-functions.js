var fs = require('fs'),
    options = require('config.json'),
    gremlin = require('gremlin-client');
    //client = gremlin.createClient(options.port, options.host);

function execute(query, callback) {
  client.execute(query, function(err, response) {
    if (response) {
      return callback(response);
    }
    if (err) {
      process.stderr.write("ERROR:");
      process.stderr.write(err);
      callback(null);
    }
  });
}

function gremlinToGeoJSON(query, callback) {
  execute(query, function(response) {
    console.log(JSON.stringify(response, undefined, 2));

    if (response.length > 0) {
      var geojson = {
        type: "FeatureCollection",
        features: []
      };

      response.forEach(function(pathOrVertex) {
        var path = [],
            feature = {
              type: "Feature",
              properties: {
                type: "",
                pits: [],
                relations: []
              },
              geometry: {
                type: "GeometryCollection",
                geometries: []
              }
            },
            geometryIndex = 0;

        if (pathOrVertex.constructor === Array) {
          path = pathOrVertex;
        } else {
          path = [pathOrVertex];
        }
        path.forEach(function(object) {
          feature.properties.type = object.properties.type.value;

          if (object.type === "vertex") {
            var pit = {
              //startDate: object.startDate,
              //source: object.source,
              name: object.properties.name[0].value,
              //endDate: object.endDate,
              type: object.properties.type[0].value,
              hgid: object.properties.hgid[0].value,
              // TODO: matched-query: true/false
              matchedQuery: "TODO"
            };

            if (object.geometry && object.geometry.type) {
              pit.geometryIndex = geometryIndex;
              feature.geometry.geometries.push(object.geometry);
              geometryIndex += 1;
            } else {
              pit.geometryIndex = -1;
            }

            feature.properties.pits.push(pit);
          } else {
            // Found edge!

            // Naming convention for edge URIs, example:
            // hg:conceptIdentical-inferredAtomicRelationEdge-geonames/2758064-tgn/1047690

            var uriElements = object.uri.split("-");
            feature.properties.relations.push({
              from: uriElements[2],
              to: uriElements[3],
              source: object.source,
              uri: object._label
            });
          }
        });
        geojson.features.push(feature);
      });

      callback(geojson);
    } else {
      callback({
        "message": "Nothing found..."
      });
    }
  });
}

module.exports.gremlinToGeoJSON = gremlinToGeoJSON;
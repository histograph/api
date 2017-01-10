var normalizer = require('histograph-uri-normalizer');
var centroid = require('@turf/centroid');

// Expand Histograph URNs
function expandURN(id) {
  try {
    id = normalizer.URNtoURL(id);
  } catch (e) {
    // TODO: use function from uri-normalizer
    id = id.replace('urn:hgid:', '');
  }

  return id;
}

// Given an PIT or a hair, expand ID to URN,
// and only allow either ID or URI
function idOrUri(obj) {
  var id = expandURN(obj.id);

  // check whether obj has an URI field
  // if the expandURNed obj.id equals obj.id itself,
  // obj.id matches uri-normalizer's URI pattern: obj.id is an URI
  if (obj.uri || (id === obj.id)) {
    obj.uri = id;
    delete obj.id;
  } else {
    obj.id = id;
    delete obj.uri;
  }

  return obj;
}

// Turns output from Histograph Neo4j Plugin into GeoJSON!
module.exports = function(json, query) {
  if (json && json.length > 0) {
    var simplifyGeometry = query['simplify-geometry'];

    return {
      type: 'FeatureCollection',
      features: json.map(function(concept) {
        var geometries = [];

        concept.forEach(function(p) {
          if (p.pit.geometry) {
            geometries.push(p.pit.geometry);
          }
        });

        var type;
        var geometryIndex = 0;
        var pits = concept
          .filter(function(p) {
            return p.pit.dataset;
          })
          .map(function(p) {
            var pit = p.pit;
            if (pit.type) {
              type = pit.type;
            }

            if (pit.geometry && query.geometry && !simplifyGeometry) {
              pit.geometryIndex = geometryIndex;
              geometryIndex += 1;
            } else {
              pit.geometryIndex = -1;
            }

            // TODO: properly serialize fuzzy dates arrays

            if (pit.validSinceTimestamp) {
              delete pit.validSinceTimestamp;
            }

            if (pit.validUntilTimestamp) {
              delete pit.validUntilTimestamp;
            }

            delete pit.geometry;

            if (p.hairs && p.hairs.length > 0) {
              pit.hairs = p.hairs.map(idOrUri);
            }

            if (p.relations && p.relations.length > 0) {
              pit.relations = {};
              p.relations.forEach(function(relation) {
                if (!pit.relations[relation.type]) {
                  pit.relations[relation.type] = [];
                }

                pit.relations[relation.type].push({
                  '@id': expandURN(relation.to)
                });
              });
            }

            pit = idOrUri(pit);

            return pit;
          });

        var geometry;
        if (query.geometry) {
          geometry = {
            type: 'GeometryCollection',
            geometries: geometries
          };

          // Use Turf.js to compute centroid
          //   Note: centroid is arithmetic mean of all vertices!
          if (simplifyGeometry) {
            geometry = centroid(geometry).geometry;
          }
        }

        return {
          type: 'Feature',
          properties: {
            type: type,
            pits: pits
          },
          geometry: geometry
        };
      })
    };
  } else {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

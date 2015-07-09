var context = require('../data/jsonld-context.json');

module.exports = function(geojson, query) {
  return {
    '@context': context,
    type: 'FeatureCollection',
    features: geojson.features.map(function(feature) {
      feature.properties.pits = feature.properties.pits.map(function(pit) {
        if (pit.relations) {
          pit.relations['@id'] = pit.uri || pit.id;
        }

        if (pit.hairs) {
          pit.hairs.map(function(hair) {
            hair['@id'] = hair.uri || hair.id;
          });
        }

        // Source is called sourcid in neo4j graph
        // TODO: maybe Core should do renaming in Traversal API...
        pit.source = pit.sourceid;
        delete pit.sourceid;

        pit['@id'] = pit.uri || pit.id;
        return pit;
      });

      if (query.geometry) {
        return {
          type: feature.type,
          properties: feature.properties,
          geometry: feature.geometry
        };
      } else {
        return {
          type: feature.type,
          properties: feature.properties
        };
      }
    })
  };
};

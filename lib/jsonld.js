var util = require('util');
var context = require('../data/jsonldContext.json');

module.exports = function(geojson, query) {
  return {
    '@context': context,
    type: 'FeatureCollection',
    features: geojson.features.map(function(feature) {
      feature.properties.pits = feature.properties.pits.map(function(pit) {
        // if (pit.relations) {
        //   Object.keys(pit.relations).map(function(relation) {
        //     pit.relations[relation] = pit.relations[relation].map(function(hgid) {
        //       return {
        //         '@id': hgid
        //       };
        //     });
        //   });
        //
        //   pit.relations['@id'] = pit.hgid;
        // }

        // Source is called sourcid in neo4j graph
        // TODO: maybe Core should do renaming in Traversal API...
        pit.source = pit.sourceid;
        delete pit.sourceid;

        pit['@id'] = pit.hgid;
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

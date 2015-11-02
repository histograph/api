var config = require('histograph-config');
var context = require('./jsonld-context.json');

context['@base'] = config.schemas.baseUri;
context['@vocab'] = config.schemas.baseUri;

module.exports = function(geojson) {
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

        // D is called sourcid in neo4j graph
        // TODO: maybe Core should do renaming in Traversal API...
        pit.dataset = pit.dataset;
        delete pit.datasetid;

        pit['@id'] = pit.uri || pit.id;
        return pit;
      });

      return {
        type: feature.type,
        properties: feature.properties,
        geometry: feature.geometry
      };
    })
  };
};

var util = require('util');

// Turns output from Histograph Neo4j Plugin into GeoJSON!
module.exports = function(json) {
  return {
    type: 'FeatureCollection',
    features: json.map(function(concept) {
      var geometries = [];

      concept.forEach(function(p) {
        if (p.pit.geometry) {
          geometries.push(p.pit.geometry);
        }
      });

      var pits = concept.map(function(p) {
        var pit = p.pit;
        delete pit.geometry;

        //return pit
        //
        pit.hairs = p.hairs;
        pit.relations = p.relations;
        //
        //
        //
        return pit;
      });

      console.log(pits)

      return {
        type: 'Feature',
        properties: {
          type: 'hg:Coño',
          pits: pits
        },
        geometry: {
          type: 'GeometryCollection',
          geometries: geometries
        }
      }
    })
  };
};

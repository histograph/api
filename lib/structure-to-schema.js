// Creates JSON Schema from Histograph API structure
// http://json-schema.org/

var arrayProperty = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'string'
  },
  uniqueItems: true
};

function addToQuerySchema(schema, structure, prefix) {
  if (prefix) {
    prefix += '.';
  } else {
    prefix = '';
  }

  // Search parameters
  Object.keys(structure.search).forEach(function(param) {
    var property = {
      type: 'string'
    };
    if (structure.search[param].pattern) {
      property.pattern = structure.search[param].pattern;
    }

    schema.properties[prefix + param] = property;
  });

  // Filters
  Object.keys(structure.filters).forEach(function(param) {
    var property;
    var type = structure.filters[param].type;
    if (type === 'enum') {
      property = arrayProperty;
    } else if (type === 'geometry') {
      property = {
        properties: {
          type: {
            type: 'string',
            enum: [
              'Point',
              'LineString',
              'Polygon',
              'Envelope',
              'MultiPoint',
              'MultiLineString',
              'MultiPolygon',
              'GeometryCollection'
            ]
          },
          coordinates: {}
        },
        dependencies: {
          type: [
            'coordinates'
          ],
          coordinates: [
            'type'
          ]
        }
      };
    } else if (type === 'date') {
      property = {
        type: 'string',
        pattern: '^-?\\d{4}-\\d{2}-\\d{2}$'
      };
    } else {
      property = {
        type: 'string'
      };
    }

    schema.properties[prefix + param] = property;
  });

  // Relations
  if (!prefix) {
    schema.properties[structure.relation] = arrayProperty;
    addToQuerySchema(schema, structure, structure.relation);
  }

  // oneOf
  Object.keys(structure.search).forEach(function(param) {
    schema.oneOf[param] = {
      required: [
        param
      ]
    };
  });
}

module.exports = function(structure) {
  var schema = {
    properties: {},
    oneOf: {}
  };

  addToQuerySchema(schema, structure.query);
  var properties = schema.properties;

  // Modifiers
  Object.keys(structure.modifiers).forEach(function(param) {
    properties[param] = {
      type: 'boolean'
    };
  });

  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    properties: properties,
    oneOf: schema.oneOf,
    additionalProperties: false
  };
};

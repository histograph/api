// Creates JSON Schema from Histograph API structure
// http://json-schema.org/

function arrayProperty(item) {
  var property = {
    type: 'array',
    minItems: 1,
    items: {
      type: 'string'
    },
    uniqueItems: true
  };

  if (item.enum) {
    property.items.enum = item.enum;
  }

  return property;
}

var related = 'related';

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
      property = arrayProperty(structure.filters[param]);
    } else if (type === 'geometry') {
      property = {
        type: 'object',
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
        required: [
          'coordinates',
          'type'
        ],
        additionalProperties: false,
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

        // TODO: year (string, number), ISO8601!!!
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
    schema.properties[related] = arrayProperty(structure.related);
    addToQuerySchema(schema, structure, related);
  }
}

module.exports = function(structure) {
  var schema = {
    properties: {},
    oneOf: []
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

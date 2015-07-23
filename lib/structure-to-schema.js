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
    // TODO: support other filter types when necessary
    if (structure.filters[param].type === 'enum') {
      schema.properties[prefix + param] = arrayProperty;
    } else {
      // TODO: create schema for dates and geometries
      schema.properties[prefix + param] = {
        type: 'string'
      };
    }
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

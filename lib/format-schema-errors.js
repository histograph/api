var util = require('util');

module.exports = function(errors) {
  return errors.map(formatSchemaError);
};

function formatSchemaError(error) {
  // Lelijk but nou en!
  var field = error.field.replace('data.', '').replace('data["', '').replace('"]', '');
  return util.format('`%s` %s', field, error.message);
}

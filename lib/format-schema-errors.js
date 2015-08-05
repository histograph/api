var util = require('util');

module.exports = function(errors) {
  return errors.map(formatSchemaError);
};

function formatSchemaError(error) {
  if (error.message === 'no (or more than one) schemas match') {
    return 'Please supply exactly one search parameter: `q`, `uri`, `name` or `id`';
  } else {
    // Lelijk but nou en!
    var field = error.field.replace('data.', '').replace('data["', '').replace('"]', '');
    return util.format('`%s` %s', field, error.message);
  }
}

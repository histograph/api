var normalizer = require('histograph-uri-normalizer');

module.exports = function(value) {
  var normalized = normalizer.normalize(value);
  if (normalized === undefined) {
    return {
      type: 'name',
      normalized: value
    };
  } else if (normalized.indexOf('urn:hgid:') === 0) {
    return {
      type: 'id',
      normalized: normalized
    };
  } else {
    // `urn:hg` type URN (URI normalizer knows namespace), or full URI
    return {
      type: 'uri',
      normalized: normalized
    };
  }
};

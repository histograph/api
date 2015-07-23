var wellknown = require('wellknown');
var getSearchParamType = require('./search-param-type');

module.exports = function(value, type) {
  if (type === 'date') {
    return processDate(value);
  } else if (type === 'geometry') {
    return processGeometry(value);
  } else {
    return null;
  }
}

function processDate(value) {
  // TODO
  return {
    type: 'query',
    value: value
  };
}

function processGeometry(value) {
  var geojson
  try {
    geojson = JSON.parse(value);
  } catch(e) {
    geojson = wellknown(value);
  }

  if (geojson) {
    // TODO: check GeoJSON! (But allow type:envelope)
    return {
      type: 'value',
      value: geojson
    };
  } else {
    var type = getSearchParamType(value);

    return {
      type: type,
      value: value
    };
  }
}


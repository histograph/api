var wellknown = require('wellknown');

module.exports = function(param, type, value) {
  if (type === 'enum') {
    return toArray(value);
  } else if (type === 'boolean') {
    return toBool(value);
  } else if (type === 'date') {
    return toDate(param, value);
  } else if (type === 'geometry') {
    return toGeometry(value);
  } else {
    return value;
  }
};

function toBool(str) {
  if (str.toLowerCase() === 'true') {
    return true;
  } else if (str.toLowerCase() === 'false') {
    return false;
  } else {
    return str;
  }
}

function toArray(str) {
  return str.split(',');
}

function toDate(param, str) {
  // See if str contains just year
  if (/^\d{4}$/.test(str)) {
    if (param === 'before') {
      return str + '-01-01';
    } else if (param === 'after') {
      return str + '-12-31';
    }
  }

  return str;
}

function toGeometry(str) {
  var geojson;
  try {
    geojson = JSON.parse(str);
  } catch (e) {
    geojson = wellknown(str);
  }

  if (geojson) {
    return geojson;
  } else {
    // Check str is of type lon1,lat1,lon2,lat2
    var parts = str
      .split(',')
      .map(function(part) {
        return parseFloat(part);
      })
      .filter(function(part) {
        return !isNaN(part);
      });

    if (parts.length === 4) {
      return {
        type: 'Envelope',
        coordinates: [
          [
            parts[0], parts[1]
          ],
          [
            parts[2], parts[3]
          ]
        ]
      };
    } else {
      return str;
    }
  }
}

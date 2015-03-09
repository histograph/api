var fs = require('fs'),
    config = require(process.env.HISTOGRAPH_CONFIG),
    neo4j = require('neo4j'),
    graphlib = require("graphlib"),
    db = new neo4j.GraphDatabase('http://' + config.neo4j.host + ':' + config.neo4j.port);

function findById(id, callback) {
  var cypher = "MATCH (a:PIT {hgID: {id}})-[rels:CONCEPTIDENTICAL*]-(b:PIT) "
    + "UNWIND rels AS rel "
    + "RETURN distinct startNode(rel) AS a, type(rel) AS rel, endNode(rel) AS b limit 50";

  execute(cypher, {id: id}, callback);
}

function findByIds(ids, callback) {
  var cypher = "MATCH (a:PIT)-[rels:CONCEPTIDENTICAL*]-(b:PIT) "
    + "WHERE a.hgid IN {ids} "
    + "UNWIND rels AS rel "
    + "RETURN distinct startNode(rel) AS a, type(rel) AS rel, endNode(rel) AS b limit 50";

  execute(cypher, {ids: ids}, callback);
}


function findByName(name, callback) {
  var cypher = "MATCH (a:PIT {name: {name}})-[rels:CONCEPTIDENTICAL*]-(b:PIT) "
    + "UNWIND rels AS rel "
    + "RETURN distinct startNode(rel) AS a, type(rel) AS rel, endNode(rel) AS b limit 50";

  execute(cypher, {name: name}, callback);
}

function execute(query, params, callback) {
  console.log("Executing Cypher query:");
  console.log("\t" + query);
  db.cypher({
    query: query,
    params: params,
  }, function (err, results) {
    if (err) throw err;

    if (!results) {
      neo4jToGeoJSON([], callback);
    } else {
      neo4jToGeoJSON(results, callback);
    }
  });
}

function neo4jToGeoJSON(results, callback) {
  var nodes = {},
      g = new graphlib.Graph();

  results.forEach(function(triple) {
    if (!nodes[triple.a._id]) {
      nodes[triple.a._id] = triple.a;
      g.setNode(triple.a._id);
    }

    if (!nodes[triple.b._id]) {
      nodes[triple.b._id] = triple.b;
      g.setNode(triple.b._id);
    }

    g.setEdge(triple.a._id, triple.b._id);
  });

  var components = graphlib.alg.components(g);

  var geojson = {
    type: "FeatureCollection",
    features: []
  };

  components.forEach(function(component) {
    var feature = {
        type: "Feature",
        properties: {
          type: "Feature",
          pits: [],
          relations: []
        },
        geometry: {
          type: "GeometryCollection",
          geometries: []
        }
      },
      geometryIndex = 0;

    component.forEach(function(node) {
      var pit = {
        name: nodes[node].properties.name,
        hgid: nodes[node].properties.hgid,
        source: nodes[node].properties.layer,
        uri: nodes[node].properties.uri,
        startDate: nodes[node].properties.startDate,
        endDate: nodes[node].properties.endDate
      };

      feature.properties.type = nodes[node].properties.type;

      if (nodes[node].properties.geometry) {
        feature.geometry.geometries.push(JSON.parse(nodes[node].properties.geometry));
        pit.geometryIndex = geometryIndex;
        geometryIndex += 1;
      } else {
        pit.geometryIndex = -1;
      }

      g.outEdges(node).forEach(function(edge) {
        var relation = {
          from: nodes[edge.v].properties.hgid,
          to: nodes[edge.w].properties.hgid
          // TODO: label
        }

        feature.properties.relations.push(relation);
      });

      feature.properties.pits.push(pit);
    })

    if (geojson.features.length > 0 &&
        feature.properties.pits.length > geojson.features[0].properties.pits.length) {
      geojson.features.unshift(feature);
    } else {
      geojson.features.push(feature);
    }
  });

  callback(geojson);
}

module.exports.findByName = findByName;
module.exports.findById = findById;
module.exports.findByIds = findByIds;

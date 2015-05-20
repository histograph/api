var util = require('util');
var _ = require('lodash');
var pp = require('prettyjson');

var config = require(process.env.HISTOGRAPH_CONFIG);
var neo4j = require('neo4j');
var url = 'http://' + config.core.neo4j.host + ':' + config.core.neo4j.port;
var graphDb = new neo4j.GraphDatabase(url);

function matchExpr(varname, props){
	return _(props)
		.map(function(val, key){
			return util.format('%s.%s IN %s', varname, key, JSON.stringify(val));
		})
		.join(' AND ');
}

function cypherLiesIn(from_props, to_props, extra) {
  return util.format(
"MATCH from = (p:PIT)-[:SAMEHGCONCEPT*0..5]->(x:PIT), \
      to = (q:PIT)-[:SAMEHGCONCEPT*0..5]->(y:PIT),   \
      path = shortestPath( (x)-[:LIESIN*1..6]->(y) ) \
WHERE %s AND %s \
RETURN DISTINCT p" + (extra ? ', from, to, path' : ''),
	  matchExpr('p', from_props), matchExpr('q', to_props))
	.replace(/\ +/g,' ').trim();
}

// for example
// cypherLiesIn({name: ['Oord']}, {hgid: ['geonames/2750405']});


function cleanup(results){
	return results.map(function(row){
		return (row.p && row.p.properties.hgid) || 'x';
	});
} 

// return all nodes matching `smallSpec` that lie in nodes matching `bigSpec`.
exports.liesIn = function(smallSpec, bigSpec, includeRawResults, callback) {
	var q = cypherLiesIn(smallSpec, bigSpec, includeRawResults);
	graphDb.cypher({
		query: q
	}, function(err, results) {
		callback(err, {
			cypherQuery: (includeRawResults ? q : undefined), 
			error: err,
			rawResult: (includeRawResults ? results : undefined),
			results: cleanup(results)
		});
	});
	
}

function toSpec(s)
{
	// split on semicolon
	var entries = s.split(/\s*;\s*/);
	
	// contains a slash? then we assume it's a hgid
	if (/\//.test(s))
		return {hgid: entries}

	return {name: entries}
}

exports.liesInResource = function(req, res){
	if ((!req.query) || (!req.query.small) || (!req.query.big))
		return res.status(400).send({error:'Must specify small, big query params'});

	// find (x IN y)
	var small = toSpec(req.query.small);
	var big = toSpec(req.query.big);

	exports.liesIn(small, big, (req.query.verbose || false), function(err, result){
		if(err)
			return res.status(400).send({error: err});
	
		res.status(200).send(result);
	});
}
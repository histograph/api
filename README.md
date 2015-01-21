# Histograph

Graph database API for [historical geocoder](https://github.com/erfgoed-en-locatie/historische-geocoder/).

We'll use:

1. [Titan](http://thinkaurelius.github.io/titan/)!
2. [Rexster](https://github.com/thinkaurelius/titan/wiki/Rexster-Graph-Server)!
3. Node.js + [Grex](https://github.com/jbmusso/grex)

Do this:

- [Download Titan](https://github.com/thinkaurelius/titan/wiki/Downloads) in directory `titan`

Then:

    npm install grex
    titan/bin/titan.sh start

## Test data

Titan is now running! Let's import some test data:

    ./import.js -f example/molenstraat.json

You can use [`histograph-viewer`](https://github.com/erfgoed-en-locatie/histograph-viewer/) to view the test graph:

    ./read.js > ../histograph-viewer/molenstraat.json

## Import datasets

    converters/tgn.js -f ../historische-geocoder/data/tgn/tgn_nl.csv
    converters/geonames.js -f ../historische-geocoder/data/geonames/geonames_nl_places.csv
    converters/bag.js -f ../historische-geocoder/data/bag/bag_nl_woonplaatsen_with_gn_tgn.csv
    converters/militieregisters.js -f ../historische-geocoder/data/militieregisters/militieregisters.csv
    converters/verdwenen-dorpen.js -f ../historische-geocoder/data/verdwenen-dorpen/verdwenen-dorpen.csv
    converters/aggregateGraphSON.js ../historische-geocoder/data tgn geonames bag militieregisters verdwenen-dorpen

You can view imported data using the [Dog House](http://localhost:8182/doghouse/main/graph/graph)!

## Indices

From [Chapter 8. Indexing for better Performance](http://s3.thinkaurelius.com/docs/titan/current/indexes.html) in Titan docs:

### `uri`

    g = rexster.getGraph("graph")
    mgmt = g.getManagementSystem()
    uri = mgmt.makePropertyKey('uri').dataType(String.class).make()
    mgmt.buildIndex('byUri', Vertex.class).addKey(uri).unique().buildCompositeIndex()
    mgmt.commit()
    // See if index is created correctly:
    g.getIndexedKeys(Vertex.class)

### `name`

See [Chapter 20. Index Parameters and Full-Text Search](http://s3.thinkaurelius.com/docs/titan/current/index-parameters.html#_string_search):

    g = rexster.getGraph("graph")
    mgmt = g.getManagementSystem()
    name = mgmt.makePropertyKey('name').dataType(String.class).make()
    mgmt.buildIndex('byName', Vertex.class).addKey(name, Mapping.TEXT.getParameter()).buildMixedIndex("search")
    mgmt.commit()
    // See if index is created correctly:
    g.getIndexedKeys(Vertex.class)

### TODO:

Make indices on the following fields, and use a _range index_ for `startDate`/`endDate`:

- `source`
- `type`
- `startDate`
- `endDate`

### Test indices:

    g = rexster.getGraph("graph")
    g.V.has('uri', 'tgn/7261167')
    g.V.has('uri', 'tgn/7271334')
    g.V.has('name', Text.CONTAINS, 'Amsterdam')
    g.V.has('name', Text.CONTAINS_REGEX, '.*dam.*').map
    g.V.has('name', Text.CONTAINS_REGEX, '.*bert.*').name

Clean database and indices:

    titan/bin/titan.sh clean

## Gremlin

For some examples on how to enter data into Titan graph with Gremlin, see https://github.com/zcox/rexster-titan-scala#rexster-console. Start the console with:

    titan/bin/rexster-console.sh

To delete all vertices and edges, exectute the following Gremlin script:

    g = rexster.getGraph("graph")
    g.V.each{g.removeVertex(it)}
    g.stopTransaction(SUCCESS)

### Example queries

List of all edge labels, deduplicated:

  g.E.label.dedup()

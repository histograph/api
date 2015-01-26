# Histograph

Graph database API for [historical geocoder](https://github.com/erfgoed-en-locatie/historische-geocoder/).

We'll use:

1. [Titan](http://thinkaurelius.github.io/titan/), (requires [java 7](http://openjdk.java.net/install/))!
2. [Rexster](https://github.com/thinkaurelius/titan/wiki/Rexster-Graph-Server)!
3. [Node.js](http://nodejs.org/download/) + [Grex](https://github.com/jbmusso/grex)

Do this:

- [Download Titan](https://github.com/thinkaurelius/titan/wiki/Downloads) in directory `titan`

Then, to start Titan, run

    titan/bin/titan.sh start

To start Histograph, run

    npm install
    npm run start

Some example URLs (don't forget to import data, first):

- http://localhost:3000/militieregisters/747
- http://localhost:3000/q?name=appel.*

## Test data

Titan is now running! Let's import some test data:

    node import.js -f example/molenstraat.json

You can use [`histograph-viewer`](https://github.com/erfgoed-en-locatie/histograph-viewer/) to view the test graph:

    node read.js > ../histograph-viewer/js/molenstraat.json

## Import datasets

    node converters/tgn.js -f ../historische-geocoder/data/tgn/tgn_nl.csv
    node converters/geonames.js -f ../historische-geocoder/data/geonames/geonames_nl_places.csv
    node converters/bag.js -f ../historische-geocoder/data/bag/bag_nl_woonplaatsen_with_gn_tgn.csv
    node converters/militieregisters.js -f ../historische-geocoder/data/militieregisters/militieregisters.csv
    node converters/verdwenen-dorpen.js -f ../historische-geocoder/data/verdwenen-dorpen/verdwenen-dorpen.csv
    node converters/gemeentegeschiedenis.js -f ../historische-geocoder/data/gemeentegeschiedenis/gg_geometries.csv
    node converters/simon-hart.js -f ../historische-geocoder/data/simon-hart/simon-hart.csv
    node converters/ilvb.js -f ../historische-geocoder/data/ilvb/ilvb.csv
    node converters/pleiades.js -f ../historische-geocoder/data/pleiades/pleiades.csv
    node converters/poorterboeken.js -f ../historische-geocoder/data/poorterboeken/poorterboeken_places.csv
    node converters/voc-opvarenden.js -f ../historische-geocoder/data/voc-opvarenden/voc_opvarenden_v1.csv
    
    node converters/aggregateGraphSON.js ../historische-geocoder/data tgn geonames bag militieregisters verdwenen-dorpen gemeentegeschiedenis simon-hart ilvb pleiades poorterboeken voc-opvarenden

    node import.js -f converters/completeGraph.graphson.json

You can view imported data using the [Dog House](http://localhost:8182/doghouse/main/graph/graph)!

## Indices

From [Chapter 8. Indexing for better Performance](http://s3.thinkaurelius.com/docs/titan/current/indexes.html) and [Chapter 20. Index Parameters and Full-Text Search](http://s3.thinkaurelius.com/docs/titan/current/index-parameters.html#_string_search) in Titan docs:

    g = rexster.getGraph("graph")
    mgmt = g.getManagementSystem()
    uri = mgmt.makePropertyKey('uri').dataType(String.class).make()
    mgmt.buildIndex('byUri', Vertex.class).addKey(uri).unique().buildCompositeIndex()
    name = mgmt.makePropertyKey('name').dataType(String.class).make()
    mgmt.buildIndex('byName', Vertex.class).addKey(name, Mapping.TEXT.getParameter()).buildMixedIndex("search")
    mgmt.commit()
    // To check whether the indices are created correctly, run
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

    g.V('uri', 'verdwenen-dorpen/82').copySplit(_(), _().outE.inV.loop('x'){it.loops < 100}{true}.path)

    g.V('uri', 'geonames/2753805').as('x').outE.inV.loop('x'){it.loops < 100}{true}.path
    g.V('uri', 'geonames/2753805').copySplit(_(), _().as('x').outE.inV.loop('x'){it.loops < 100}{true}.path).exhaustMerge()

    g.V('uri', 'verdwenen-dorpen/82').as('x').outE.inV.loop('x'){it.loops < 100}{true}.path
    g.V('uri', 'verdwenen-dorpen/82').copySplit(_(), _().as('x').outE.inV.loop('x'){it.loops < 100}{true}.path).exhaustMerge()


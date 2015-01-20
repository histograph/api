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

    ./import.js -f examples/molenstraat.json

You can use [`histograph-viewer`](https://github.com/erfgoed-en-locatie/histograph-viewer/) to view the test graph:

    ./read.js > ../histograph-viewer/molenstraat.json

## Import datasets

    converters/tgn.js -f ../historische-geocoder/data/tgn/tgn_nl.csv
    ./import.js -f ../historische-geocoder/data/tgn/tgn.graphson.json

You can view imported data using the [Dog House](http://localhost:8182/doghouse/main/graph/graph)!

## Indices

From [Chapter 8. Indexing for better Performance](http://s3.thinkaurelius.com/docs/titan/current/indexes.html) in Titan docs:

    g = rexster.getGraph("graph")
    mgmt = g.getManagementSystem()
    hgUri = mgmt.makePropertyKey('hgUri').dataType(String.class).make()
    mgmt.buildIndex('byUri', Vertex.class).addKey(hgUri).buildCompositeIndex()
    mgmt.commit()
    // See if index is created correctly:
    g.getIndexedKeys(Vertex.class)

TODO: property `uri` already exists, therefore we'll use `hgUri`. See if we can change this default behaviour.

Test indices:

    g = rexster.getGraph("graph")
    g.V.has('hgUri','tgn/7261167')
    g.V.has('hgUri','tgn/7271334')

## Gremlin

For some examples on how to enter data into Titan graph with Gremlin, see https://github.com/zcox/rexster-titan-scala#rexster-console. Start the console with:

    titan/bin/rexster-console.sh

To delete all vertices and edges, exectute the following Gremlin script:

    g = rexster.getGraph("graph")
    g.V.each{g.removeVertex(it)}
    g.stopTransaction(SUCCESS)


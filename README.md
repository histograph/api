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

## Gremlin

For some examples on how to enter data into Titan graph with Gremlin, see https://github.com/zcox/rexster-titan-scala#rexster-console.

To delete all vertices and edges, exectute the following Gremlin script:

    g = rexster.getGraph("graph")
    g.V.each{g.removeVertex(it)}
    g.stopTransaction(SUCCESS)


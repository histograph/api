# Histograph

Graph database API for [historical geocoder](https://github.com/erfgoed-en-locatie/historische-geocoder/).

We'll use:

1. Titan!
2. [Rexster](https://github.com/thinkaurelius/titan/wiki/Rexster-Graph-Server)!
3. Node.js + [Grex](https://github.com/jbmusso/grex)

Like this:

- Download Titan in directory `titan`
- Run `npm install grex`
- Run `titan/bin/titan.sh start`
- Run `./import.js`
- Run `read.js`

For some examples on how to enter data into Titan graph with Gremlin, see https://github.com/zcox/rexster-titan-scala#rexster-console.

To delete all vertices and edges, exectute the following Gremlin script:

    g = rexster.getGraph("graph")
    g.V.each{g.removeVertex(it)}
    g.stopTransaction(SUCCESS)

# Histograph API

Histograph JSON API. To start Histograph API, run

    npm install
    node index.js

Running in "production", using `forever`

    forever start -a --uid "api" index.js --prod --config ~/my-config.yml

## Installation

See [histograph.io/installation](http://histograph.io/installation).

## Examples

- https://api.histograph.io/search?name=utrecht
- https://api.histograph.io/search?uri=http://vocab.getty.edu/tgn/7271174
- https://api.histograph.io/search?name=amsterdam&type=hg:Municipality

## API specification

Histograph API has two endpoints:

- [`/search`](#search-api): geocoding, searching place names
- [`/datasets`](#datsets-api): dataset metadata
- [`/ontology`](#ontology-api): Histograph ontology
- [`/schemas`](#json-schemas-api): JSON schemas

### Search API

| Endpoint      | Description
|---------------|-----------------
| `GET /search` | Search for place names

#### Results

Results from the search API are [GeoJSON](http://geojson.org/) documents (with a [JSON-LD context](http://json-ld.org/)). This means you can easily view the data on a map (with [Leaflet](http://leafletjs.com/examples/geojson.html), for example). Or just copy and paste API output into [geojson.io](http://geojson.io/).

Each Feature represents a [Histograph Concept](http://histograph.io/concepts#concepts). A Histograph Concept represents a single geospatial concept (i.e. a populated place, a country, a street, etc.), and consists of a set of [place-in-time objects (PITs)](http://histograph.io/concepts#place-in-time), connected by [`hg:sameHgConcept` relations](http://histograph.io/concepts#relations). For more information about Concepts, PITs and relations, see [histograph.io](http://histograph.io/concepts).

Each PIT can have its own name and geometry - you can find a PIT's geometry inside its containing Concept's [GeometryCollection](http://geojson.org/geojson-spec.html#geometrycollection), where a PIT's `geometryIndex` property denoted the index of its geometry in the `geometries` array. __TL;DR__:

```js
geojson.features.forEach(function(feature) {

  // Each feature is a Histograph Concept, and consists of a set of PITs
  feature.properties.pits.forEach(function(pit) {

    // A PIT has each own name, dataset and URI or ID.
    // And it's own geometry, too!
    if (pit.geometryIndex > -1) {
      var pitGeometry = feature.geometry.geometries[pit.geometryIndex];
    }
  });
});
```

Example search API GeoJSON output:

```json
{
  "@context": {
    "…"
  },
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "type": "hg:Street",
        "pits": [
          {
            "@id": "dataset1/12345",
            "hgid": "dataset1/12345",
            "name": "Place",
            "type": "hg:Place",
            "dataset": "dataset1",
            "geometryIndex": 0,
            "data": {
              "…"
            },
            "relations": {
              "hg:sameHgConcept": [
                {
                  "@id": "dataset2/54321"
                }
              ],
              "@id": "dataset1/12345"
            }
          }
        ]
      },
      "geometry": {
        "type": "GeometryCollection",
        "geometries": [
          {
            "type": "Point",
            "coordinates": [
              4.48741,
              52.15581
            ]
          }
        ]
      }
    }
  ]
}
```

| Field           | Description
|-----------------|------------------------------------------
| `@context`      | [JSON-LD context](http://json-ld.org/)
| `pits`          | Array of PITs in [Histograph Concept](http://histograph.io/concepts#concepts)
| `uri`           | (External) URI - unique PIT identifier
| `id`            | Dataset-internal identifier - unique PIT identifier
| `@id`           | Same as either `uri` or `id`, used for JSON-LD serialization
| `name`          | PIT name
| `type`          | PIT type, see the [Histograph ontology](https://api.histograph.io/ontology) for a list of accepted types
| `dataset`       | Dataset identifier
| `geometryIndex` | Index of PIT's geometry in GeometryCollection's `geometries` array; `-1` if PIT does not have a geometry
| `data`          | JSON object containing extra PIT data
| `relations`     | Outgoing relations of PIT
| `hairs`         | URI and name of each outgoing relation's target PIT
| `geometry`      | GeoJSON [GeometryCollection](http://geojson.org/geojson-spec.html#geometrycollection) containing `geometries` array with all PIT geometries

#### Parameters

All Histograph API search calls expect at least one of the following parameters:

| Parameter    | Example                                    | Description
|--------------|--------------------------------------------|-----------------
| `name`       | `name=Bussum`                              | Elasticsearch [query string](https://www.elastic.co/guide/en/elasticsearch/reference/1.6/query-dsl-query-string-query.html) on PIT names
| `uri`        | `uri=http://vocab.getty.edu/tgn/7268026`   | Exact match on `uri`
| `id`         | `id=dataset1/123`                          | Exact match on `id` (dataset internal)
| `q`          | `q=boskoop`                                | `uri` query if `q`'s value starts with `http`, `id` query if value contains `/`, `name` query otherwise
| `type`       | `type=hg:Place`                            | Filter on PIT type (or comma-separated list of types). See the [Histograph ontology](https://github.com/histograph/schemas/blob/master/ontology/histograph.ttl) for a list of valid types
| `dataset`    | `datset=tgn,geonames`                      | Filter on dataset ID (or comma-separated list of IDs)
| `intersects` | `intersects=4.9308,52.7126,5.1601,52.5751` | Four-coordinate bounding box, GeoJSON string or WKT string specifying the bounding box or polygon PITs have to intersect
| `before`     | `before=1950`                              |
| `after`      | `after=1910-10-12`                         |

#### Related PITs

Histograph can also search for PITs which have a certain relation (or path or relations) to other PITs. By specifying this relation with the `related` parameter, one can search for PITs with a `hg:liesIn` or `hg:originatedFrom` relation, for example.

| Parameter            | Example               | Description
|----------------------|-----------------------|---------------------
| `related`            | `related=hg:liesIn`   | `related` must be one (or more, comma-separated) of the relations specified in the [Histograph ontology](https://github.com/histograph/schemas/blob/master/ontology/histograph.ttl) or [`JSON schema`](https://github.com/histograph/schemas/tree/master/json/relations.schema.json)
| `related.:parameter` | `related.name=arnhem` | Any of the parameters above can be used to filter related PITs

#### Flags

| Parameter           | Example                  | Description
|---------------------|--------------------------|---------------------
| `geometry`          | `geometry=false`         | When set to `false`, the API will not return GeoJSON geometries. Default is `true`.
| `simplify-geometry` | `simplify-geometry=true` | When `true`, all geometries only the [centroid geometries](https://github.com/Turfjs/turf-centroid) of each concept will be returned. Default is `false`.

#### Exact name search

An extra boolean parameter `exact` is allowed when searching with parameter `name`, to
specify whether to search for exact match (case insensitive) or not. The default
value is `false`.

| Example                      | Description
|------------------------------|------------------------------------------------------------------------------
| `name=Gorinchem`             | Search for PIT name, includes results such as _Sleeswijk bij Gorinchem_
| `name=Gorinchem&exact=false` | Same as above
| `name=Gorinchem&exact=true`  | Search for exact PIT names, searches only for PITs exactly named _Gorinchem_
| `name=gOrINchEm&exact=true`  | Same as the previous, as this search is case-insensitive

### Datasets API

| Endpoint                                  | Data      | Description
|-------------------------------------------|-----------|-------------------------------
| `GET /datasets`                           |           | All dataset available via Histograph
| `GET /datasets/:dataset`                  |           | Metadata of single dataset
| `GET /datasets/:dataset/pits`             |           | All PITs of single dataset
| `GET /datasets/:dataset/relations`        |           | All relations of single dataset
| `POST /datasets`                          | Dataset   | Create new, empty dataset
| `PATCH /datasets/:dataset`                | Dataset   | Update existing dataset
| `PUT /datasets/:dataset/pits`             | PITs      | Update all pits of single dataset
| `PUT /datasets/:dataset/relations`        | Relations | Update all relations of single dataset
| `DELETE /datasets/:dataset`               |           | Delete a dataset completely

#### Data

| Type      | Format                       | MIME type              | JSON schema
|-----------|------------------------------|------------------------|------------
| Dataset   | JSON                         | `application/json`     | [`dataset.schema.json`](https://github.com/histograph/schemas/tree/master/json/dataset.schema.json)
| PITs      | [NDJSON](http://ndjson.org/) | `application/x-ndjson` | [`pits.schema.json`](https://github.com/histograph/schemas/tree/master/json/pits.schema.json)
| Relations | [NDJSON](http://ndjson.org/) | `application/x-ndjson` | [`relations.schema.json`](https://github.com/histograph/schemas/tree/master/json/relations.schema.json)

You can send NDJSON data in your PUT request's body when you are uploading a small data set (i.e. less than 5MB). For bigger NDJSON files, you can use `multipart/form-data` file upload.

#### Authentication

All `POST`, `PATCH`, `PUT` and `DELETE` requests require [basic authentication](http://en.wikipedia.org/wiki/Basic_access_authentication) via HTTPS.

### Ontology API

| Endpoint        | Data                   | Description
|-----------------|------------------------|-------------------------------
| `GET /ontology` | Turtle/N3 RDF ontology | Histograph ontology, all types and relations

### JSON schemas API

| Endpoint                 | Data                                   | Description
|--------------------------|----------------------------------------|-------------------------------
| `GET /schemas/pits`      | [JSON schema](http://json-schema.org/) | JSON schema for PITs
| `GET /schemas/relations` | JSON schema                            | JSON schema for relations

## The MIT License (MIT)

Copyright (C) 2015 [Waag Society](http://waag.org).

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

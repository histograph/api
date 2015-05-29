# Histograph API

Histograph JSON API. To start Histograph API, run

    npm install
    forever index.js

Prerequisites:

- Running version of [Histograph Core](https://github.com/histograph/core),
- Running version of Elasticsearch, with Histograph indexes created by Histograph Core
- `HISTOGRAPH_CONFIG` environment variable pointing to [Histograph configuration file](https://github.com/histograph/config)
- Directory containing [Histograph IO](https://github.com/histograph/io)
- [Redis](http://redis.io/)

Some example URLs:

- https://api.histograph.io/search?name=utrecht
- https://api.histograph.io/search?hgid=geonames/2758064
- https://api.histograph.io/search?uri=http://vocab.getty.edu/tgn/7271174
- https://api.histograph.io/search?name=amsterdam&type=hg:Municipality

## API specification

Histograph API currently has two endpoints:

- [`/search`](#search-api): geocoding, searching place names
- [`/sources`](#sources-api): source metadata, rejected edges

### Search API

| Endpoint      | Description
|---------------|-----------------
| `GET /search` | Search for place names

#### Parameters

All Histograph API search calls expect one (_and one only_) of the following search parameters:

| Parameter  | Example                                  | Description
|------------|------------------------------------------|-----------------
| `name`     | `name=Bussum`                            | Elasticsearch [query string](http://www.elastic.co/guide/en/elasticsearch/reference/1.x/query-dsl-query-string-query.html#query-string-syntax) on PIT names
| `hgid`     | `hgid=tgn/7268026`                       | Exact match on `hgid`
| `uri`      | `uri=http://vocab.getty.edu/tgn/7268026` | Exact match on `uri`
| `q`        | `q=boskoop`                              | `uri` query if `q`'s value starts with `http`, `hgid` query if value contains `/`, `name` query otherwise

#### Filters

| Parameter | Example         | Description
|-----------|-----------------|---------------------
| `type`    | `type=hg:Place` | Filter on PIT type

See the [Histograph ontology](https://github.com/histograph/schemas/blob/master/ontology/histograph.ttl) for a list of valid types.

#### Flags

| Parameter | Example          | Description
|-----------|------------------|---------------------
| `geometry`| `geometry=false` | When set to `false`, the API will not return GeoJSON geometries. Default is `true`.

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

### Sources API

| Endpoint                                  | Data      | Description
|-------------------------------------------|-----------|-------------------------------
| `GET /sources`                            |           | All sources available via Histograph
| `GET /sources/:source`                    |           | Metadata of single source
| `GET /sources/:source/pits`               |           | All PITs of single source
| `GET /sources/:source/relations`          |           | All relations of single source
| `GET /sources/:source/rejected_relations` |           | Rejected relations of a single source
| `POST /sources`                           | Source    | Create new source
| `PATCH /sources/:source`                  | Source    | Update existing source
| `PUT /sources/:source/pits`               | PITs      | Update all pits of single source
| `PUT /sources/:source/relations`          | Relations | Update all relations of single source
| `DELETE /sources/:source`                 |           | Delete a source completely

#### Data

| Type      | Format                       | MIME type              | JSON schema
|-----------|------------------------------|------------------------|------------
| Source    | JSON                         | `application/json`     | [`source.schema.json`](https://github.com/histograph/schemas/tree/master/json/source.schema.json)
| PITs      | [NDJSON](http://ndjson.org/) | `application/x-ndjson` | [`pits.schema.json`](https://github.com/histograph/schemas/tree/master/json/pits.schema.json)
| Relations | [NDJSON](http://ndjson.org/) | `application/x-ndjson` | [`relations.schema.json`](https://github.com/histograph/schemas/tree/master/json/relations.schema.json)

You can send NDJSON data in your PUT request's body when you are uploading a small data set (i.e. less than 5MB). For bigger NDJSON files, you can use `multipart/form-data` file upload.

#### Authentication

All `POST`, `PATCH`, `PUT` and `DELETE` requests require [basic authentication](http://en.wikipedia.org/wiki/Basic_access_authentication) via HTTPS.

## License

The source for Histograph is released under the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

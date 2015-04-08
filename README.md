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

- http://api.histograph.io/search?name=utrecht
- http://api.histograph.io/search?hgid=geonames/2758064
- http://api.histograph.io/search?uri=http://vocab.getty.edu/tgn/7271174
- http://api.histograph.io/search?name=amsterdam&type=hg:Gemeente

## API specification

Histograph API currently has two endpoints:

- [`/search`](#search-api): geocoding, searching place names
- [`/source`](#source-api): source metadata, rejected edges

### Search API

| Endpoint      | Example                                  | Description
|---------------|------------------------------------------|-----------------
| `GET /search` | `/search?name=Bussum`                    | Search for place names

#### Parameters

All Histograph API search calls expect one (_and one only_) of the following search parameters:

| Parameter  | Example                                  | Description
|------------|------------------------------------------|-----------------
| `name`     | `name=Bussum`                            | Elasticsearch [query string](http://www.elastic.co/guide/en/elasticsearch/reference/1.x/query-dsl-query-string-query.html#query-string-syntax) on PIT names
| `hgid`     | `hgid=tgn/7268026`                       | Exact match on `hgid`
| `uri`      | `uri=http://vocab.getty.edu/tgn/7268026` | Exact match on `uri`

#### Filters

| Parameter | Example          | Description
|-----------|------------------|---------------------
| `type`    | `type=hg:Plaats` | Filter on PIT type

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

| Endpoint                                  | Example                           | Description
|-------------------------------------------|-----------------------------------|-------------------------------
| `GET /sources`                            |                                   | All sources used by Histograph
| `GET /sources/:source`                    | `/sources/geonames`               | Metadata of single source
| `GET /sources/:source/pits`               |                                   |
| `GET /sources/:source/relations`          |                                   |
| `GET /sources/:source/rejected_relations` | `/sources/tgn/rejected_relations` | Rejected edges of a single source

## License

The source for Histograph is released under the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

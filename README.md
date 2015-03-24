# Histograph API

Histograph's RESTful search API. To start Histograph API, run

    npm install
    forever index.js

Prerequisited:

- Running version of Histograph Core,
- Elasticsearch with Histograph indexes

Some example URLs:

- http://api.histograph.io/search?name=utrecht
- http://api.histograph.io/search?hgid=geonames/2758064
- http://api.histograph.io/search?uri=http://vocab.getty.edu/tgn/7271174
- http://api.histograph.io/search?name=amsterdam&type=hg:Gemeente

## API specification

### Search

All Histograph API search calls expect one (_and one only_) or the following search parameters:

| Parameter  | Example                                  | Description
|------------|------------------------------------------|-----------------
| `name`     | `name=Bussum`                            | Elasticsearch [query string](http://www.elastic.co/guide/en/elasticsearch/reference/1.x/query-dsl-query-string-query.html#query-string-syntax) on PIT names
| `hgid`     | `hgid=tgn/7268026`                       | Exact match on `hgid`
| `uri`      | `uri=http://vocab.getty.edu/tgn/7268026` | Exact match on `uri`

### Filters

| Parameter | Example          | Description
|-----------|------------------|---------------------
| `type`    | `type=hg:Plaats` | Filter on PIT type

### Exact name search

An extra boolean parameter `exact` is allowed when searching with parameter `name`, to
specify whether to search for exact match (case insensitive) or not. The default
value is `false`.

| Example                      | Description
|------------------------------|------------------------------------------------------------------------------
| `name=Gorinchem`             | Search for PIT name, includes results such as _Sleeswijk bij Gorinchem_
| `name=Gorinchem&exact=false` | Same as above
| `name=Gorinchem&exact=true`  | Search for exact PIT names, searches only for PITs exactly named _Gorinchem_
| `name=gOrINchEm&exact=true`  | Same as the previous, as this search is case-insensitive

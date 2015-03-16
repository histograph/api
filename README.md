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
- http://api.histograph.io/search?name=amsterdam&type=hg:Municipality

## API specification

### Search

All Histograph API search calls expect one (_and one only_) or the following search parameters:

| Parameter  | Example                                  | Description
|------------|------------------------------------------|-----------------
| `name`     | `name=Bussum`                            | Elasticseach [query string](http://www.elastic.co/guide/en/elasticsearch/reference/1.x/query-dsl-query-string-query.html#query-string-syntax) on PIT names
| `hgid`     | `hgid=tgn/7268026`                       | Exact match on `hgid`
| `uri`      | `uri=http://vocab.getty.edu/tgn/7268026` | Exact match on `uri`

### Filters

| Parameter | Example         | Description
|-----------|-----------------|---------------------
| `type`    | `type=hg:Place` | Filter on PIT type

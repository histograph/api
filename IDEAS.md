Twee objecten:

- PITs
- Concepten (meerdere PITs, verbonden met `hg:sameHgConcept`-relaties)

# API voor losse PITs

Vraag: https://api.histograph.io/cshapes/
Antwoord: GeoJSON van __één PIT__, met alle uitgaande/inkomende relaties (dat zijn ook PITs, met opvraagbaar adres)

# Filteren op source

https://api.histograph.io/search?q=amsterdam&source=tgn
https://api.histograph.io/search?q=hongarije&source=cshapes

__DOEN__:
In ES query doen met filter op source, dan BFS etc as usual, dan concept maken met Node, en dan op laatste moment nog filteren
https://api.histograph.io/search?q=amsterdam&source=tgn
https://api.histograph.io/search?q=amsterdam&source=tgn,geonames

# Filteren op tijdstip/periode

https://api.histograph.io/search?q=amsterdam&hg:before=1975
https://api.histograph.io/search?q=amsterdam&hg:before=cshapes/hongarije-latest

__DOEN__:
In ES range-query doen, dan BFS etc as usual, dan concept maken met Node, en dan op laatste moment nog filteren
https://api.histograph.io/search?q=amsterdam&hg:before=2000&hg:after=1975

# Deze misschien ook:

https://api.histograph.io/search?q=amsterdam&hg:liesIn=bag/amsterdam
https://api.histograph.io/search?q=amsterdam&hg:liesIn=POLYGON(53.2343,5.32 54.32,4.4555)
https://api.histograph.io/search?q=amsterdam&hg:before=1954
https://api.histograph.io/search?q=amsterdam&hg:before=periods/gouden-eeuw





https://github.com/erfgoed-en-locatie/historische-geocoder/blob/7a204712c86c118b8c544a790e3e765427843003/docs/voorbeeldqueries.md
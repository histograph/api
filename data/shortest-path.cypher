MATCH
  path = shortestPath((p:PIT)-[r:SAMEHGCONCEPT|LIESIN*1..6]->(q:PIT))
WHERE
  p.hgid IN {hgidsFrom} AND q.hgid IN {hgidsTo}
RETURN DISTINCT
  p.hgid

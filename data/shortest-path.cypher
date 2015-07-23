MATCH
  path = shortestPath((p:_)-[r:{{relations}}|hg_sameHgConcept*1..10]->(q:_))
WHERE
  p.id IN {idsFrom} AND q.id IN {idsTo}
RETURN DISTINCT
  p.id

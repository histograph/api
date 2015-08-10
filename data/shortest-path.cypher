// find source, target nodes
MATCH (m:_) WHERE m.id IN {idsFrom}
MATCH (n:_) WHERE n.id IN {idsTo}

// find corresponding equivalence classes
OPTIONAL MATCH m <-[:`=`]- (mConcept:`=`)
OPTIONAL MATCH n <-[:`=`]- (nConcept:`=`)

// choose the right node (EC if there, otherwise only member)
WITH m, n, coalesce(nConcept, n) AS to,
     coalesce(mConcept, m) AS from LIMIT 1

// ensure we have a path
MATCH p = shortestPath(from -[:liesIn|`=` * 1 .. 6]-> to)

RETURN DISTINCT m.id AS id
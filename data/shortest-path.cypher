// find source, target nodes
MATCH (m:_) WHERE m.id IN {idsFrom}
MATCH (n:_) WHERE n.id IN {idsTo}

// find corresponding relations
MATCH m <-[:`=`]- (mConcept:`=`)
MATCH n <-[:`=`]- (nConcept:`=`)

// ensure we have a path
MATCH p = allShortestPaths( mConcept -[:`=R` * 1 .. 8 ]-> nConcept )
WHERE all(r IN relationships(p) WHERE r.label IN {relations})

RETURN DISTINCT m.id

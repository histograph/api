// find target nodes
MATCH (ids:_) WHERE ids.id IN {ids}

// find corresponding equivalence classes (ECs)
OPTIONAL MATCH (ids) <-[:`=`]- (concepts:`=`)

// choose the right node (EC if there, otherwise only member)
WITH ids, coalesce(concepts, ids) AS matched

// find paths
MATCH (found:_) «directionFrom» [:«relations»|`=`|`=i` * 3 .. 9] «directionTo» (matched)

WHERE NOT found:_Rel AND NOT found:`=`
RETURN DISTINCT found.id AS id
LIMIT 100

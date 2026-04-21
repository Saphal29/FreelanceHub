// This is the fix for the getProjects function parameter binding issue
// The problem: params.slice(0, -2) was removing limit and offset, but when userId was added,
// the count query was getting the wrong parameters

// BEFORE (lines 213-217):
/*
    // Execute both queries
    const [projectsResult, countResult] = await Promise.all([
      query(projectsQuery, params.slice(0, -2).concat([limit, offset])),
      query(countQuery, params.slice(0, -2))
    ]);
*/

// AFTER:
// Add this line BEFORE the query execution (around line 180, after whereClause):
//     // Save params for count query (before adding userId, limit, offset)
//     const countParams = [...params];

// Then change the query execution to:
/*
    // Execute both queries
    const [projectsResult, countResult] = await Promise.all([
      query(projectsQuery, params),
      query(countQuery, countParams)
    ]);
*/

// The key insight: We need to save the params array BEFORE adding userId, limit, and offset
// because the count query only needs the WHERE clause parameters, not the LIMIT/OFFSET or userId

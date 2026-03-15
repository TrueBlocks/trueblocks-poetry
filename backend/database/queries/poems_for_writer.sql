SELECT COUNT(*)
FROM relationships r
JOIN entities e ON r.source_id = e.id
WHERE r.target_id = ? 
AND e.type_slug = 'title'
AND (
    e.description LIKE '%[%' 
    AND e.description LIKE '%]%'
);
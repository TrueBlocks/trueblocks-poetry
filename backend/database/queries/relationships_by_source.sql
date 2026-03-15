SELECT 
    r.id, 
    r.source_id, 
    r.target_id, 
    r.label, 
    r.created_at,
    e.primary_label as target_label,
    e.type_slug as target_type
FROM relationships r
JOIN entities e ON r.target_id = e.id
WHERE r.source_id = ?
ORDER BY r.created_at DESC;

SELECT 
    e.id, 
    e.type_slug, 
    e.primary_label,
    t.primary_label as linked_label
FROM entities e
JOIN relationships r ON e.id = r.source_id
JOIN entities t ON r.target_id = t.id
WHERE e.description NOT LIKE '%' || t.primary_label || '%'
ORDER BY e.primary_label;

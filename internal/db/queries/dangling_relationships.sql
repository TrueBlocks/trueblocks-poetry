SELECT 
    r.id,
    r.source_id,
    r.target_id,
    r.label,
    source.primary_label as source_word,
    source.type_slug as source_type,
    CASE 
        WHEN target.id IS NULL THEN 'destination'
        ELSE 'source'
    END as missing_side
FROM relationships r
LEFT JOIN entities source ON r.source_id = source.id
LEFT JOIN entities target ON r.target_id = target.id
WHERE source.id IS NULL OR target.id IS NULL
ORDER BY source.primary_label

SELECT 
    id, 
    type_slug, 
    primary_label, 
    secondary_label, 
    description, 
    attributes, 
    created_at, 
    updated_at 
FROM entities 
WHERE type_slug = ? 
ORDER BY primary_label;

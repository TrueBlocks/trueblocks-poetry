SELECT id, primary_label, type_slug, description, json_extract(attributes, '$.derivation'), json_extract(attributes, '$.appendicies')
FROM entities 
WHERE description LIKE '%{%'
   OR json_extract(attributes, '$.derivation') LIKE '%{%'
   OR json_extract(attributes, '$.appendicies') LIKE '%{%'

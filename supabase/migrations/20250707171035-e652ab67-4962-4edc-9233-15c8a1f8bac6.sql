
-- D'abord, identifions les doublons dans les media_files JSONB du rapport
WITH report_media AS (
  SELECT 
    id,
    jsonb_array_elements(media_files) as media_item
  FROM intervention_reports 
  WHERE id = '3bf77b09-7ca5-452d-b294-df3275d6a596'
),
duplicates AS (
  SELECT 
    media_item,
    COUNT(*) as count
  FROM report_media
  GROUP BY media_item
  HAVING COUNT(*) > 1
)
SELECT 
  media_item,
  count as nombre_doublons
FROM duplicates;

-- Une fois que vous avez vérifié les doublons, voici la requête pour les supprimer
-- et garder seulement une occurrence unique de chaque média
UPDATE intervention_reports 
SET media_files = (
  SELECT jsonb_agg(DISTINCT media_item)
  FROM jsonb_array_elements(media_files) as media_item
)
WHERE id = '3bf77b09-7ca5-452d-b294-df3275d6a596'
AND jsonb_array_length(media_files) > 0;

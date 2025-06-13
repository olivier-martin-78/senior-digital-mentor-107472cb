
-- Supprimer la contrainte de clé étrangère qui empêche la suppression des rapports d'intervention
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_intervention_report_id_fkey;

-- Recréer la contrainte avec ON DELETE SET NULL pour permettre la suppression
ALTER TABLE appointments 
ADD CONSTRAINT appointments_intervention_report_id_fkey 
FOREIGN KEY (intervention_report_id) 
REFERENCES intervention_reports(id) 
ON DELETE SET NULL;

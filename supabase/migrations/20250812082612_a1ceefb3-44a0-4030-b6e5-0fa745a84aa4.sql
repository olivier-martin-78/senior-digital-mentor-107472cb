
-- 1) Attacher le trigger d’initialisation/synchronisation sur intervention_reports
DROP TRIGGER IF EXISTS trg_ir_set_client_city ON public.intervention_reports;

CREATE TRIGGER trg_ir_set_client_city
BEFORE INSERT OR UPDATE OF appointment_id
ON public.intervention_reports
FOR EACH ROW
WHEN (NEW.appointment_id IS NOT NULL)
EXECUTE FUNCTION public.set_client_city_from_appointment();

-- 2) Fonction: mettre à jour client_city des rapports quand la ville du client change
CREATE OR REPLACE FUNCTION public.update_reports_client_city_on_client_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.city IS DISTINCT FROM OLD.city THEN
    UPDATE public.intervention_reports ir
    SET client_city = NEW.city,
        updated_at = now()
    FROM public.appointments a
    WHERE ir.appointment_id = a.id
      AND a.client_id = NEW.id
      AND COALESCE(ir.client_city, '') IS DISTINCT FROM COALESCE(NEW.city, '');
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Trigger: après mise à jour de la ville d’un client
DROP TRIGGER IF EXISTS trg_sync_reports_city ON public.clients;

CREATE TRIGGER trg_sync_reports_city
AFTER UPDATE OF city
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_reports_client_city_on_client_update();

-- 4) Backfill: synchroniser toutes les données existantes
UPDATE public.intervention_reports ir
SET client_city = c.city,
    updated_at = now()
FROM public.appointments a
JOIN public.clients c ON c.id = a.client_id
WHERE ir.appointment_id = a.id
  AND COALESCE(ir.client_city, '') IS DISTINCT FROM COALESCE(c.city, '');

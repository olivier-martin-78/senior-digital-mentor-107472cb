-- Add a public-safe city field for client reviews on mini-sites
-- 1) Column to store the client's city directly on intervention_reports
ALTER TABLE public.intervention_reports
ADD COLUMN IF NOT EXISTS client_city text;

-- 2) Trigger function to populate client_city from the linked appointment -> client
CREATE OR REPLACE FUNCTION public.set_client_city_from_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.appointment_id IS NOT NULL THEN
    SELECT c.city INTO NEW.client_city
    FROM public.appointments a
    JOIN public.clients c ON a.client_id = c.id
    WHERE a.id = NEW.appointment_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Trigger on insert/update to keep client_city in sync
DROP TRIGGER IF EXISTS trg_set_client_city_on_intervention_reports ON public.intervention_reports;
CREATE TRIGGER trg_set_client_city_on_intervention_reports
BEFORE INSERT OR UPDATE ON public.intervention_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_client_city_from_appointment();

-- 4) Backfill existing rows
UPDATE public.intervention_reports ir
SET client_city = c.city
FROM public.appointments a
JOIN public.clients c ON a.client_id = c.id
WHERE ir.appointment_id = a.id
  AND (ir.client_city IS NULL OR ir.client_city = '');
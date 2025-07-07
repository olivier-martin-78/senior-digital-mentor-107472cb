
-- Corriger la fonction pour définir un search_path sécurisé
CREATE OR REPLACE FUNCTION public.update_caregiver_messages_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;


-- Migration pour corriger les avertissements "Function Search Path Mutable"
-- Cette migration sécurise 5 fonctions en définissant explicitement leur search_path

-- 1. Corriger update_group_invitation_updated_at
CREATE OR REPLACE FUNCTION public.update_group_invitation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Corriger update_group_invitation_confirmation_date
CREATE OR REPLACE FUNCTION public.update_group_invitation_confirmation_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    NEW.confirmation_date = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Corriger set_updated_by_professional_id
CREATE OR REPLACE FUNCTION public.set_updated_by_professional_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Lors d'une mise à jour, enregistrer qui fait la modification
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by_professional_id = auth.uid();
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Corriger send_appointment_reminder_emails
CREATE OR REPLACE FUNCTION public.send_appointment_reminder_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Sélectionner les rendez-vous du lendemain qui n'ont pas encore reçu d'email
  FOR appointment_record IN
    SELECT a.*, c.first_name as client_first_name, c.last_name as client_last_name, c.email as client_email
    FROM public.appointments a
    JOIN public.clients c ON a.client_id = c.id
    WHERE DATE(a.start_time) = CURRENT_DATE + INTERVAL '1 day'
    AND a.email_sent = FALSE
    AND a.status = 'scheduled'
  LOOP
    -- Marquer l'email comme envoyé
    UPDATE public.appointments 
    SET email_sent = TRUE 
    WHERE id = appointment_record.id;
  END LOOP;
END;
$function$;

-- 5. Corriger validate_appointment_times
CREATE OR REPLACE FUNCTION public.validate_appointment_times()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Vérifier que end_time est postérieur à start_time
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'L''heure de fin doit être postérieure à l''heure de début';
  END IF;
  
  -- Vérifier que start_time et end_time sont sur la même date
  IF DATE(NEW.start_time) != DATE(NEW.end_time) THEN
    RAISE EXCEPTION 'Le début et la fin du rendez-vous doivent être sur la même date';
  END IF;
  
  -- Vérifier que la durée ne dépasse pas 24 heures (sécurité supplémentaire)
  IF NEW.end_time - NEW.start_time > INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'La durée du rendez-vous ne peut pas dépasser 24 heures';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Script de rollback (à conserver pour annuler les changements si nécessaire)
/*
ROLLBACK SCRIPT - À EXÉCUTER SEULEMENT EN CAS DE PROBLÈME :

-- 1. Rollback update_group_invitation_updated_at
CREATE OR REPLACE FUNCTION public.update_group_invitation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Rollback update_group_invitation_confirmation_date
CREATE OR REPLACE FUNCTION public.update_group_invitation_confirmation_date()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    NEW.confirmation_date = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Rollback set_updated_by_professional_id
CREATE OR REPLACE FUNCTION public.set_updated_by_professional_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Lors d'une mise à jour, enregistrer qui fait la modification
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by_professional_id = auth.uid();
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Rollback send_appointment_reminder_emails
CREATE OR REPLACE FUNCTION public.send_appointment_reminder_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Sélectionner les rendez-vous du lendemain qui n'ont pas encore reçu d'email
  FOR appointment_record IN
    SELECT a.*, c.first_name as client_first_name, c.last_name as client_last_name, c.email as client_email
    FROM public.appointments a
    JOIN public.clients c ON a.client_id = c.id
    WHERE DATE(a.start_time) = CURRENT_DATE + INTERVAL '1 day'
    AND a.email_sent = FALSE
    AND a.status = 'scheduled'
  LOOP
    -- Marquer l'email comme envoyé
    UPDATE public.appointments 
    SET email_sent = TRUE 
    WHERE id = appointment_record.id;
  END LOOP;
END;
$function$;

-- 5. Rollback validate_appointment_times
CREATE OR REPLACE FUNCTION public.validate_appointment_times()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Vérifier que end_time est postérieur à start_time
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'L''heure de fin doit être postérieure à l''heure de début';
  END IF;
  
  -- Vérifier que start_time et end_time sont sur la même date
  IF DATE(NEW.start_time) != DATE(NEW.end_time) THEN
    RAISE EXCEPTION 'Le début et la fin du rendez-vous doivent être sur la même date';
  END IF;
  
  -- Vérifier que la durée ne dépasse pas 24 heures (sécurité supplémentaire)
  IF NEW.end_time - NEW.start_time > INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'La durée du rendez-vous ne peut pas dépasser 24 heures';
  END IF;
  
  RETURN NEW;
END;
$function$;

*/

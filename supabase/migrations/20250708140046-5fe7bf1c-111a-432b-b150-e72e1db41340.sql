-- Corriger le search_path mutable de la fonction update_wish_status_metadata

CREATE OR REPLACE FUNCTION public.update_wish_status_metadata()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Si le statut a changé, mettre à jour les métadonnées
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_by = auth.uid();
    NEW.status_changed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;
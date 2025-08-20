-- Corriger les problèmes de sécurité en supprimant d'abord le trigger
DROP TRIGGER IF EXISTS update_cognitive_puzzle_dialogues_updated_at ON public.cognitive_puzzle_dialogues;
DROP FUNCTION IF EXISTS public.update_cognitive_puzzle_dialogues_updated_at();

-- Recréer la fonction avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.update_cognitive_puzzle_dialogues_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER update_cognitive_puzzle_dialogues_updated_at
BEFORE UPDATE ON public.cognitive_puzzle_dialogues
FOR EACH ROW
EXECUTE FUNCTION public.update_cognitive_puzzle_dialogues_updated_at();
-- Corriger la fonction generate_review_token pour ne pas utiliser gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_review_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  token TEXT;
BEGIN
  -- Générer un token en utilisant random() et extract(epoch from now()) pour l'unicité
  token := encode(
    decode(
      md5(random()::text || clock_timestamp()::text || random()::text), 
      'hex'
    ), 
    'base64'
  );
  -- Nettoyer le token pour le rendre URL-safe
  token := translate(token, '+/=', '-_');
  -- Tronquer à 32 caractères pour éviter les tokens trop longs
  token := substring(token from 1 for 32);
  RETURN token;
END;
$function$;
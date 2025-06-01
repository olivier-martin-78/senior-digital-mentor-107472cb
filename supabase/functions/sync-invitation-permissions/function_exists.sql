
CREATE OR REPLACE FUNCTION public.pg_function_exists(function_name text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = function_name
  );
$$;

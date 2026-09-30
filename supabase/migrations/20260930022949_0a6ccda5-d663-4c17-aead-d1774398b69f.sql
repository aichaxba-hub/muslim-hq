DELETE FROM public.duas a
USING public.duas b
WHERE a.user_id = b.user_id
  AND a.title = b.title
  AND a.created_at > b.created_at;
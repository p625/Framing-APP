-- Ensure frame_profiles publish policies exist (idempotent).
-- Storage upload can succeed without these; catalogue publish requires INSERT/UPDATE.

DROP POLICY IF EXISTS "anon_select_all_frame_profiles_editor"
  ON public.frame_profiles;

CREATE POLICY "anon_select_all_frame_profiles_editor"
  ON public.frame_profiles
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_insert_frame_profiles"
  ON public.frame_profiles;

CREATE POLICY "anon_insert_frame_profiles"
  ON public.frame_profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_frame_profiles"
  ON public.frame_profiles;

CREATE POLICY "anon_update_frame_profiles"
  ON public.frame_profiles
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

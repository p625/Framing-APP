-- Frame profile cloud publishing (pre-auth)
-- Temporary open policies for anon until admin auth is added.
-- Replace with authenticated admin policies in a future migration.

-- ---------------------------------------------------------------------------
-- Storage bucket: frame-profile-images
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'frame-profile-images',
  'frame-profile-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage policies (anon — replace with admin role when auth lands)
-- ---------------------------------------------------------------------------

CREATE POLICY "anon_select_frame_profile_images"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'frame-profile-images');

CREATE POLICY "anon_insert_frame_profile_images"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'frame-profile-images');

CREATE POLICY "anon_update_frame_profile_images"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'frame-profile-images')
  WITH CHECK (bucket_id = 'frame-profile-images');

-- ---------------------------------------------------------------------------
-- frame_profiles write + admin read (anon — temporary)
-- ---------------------------------------------------------------------------

CREATE POLICY "anon_select_all_frame_profiles_editor"
  ON public.frame_profiles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_frame_profiles"
  ON public.frame_profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_frame_profiles"
  ON public.frame_profiles
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Future authenticated admin example:
--
-- CREATE POLICY "admin_manage_frame_profiles"
--   ON public.frame_profiles
--   FOR ALL
--   TO authenticated
--   USING ((auth.jwt() ->> 'app_role') = 'admin')
--   WITH CHECK ((auth.jwt() ->> 'app_role') = 'admin');
--
-- CREATE POLICY "admin_manage_frame_profile_images"
--   ON storage.objects
--   FOR ALL
--   TO authenticated
--   USING (
--     bucket_id = 'frame-profile-images'
--     AND (auth.jwt() ->> 'app_role') = 'admin'
--   )
--   WITH CHECK (
--     bucket_id = 'frame-profile-images'
--     AND (auth.jwt() ->> 'app_role') = 'admin'
--   );

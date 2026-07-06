-- FrameStudio initial schema
-- Migration: 0001_initial_schema
--
-- Auth is not configured in this migration.
-- Anonymous (anon) clients may read published catalogue content only.
-- Future migrations should add authenticated admin policies (see comments below).

-- ---------------------------------------------------------------------------
-- Shared trigger: maintain updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- frame_profiles
-- ---------------------------------------------------------------------------

CREATE TABLE public.frame_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  sample_mode TEXT NOT NULL,
  source_corner TEXT NOT NULL DEFAULT 'auto',
  rail_source_mode TEXT NOT NULL DEFAULT 'separate',
  rail_source_side TEXT NOT NULL DEFAULT 'top',
  frame_width_cm NUMERIC(6, 2) NOT NULL,
  texture_scale NUMERIC(6, 3) NOT NULL DEFAULT 1,
  fallback_color TEXT NOT NULL,
  calibration_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample_image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  customer_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT frame_profiles_sample_mode_check
    CHECK (sample_mode IN ('corner', 'texture')),
  CONSTRAINT frame_profiles_source_corner_check
    CHECK (source_corner IN ('auto', 'top-left', 'top-right', 'bottom-right', 'bottom-left')),
  CONSTRAINT frame_profiles_rail_source_mode_check
    CHECK (rail_source_mode IN ('separate', 'horizontal-all', 'vertical-all')),
  CONSTRAINT frame_profiles_rail_source_side_check
    CHECK (rail_source_side IN ('top', 'right', 'bottom', 'left')),
  CONSTRAINT frame_profiles_frame_width_cm_positive
    CHECK (frame_width_cm > 0),
  CONSTRAINT frame_profiles_texture_scale_positive
    CHECK (texture_scale > 0)
);

CREATE INDEX frame_profiles_published_idx
  ON public.frame_profiles (is_published)
  WHERE is_published = true;

CREATE INDEX frame_profiles_category_idx
  ON public.frame_profiles (category);

CREATE INDEX frame_profiles_featured_idx
  ON public.frame_profiles (is_featured)
  WHERE is_featured = true;

CREATE TRIGGER frame_profiles_set_updated_at
  BEFORE UPDATE ON public.frame_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.frame_profiles IS
  'Catalogue of frame sample profiles (built-in and publishable custom profiles).';

COMMENT ON COLUMN public.frame_profiles.calibration_json IS
  'FrameCornerCalibration payload: innerCorner, outerCorner, horizontalStrip, verticalStrip.';

COMMENT ON COLUMN public.frame_profiles.customer_tag IS
  'Optional tag for customer-specific or white-label catalogue filtering.';

-- ---------------------------------------------------------------------------
-- environments
-- ---------------------------------------------------------------------------

CREATE TABLE public.environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  calibration_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX environments_category_idx
  ON public.environments (category);

CREATE INDEX environments_builtin_idx
  ON public.environments (is_builtin)
  WHERE is_builtin = true;

CREATE TRIGGER environments_set_updated_at
  BEFORE UPDATE ON public.environments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.environments IS
  'Room / wall background scenes for in-situ framing previews.';

COMMENT ON COLUMN public.environments.calibration_json IS
  'EnvironmentCalibration payload: wallRect, realWallWidthCm, realWallHeightCm.';

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  preview_image_url TEXT,
  project_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX projects_created_at_idx
  ON public.projects (created_at DESC);

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.projects IS
  'Saved framing workspace state (artwork, frame, mat, environment placement).';

COMMENT ON COLUMN public.projects.project_json IS
  'SerializableProject payload for client-side restore and export.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.frame_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Anonymous (anon) policies — read-only catalogue access
-- ---------------------------------------------------------------------------

CREATE POLICY "anon_select_published_frame_profiles"
  ON public.frame_profiles
  FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "anon_select_environments"
  ON public.environments
  FOR SELECT
  TO anon
  USING (true);

-- projects: no anon policies (SELECT / INSERT / UPDATE / DELETE denied by default)

-- ---------------------------------------------------------------------------
-- Future authenticated admin policies (not enabled yet)
-- ---------------------------------------------------------------------------
--
-- After Supabase Auth is added, grant catalogue management to admin users, e.g.:
--
-- CREATE POLICY "admin_all_frame_profiles"
--   ON public.frame_profiles
--   FOR ALL
--   TO authenticated
--   USING ((auth.jwt() ->> 'app_role') = 'admin')
--   WITH CHECK ((auth.jwt() ->> 'app_role') = 'admin');
--
-- CREATE POLICY "admin_all_environments"
--   ON public.environments
--   FOR ALL
--   TO authenticated
--   USING ((auth.jwt() ->> 'app_role') = 'admin')
--   WITH CHECK ((auth.jwt() ->> 'app_role') = 'admin');
--
-- CREATE POLICY "admin_all_projects"
--   ON public.projects
--   FOR ALL
--   TO authenticated
--   USING ((auth.jwt() ->> 'app_role') = 'admin')
--   WITH CHECK ((auth.jwt() ->> 'app_role') = 'admin');
--
-- For per-user saved projects (non-admin), a typical pattern is:
--
-- ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users (id);
--
-- CREATE POLICY "users_select_own_projects"
--   ON public.projects
--   FOR SELECT
--   TO authenticated
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "users_insert_own_projects"
--   ON public.projects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "users_update_own_projects"
--   ON public.projects
--   FOR UPDATE
--   TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "users_delete_own_projects"
--   ON public.projects
--   FOR DELETE
--   TO authenticated
--   USING (auth.uid() = user_id);

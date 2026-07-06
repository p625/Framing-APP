import { getSupabaseClient, isSupabaseConfigured } from "@/src/lib/supabase/client";

/**
 * Gate for cloud profile publishing.
 * Set NEXT_PUBLIC_ENABLE_CLOUD_PROFILE_PUBLISH=false to disable until admin auth ships.
 * Future: require authenticated admin session here.
 */
export function isCloudPublishEnabled(): boolean {
  if (!isSupabaseConfigured()) {
    return false;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_CLOUD_PROFILE_PUBLISH === "false") {
    return false;
  }

  return true;
}

export function assertCloudPublishAllowed(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!isCloudPublishEnabled()) {
    throw new Error("Cloud publishing is disabled.");
  }

  // Future admin guard:
  // const session = await getAdminSession();
  // if (!session || session.user.app_metadata?.role !== "admin") {
  //   throw new Error("Admin access required to publish frame profiles.");
  // }
}

export function getSupabaseClientForPublish() {
  assertCloudPublishAllowed();
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase client is unavailable.");
  }
  return client;
}

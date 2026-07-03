export const DEFAULT_PROFILE_PREVIEW_ARTWORK_URL =
  "/defaults/profile-preview-artwork.svg";

export function resolveProfilePreviewArtworkUrl(
  workspaceArtworkUrl: string | null,
): { url: string; isDefault: boolean } {
  if (workspaceArtworkUrl) {
    return { url: workspaceArtworkUrl, isDefault: false };
  }
  return { url: DEFAULT_PROFILE_PREVIEW_ARTWORK_URL, isDefault: true };
}

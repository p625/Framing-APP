export interface StoredImageFile {
  blob: Blob;
  name: string;
  type: string;
}

export async function blobFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to read image data from URL");
  }
  return response.blob();
}

export function fileFromStoredImage(stored: StoredImageFile): File {
  return new File([stored.blob], stored.name, {
    type: stored.type || "image/png",
  });
}

export function storedImageFromFile(file: File): StoredImageFile {
  return {
    blob: file,
    name: file.name,
    type: file.type || "image/png",
  };
}

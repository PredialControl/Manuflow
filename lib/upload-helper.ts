import { put } from "@vercel/blob";

/**
 * Upload file to storage (Vercel Blob in production, mock in development)
 */
export async function uploadFile(file: File, pathname?: string): Promise<string> {
  // Check if Vercel Blob is configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname || file.name, file, {
      access: "public",
      addRandomSuffix: !pathname,
    });
    return blob.url;
  }

  // Development fallback: Use data URL (not for production!)
  console.warn("[UPLOAD] Vercel Blob not configured. Using data URL fallback (dev only)");

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  // In a real scenario, you would save to local storage or a dev bucket
  // For now, return a data URL (works but not scalable)
  return dataUrl;
}

/**
 * Check if upload service is properly configured
 */
export function isUploadConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

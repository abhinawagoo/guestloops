/**
 * Cloudflare R2 media uploads (S3-compatible).
 * Used for: menu/service item images, feedback photos.
 *
 * Setup: set R2_* env vars in .env.example, then implement getPresignedUploadUrl
 * using @aws-sdk/client-s3 with R2 endpoint (https://<ACCOUNT_ID>.r2.cloudflarestorage.com).
 * Public read URL: R2_PUBLIC_URL or bucket public access if configured.
 */

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export function isR2Configured(): boolean {
  return Boolean(
    R2_BUCKET &&
      R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  );
}

/**
 * Returns a presigned PUT URL for client-side upload, or null if R2 is not configured.
 * Call from API route: POST /api/upload/presign with body { filename, contentType }.
 */
export async function getPresignedUploadUrl(
  _key: string,
  _contentType: string
): Promise<{ url: string; key: string } | null> {
  if (!isR2Configured()) return null;
  // TODO: use @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
  // with endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  return null;
}

/**
 * Public URL for a given key (if R2_PUBLIC_URL or bucket public access is set).
 */
export function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    const base = R2_PUBLIC_URL.replace(/\/$/, "");
    return `${base}/${key}`;
  }
  return "";
}

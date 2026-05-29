import { createClient } from "@supabase/supabase-js";

const BUCKET = "lead-photos";

// Create client lazily so missing env vars don't crash the page on import
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase Storage not configured — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key);
}

// Server-side client using service role key (bypasses RLS — only call from API routes)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role key not configured");
  return createClient(url, key);
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Extracts the storage path from the URL and removes the object.
 * Call only from server-side API routes.
 */
export async function deleteLeadPhotoFromStorage(photoUrl: string): Promise<void> {
  // URL format: https://<ref>.supabase.co/storage/v1/object/public/lead-photos/<path>
  const marker = `/object/public/${BUCKET}/`;
  const idx = photoUrl.indexOf(marker);
  if (idx === -1) return; // not a storage URL — skip
  const path = photoUrl.slice(idx + marker.length);
  const client = getServiceClient();
  await client.storage.from(BUCKET).remove([path]);
}
const MAX_DIMENSION = 1600; // px — enough for GPT-4o high-detail analysis
const JPEG_QUALITY = 0.85;

/**
 * Resize and compress an image file using the browser Canvas API.
 * Caps the longest side at MAX_DIMENSION and re-encodes as JPEG.
 * Drops file size from ~8MB (iPhone) to ~300–500KB with no meaningful quality loss for AI analysis.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

/**
 * Compress a photo, upload to Supabase Storage, and return the public URL.
 * Path: leads/{leadId}/{uuid}.jpg
 *
 * Called from the browser — uses the anon key (bucket must allow public INSERT).
 */
export async function uploadLeadPhoto(file: File, leadId: string): Promise<string> {
  const compressed = await compressImage(file);
  const filename = `${crypto.randomUUID()}.jpg`;
  const path = `leads/${leadId}/${filename}`;

  const client = getClient();

  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: "image/jpeg", upsert: false });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

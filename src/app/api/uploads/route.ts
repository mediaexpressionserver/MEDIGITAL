// src/app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = "client-assets";
const FOLDER = "uploads";

// Make limit configurable via env; default to 8MB for images, bump for videos as needed
const DEFAULT_MAX_MB = process.env.UPLOAD_MAX_MB ? parseInt(process.env.UPLOAD_MAX_MB, 10) : 8;
const MAX_BYTES = (Number.isFinite(DEFAULT_MAX_MB) ? DEFAULT_MAX_MB : 8) * 1024 * 1024;

function getExt(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? (parts.pop() || "bin").toLowerCase() : "bin";
}

function human(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export async function POST(req: Request) {
  try {
    console.log('[uploads] incoming POST', { url: req.url });

    const contentType = req.headers.get('content-type') || '';
    console.log('[uploads] content-type header:', contentType);

    const formData = await req.formData();
    console.log('[uploads] formData keys:', Array.from(formData.keys()));

    // Accept either single 'file' or multiple 'files'
    const singleFile = formData.get("file") as File | null;
    const multiFiles = formData.getAll("files").filter(Boolean) as File[];

    const filesToProcess: File[] = [];
    if (singleFile) filesToProcess.push(singleFile);
    if (multiFiles && multiFiles.length > 0) filesToProcess.push(...multiFiles);

    if (filesToProcess.length === 0) {
      console.warn('[uploads] no files provided');
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const uploadedPaths: string[] = [];

    for (const file of filesToProcess) {
      if (!(file instanceof File)) continue;

      const name = file.name || "unnamed";
      const clientSize = (file as any).size ?? null;

      const arrayBuffer = await file.arrayBuffer();
      const serverSize = arrayBuffer.byteLength;

      console.log(`[uploads] received file: ${name}; client-reported size=${human(clientSize ?? serverSize)}; server byteLength=${human(serverSize)}; MAX=${human(MAX_BYTES)}`);

      if (serverSize > MAX_BYTES) {
        const msg = `File too large: '${name}' is ${human(serverSize)} (server) / ${human(clientSize ?? 0)} (client) — max allowed ${human(MAX_BYTES)}.`;
        console.warn('[uploads] size check failed:', msg);
        return NextResponse.json({ error: msg }, { status: 413 });
      }

      const ext = getExt(file.name || "upload.bin");
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const filePath = `${FOLDER}/${filename}`;
      const buffer = Buffer.from(arrayBuffer);

      let uploadData: any = null;
      try {
        const { data, error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(filePath, buffer, {
            contentType: file.type || `application/octet-stream`,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error('[uploads] supabase upload error:', uploadError);
          // include the error message in response for easier debugging (not ideal for prod)
          return NextResponse.json({ error: uploadError.message || JSON.stringify(uploadError) }, { status: 500 });
        }

        uploadData = data;
      } catch (err: any) {
        console.error('[uploads] exception during supabase upload:', err);
        return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
      }

      if (!uploadData?.path) {
        console.error('[uploads] upload returned no path for file:', file.name, 'uploadData:', uploadData);
        return NextResponse.json({ error: "Upload succeeded but no path returned", raw: uploadData }, { status: 500 });
      }

      // attempt to get public URL; fall back to constructing it from SUPABASE_URL
      let publicUrl: string | null = null;
      try {
        const publicUrlResult = supabaseAdmin.storage.from(BUCKET).getPublicUrl(uploadData.path as string) as any;
        publicUrl = publicUrlResult?.data?.publicUrl ?? null;
        if (!publicUrl && process.env.SUPABASE_URL) {
          // Construct fallback public URL
          publicUrl = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(String(uploadData.path))}`;
          console.warn('[uploads] constructed fallback publicUrl:', publicUrl);
        }
      } catch (err: any) {
        console.error('[uploads] getPublicUrl failed:', err);
      }

      if (!publicUrl) {
        console.error('[uploads] publicUrl missing for path:', uploadData.path, 'raw:', uploadData);
        return NextResponse.json({ error: "Failed to retrieve public URL", path: uploadData.path, debug: uploadData }, { status: 500 });
      }

      uploadedUrls.push(publicUrl);
      uploadedPaths.push(String(uploadData.path));
    }

    // respond with both urls and storage paths for easier debugging
    if (uploadedUrls.length === 1) {
      return NextResponse.json({ url: uploadedUrls[0], path: uploadedPaths[0] }, { status: 201 });
    }
    return NextResponse.json({ urls: uploadedUrls, paths: uploadedPaths }, { status: 201 });
  } catch (err: any) {
    console.error('[uploads] Exception:', err);
    // include a short snippet of the message in the response
    return NextResponse.json({ error: (err && err.message) || 'Upload failed' }, { status: 500 });
  }
}
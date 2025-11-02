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
    const formData = await req.formData();

    // Accept either single 'file' or multiple 'files'
    const singleFile = formData.get("file") as File | null;
    const multiFiles = formData.getAll("files").filter(Boolean) as File[];

    const filesToProcess: File[] = [];
    if (singleFile) filesToProcess.push(singleFile);
    if (multiFiles && multiFiles.length > 0) filesToProcess.push(...multiFiles);

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      if (!(file instanceof File)) continue;

      // Helpful debug logging for troubleshooting size errors:
      const name = file.name || "unnamed";
      const clientSize = (file as any).size ?? null;

      const arrayBuffer = await file.arrayBuffer();
      const serverSize = arrayBuffer.byteLength;

      console.log(`[uploads] received file: ${name}; client-reported size=${human(clientSize ?? serverSize)}; server byteLength=${human(serverSize)}; MAX=${human(MAX_BYTES)}`);

      if (serverSize > MAX_BYTES) {
        return NextResponse.json(
          {
            error: `File too large: '${name}' is ${human(serverSize)} (server) / ${human(clientSize ?? 0)} (client) — max allowed ${human(MAX_BYTES)}.`,
          },
          { status: 413 }
        );
      }

      const ext = getExt(file.name || "upload.bin");
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const filePath = `${FOLDER}/${filename}`;
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: file.type || `application/octet-stream`,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("[uploads] single file upload error:", uploadError);
        return NextResponse.json({ error: uploadError.message || "Upload failed" }, { status: 500 });
      }

      if (!uploadData?.path) {
        console.error("[uploads] upload returned no path for file:", file.name);
        return NextResponse.json({ error: "Upload succeeded but no path returned" }, { status: 500 });
      }

      const publicUrlResult = supabaseAdmin.storage.from(BUCKET).getPublicUrl(uploadData.path);
      const publicUrl =
        (publicUrlResult && (publicUrlResult as any).data && (publicUrlResult as any).data.publicUrl) ||
        null;

      if (!publicUrl) {
        console.error("[uploads] publicUrl missing for path:", uploadData.path, "raw:", publicUrlResult);
        return NextResponse.json({ error: "Failed to retrieve public URL" }, { status: 500 });
      }

      uploadedUrls.push(publicUrl);
    }

    // respond with single url for single upload, or array for multi
    if (uploadedUrls.length === 1) {
      return NextResponse.json({ url: uploadedUrls[0] }, { status: 201 });
    }
    return NextResponse.json({ urls: uploadedUrls }, { status: 201 });
  } catch (err: any) {
    console.error("[uploads] Exception:", err);
    return NextResponse.json({ error: (err && err.message) || "Upload failed" }, { status: 500 });
  }
}
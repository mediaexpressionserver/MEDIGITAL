// src/app/admin/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import SimpleEditor from "@/components/SimpleEditor";

/* ---------- types ---------- */
type Client = {
  id: string;
  client_name?: string;
  logo_url?: string;
  blog_title?: string;
  blog_slug?: string;
  blog_body_html?: string;
  blog_feature_image?: string;
  cta_text?: string;
  created_at?: string;
  images?: string[];
  videos?: string[];
  body_data?: any;
};

/* ---------- component ---------- */
export default function AdminPage() {
  const [list, setList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);

  // form fields
  const [clientName, setClientName] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [blogBody, setBlogBody] = useState(""); // HTML
  const [ctaText, setCtaText] = useState("Read full blog");

  // files + previews (images)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // videos + previews
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // logos / feature images
  const [logoUrl, setLogoUrl] = useState("");
  const [featureImageUrl, setFeatureImageUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFeature, setUploadingFeature] = useState(false);
  const [editingLogoUploading, setEditingLogoUploading] = useState(false);
  const [editingFeatureUploading, setEditingFeatureUploading] = useState(false);
  const [editingLogoPreview, setEditingLogoPreview] = useState<string | null>(null);
  const [editingFeaturePreview, setEditingFeaturePreview] = useState<string | null>(null);

  // editing videos upload state + previews
  const [editingVideoUploading, setEditingVideoUploading] = useState(false);
  const [editingVideoPreview, setEditingVideoPreview] = useState<string | null>(null);

  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    fetchList();

    return () => {
      previews.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
      videoPreviews.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchList() {
    setLoading(true);
    setStatus(null);

    const candidates = [
      "/api/clients",
      "/api/admin/clients",
      `${window.location.origin}/api/clients`,
      `${window.location.origin}/api/admin/clients`,
    ];

    let lastDebug: any = null;

    for (const endpoint of candidates) {
      try {
        console.group(`[admin fetchList] trying ${endpoint}`);
        const res = await fetch(endpoint, {
          method: "GET",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const statusLine = `${res.status} ${res.statusText}`;
        const text = await res.text().catch(() => "");
        const preview = text ? text.slice(0, 1200) : "<empty>";

        console.debug("[admin fetchList] endpoint:", endpoint, "status:", statusLine);
        console.debug("[admin fetchList] raw response preview:", preview);

        setStatus(`Tried ${endpoint} → ${statusLine}. Preview: ${preview.slice(0, 300)}${preview.length > 300 ? "…" : ""}`);

        if (!res.ok) {
          console.warn("[admin fetchList] non-OK response; trying next endpoint", { endpoint, statusLine });
          lastDebug = { endpoint, statusLine, preview };
          console.groupEnd();
          continue;
        }

        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (parseErr) {
          console.warn("[admin fetchList] JSON parse failed for", endpoint, parseErr);
          lastDebug = { endpoint, statusLine, preview, parseErr };
          console.groupEnd();
          continue;
        }

        let raw: any[] = [];
        if (Array.isArray(data)) raw = data;
        else if (Array.isArray(data.clients)) raw = data.clients;
        else if (Array.isArray(data.data)) raw = data.data;
        else if (Array.isArray(data.entries)) raw = data.entries;
        else if (data && typeof data === "object" && Object.keys(data).length > 0) raw = [data];
        else raw = [];

        console.debug("[admin fetchList] parsed raw length:", raw.length);

        const normalized = raw.map((item: any, idx: number) => ({
          id: String(item.id ?? item._id ?? item.client_id ?? item.clientId ?? item.slug ?? item.blog_slug ?? `tmp-${idx}`),
          client_name: item.client_name ?? item.clientName ?? item.name ?? "",
          logo_url: item.logo_url ?? item.logoUrl ?? item.logo ?? item.image ?? "",
          blog_title: item.blog_title ?? item.blogTitle ?? item.title ?? "",
          blog_slug: item.blog_slug ?? item.blogSlug ?? item.slug ?? "",
          blog_body_html: item.blog_body_html ?? item.blogBodyHtml ?? item.body ?? item.blogBody ?? "",
          blog_feature_image: item.blog_feature_image ?? item.blogFeatureImage ?? item.feature_image ?? "",
          cta_text: item.cta_text ?? item.ctaText ?? "Read full blog",
          images: item.images ?? item.imageUrls ?? undefined,
          videos: item.videos ?? item.videoUrls ?? item.videos_urls ?? undefined,
          body_data: item.body_data ?? undefined,
          created_at: item.created_at ?? item.createdAt ?? undefined,
        }));

        setList(normalized);
        setLoading(false);

        setStatus(`Loaded ${normalized.length} client(s) from ${endpoint} (status ${res.status})`);
        console.debug("[admin fetchList] normalized length:", normalized.length);
        console.groupEnd();
        return;
      } catch (err) {
        console.error("[admin fetchList] fetch error for", endpoint, err);
        lastDebug = { endpoint, err };
        console.groupEnd();
      }
    }

    setLoading(false);
    if (lastDebug) {
      console.error("[admin fetchList] all endpoints failed. last debug:", lastDebug);
      setStatus(`Failed to load clients. See console for details. Last try: ${JSON.stringify(lastDebug).slice(0, 600)}${JSON.stringify(lastDebug).length > 600 ? "…" : ""}`);
    } else {
      setStatus("No endpoints returned clients (empty result).");
    }
  }

  function openEdit(item: Partial<Client> | Record<string, any>) {
    const i: Record<string, any> = item as any;

    setEditing({
      id: String(i.id ?? i.client_id ?? i._id ?? i.clientId ?? i.slug ?? i.blog_slug ?? `tmp-edit-${Date.now()}`),
      client_name: i.client_name ?? i.clientName ?? i.name ?? "",
      blog_title: i.blog_title ?? i.blogTitle ?? i.title ?? "",
      blog_slug: i.blog_slug ?? i.blogSlug ?? i.slug ?? "",
      blog_body_html: i.blog_body_html ?? i.blogBodyHtml ?? i.body ?? "",
      logo_url: i.logo_url ?? i.logoUrl ?? i.logo ?? i.image ?? "",
      blog_feature_image: i.blog_feature_image ?? i.blogFeatureImage ?? i.feature_image ?? "",
      images: i.images ?? i.imageUrls ?? undefined,
      videos: i.videos ?? i.videoUrls ?? undefined,
      body_data: i.body_data ?? undefined,
    });
    setEditingLogoPreview(i.logo_url ?? i.logoUrl ?? i.logo ?? null);
    setEditingFeaturePreview(i.blog_feature_image ?? i.blogFeatureImage ?? i.feature_image ?? null);
    setEditingVideoPreview((i.videos && i.videos[0]) ?? (i.videoUrls && i.videoUrls[0]) ?? null);
  }

  async function readResponse(res: Response) {
    const text = await res.text().catch(() => "");
    let json: any = null;
    try {
      if (text) json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text };
  }

  function human(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  const CLIENT_MAX_MB = 8;
  const CLIENT_MAX_BYTES = CLIENT_MAX_MB * 1024 * 1024;

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Selected file:", file.name, "size:", human(file.size));
    if (file.size > CLIENT_MAX_BYTES) {
      alert(`File is too large: ${file.name} is ${human(file.size)}. Max allowed is ${CLIENT_MAX_MB}MB.`);
      e.target.value = "";
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const json = await res.json();
    console.log("upload response:", json);
  }

  function pickUrlFromResponse(json: any): string | null {
    if (!json) return null;
    if (typeof json === "string") return json;
    if (json.url) return String(json.url);
    if (json.publicUrl) return String(json.publicUrl);
    if (json.public_url) return String(json.public_url);
    if (json.data && (json.data.publicUrl || json.data.public_url)) return String(json.data.publicUrl || json.data.public_url);
    if (Array.isArray(json.urls) && json.urls.length > 0) return String(json.urls[0]);
    return null;
  }

  async function uploadFileToServer(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const { ok, status, json, text } = await readResponse(res);
    if (!ok) {
      const msg = (json && (json.error || json.message)) || text || `Upload failed (${status})`;
      throw new Error(msg);
    }
    const url = pickUrlFromResponse(json ?? text);
    if (!url) throw new Error("Upload did not return a usable url; check server response in console.");
    return url;
  }

  async function uploadFilesToServer(files: File[]) {
    if (!files || files.length === 0) return [] as string[];
    const limited = files.slice(0, 4);
    const urls: string[] = [];
    for (const f of limited) {
      const u = await uploadFileToServer(f);
      urls.push(u);
    }
    return urls;
  }

  async function handleDelete(item: Client) {
    if (!confirm(`Delete "${item.blog_title || item.client_name}"? This will remove images.`)) return;
    setStatus("Deleting...");
    try {
      const res = await fetch(`/api/admin/clients/${item.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json && (json.error || json.message)) || `Server returned ${res.status}`);
      setStatus("Deleted ✅");
      await fetchList();
    } catch (err: any) {
      console.error("handleDelete error:", err);
      setStatus("Delete failed: " + (err.message || "unknown"));
    }
  }

  async function handleEditFileInput(e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "feature" | "video") {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    try {
      if (type === "logo") setEditingLogoUploading(true);
      else if (type === "feature") setEditingFeatureUploading(true);
      else setEditingVideoUploading(true);
      setStatus(null);
      const url = await uploadFileToServer(file);
      if (type === "logo") {
        setEditingLogoPreview(url);
        setEditing({ ...editing, logo_url: url });
      } else if (type === "feature") {
        setEditingFeaturePreview(url);
        setEditing({ ...editing, blog_feature_image: url });
      } else {
        setEditingVideoPreview(url);
        setEditing({ ...editing, videos: [url, ...(editing.videos ?? []).slice(1)] });
      }
      setStatus(`Uploaded ${type}`);
    } catch (err: any) {
      console.error("handleEditFileInput error:", err);
      setStatus("Upload failed: " + (err?.message || "unknown"));
    } finally {
      if (type === "logo") setEditingLogoUploading(false);
      else if (type === "feature") setEditingFeatureUploading(false);
      else setEditingVideoUploading(false);
    }
  }

  async function saveEdit(updated: Client) {
    if (!updated?.id) return;
    setStatus("Saving...");
    try {
      const payload: any = {
        client_name: updated.client_name,
        blog_title: updated.blog_title,
        blog_slug: updated.blog_slug,
        blog_body_html: updated.blog_body_html ?? blogBody ?? undefined,
        cta_text: updated.cta_text,
        images: updated.images !== undefined ? updated.images : undefined,
        // IMPORTANT: include videos explicitly if present on the editing object.
        videos: (updated as any).videos !== undefined ? (updated as any).videos ?? [] : undefined,
        body_data: updated.body_data || undefined,
        blog_feature_image: updated.blog_feature_image || undefined,
      };
      if (updated.logo_url) payload.logo_url = updated.logo_url;
      if (updated.blog_feature_image) payload.blog_feature_image = updated.blog_feature_image;

      const res = await fetch(`/api/admin/clients/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json && (json.error || json.message)) || `Server returned ${res.status}`);
      setEditing(null);
      setEditingLogoPreview(null);
      setEditingFeaturePreview(null);
      setEditingVideoPreview(null);
      setStatus("Saved ✅");
      await fetchList();
    } catch (err: any) {
      console.error("saveEdit error:", err);
      setStatus("Save failed: " + (err?.message || "unknown"));
    }
  }

  function onFilesChange(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4);
    setSelectedFiles(arr);

    const urls = arr.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => {
      prev.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
      return urls;
    });

    setStatus(arr.length ? `${arr.length} image(s) selected (max 4)` : null);
  }

  function onVideosChange(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4);
    setSelectedVideos(arr);

    const urls = arr.map((f) => URL.createObjectURL(f));
    setVideoPreviews((prev) => {
      prev.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
      return urls;
    });

    setStatus(arr.length ? `${arr.length} video(s) selected (max 4)` : null);
  }

  function slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-_\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !blogTitle.trim()) {
      setStatus("Please fill required fields (client name & blog title).");
      return;
    }
    if (!logoUrl && selectedFiles.length === 0) {
      setStatus("Please upload a logo (required) or select files to include.");
      return;
    }

    setStatus("Creating...");
    setUploadingFiles(true);

    try {
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrls: string[] = [];

      if (selectedFiles.length > 0) {
        uploadedImageUrls = await uploadFilesToServer(selectedFiles);
      }
      if (selectedVideos.length > 0) {
        uploadedVideoUrls = await uploadFilesToServer(selectedVideos);
      }

      let logoUrlLocal = logoUrl || "";
      if (!logoUrlLocal && uploadedImageUrls.length > 0) logoUrlLocal = uploadedImageUrls[0];

      const payload: any = {
        client_name: clientName.trim(),
        logo_url: logoUrlLocal || undefined,
        blog_title: blogTitle.trim(),
        blog_slug: slugify(blogTitle),
        cta_text: ctaText || undefined,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        videos: uploadedVideoUrls.length > 0 ? uploadedVideoUrls : undefined,
        body_data: undefined,
        blog_body_html: blogBody || undefined,
        blog_feature_image: featureImageUrl || (uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : undefined),
      };

      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const { ok, status: resStatus, json, text } = await readResponse(res);
      if (!ok) {
        const serverMsg = (json && (json.error || json.message)) || text || `Server returned ${resStatus}`;
        throw new Error(serverMsg);
      }

      setStatus("✅ Created new blog");
      setClientName("");
      setBlogTitle("");
      setBlogBody("");
      setCtaText("Read full blog");
      setSelectedFiles([]);
      setPreviews([]);
      setSelectedVideos([]);
      setVideoPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      setLogoUrl("");
      setFeatureImageUrl("");
      await fetchList();
    } catch (err: any) {
      console.error("Create failed (final):", err);
      setStatus("Create failed: " + (err?.message || "unknown"));
    } finally {
      setUploadingFiles(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-4">Admin — Manage Clients & Blogs</h1>

        <form onSubmit={handleCreate} className="bg-white shadow p-6 rounded space-y-4">
          <h2 className="font-semibold text-lg">Add New Client + Blog</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Client Name *</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>

            <div>
              <label className="block text-sm font-medium">Blog Title *</label>
              <input value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Blog Body *</label>

            <SimpleEditor value={blogBody} onChange={(html) => setBlogBody(html)} placeholder="Start typing your blog..." />
            <p className="text-xs text-gray-500 mt-1">HTML saved to <code>blog_body_html</code>. Use the toolbar above to format text.</p>

            <style>{`
              div[contenteditable] ul {
                padding-left: 2rem;
                margin: 0.5rem 0;
              }
              div[contenteditable] li {
                margin: 0.25rem 0;
                line-height: 1.4;
              }
              div[contenteditable] * { direction: ltr !important; unicode-bidi: embed !important; }
            `}</style>
          </div>

          {/* images */}
          <div>
            <label className="block text-sm font-medium">Images (1–4) — optional</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => onFilesChange(e.target.files)} />
            <div className="mt-3 flex gap-3">
              {previews.map((src, idx) => (
                <div key={idx} className="w-28 h-28 relative border overflow-hidden rounded">
                  <Image src={src} alt={`preview-${idx}`} fill style={{ objectFit: "cover" }} />
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">{selectedFiles.length} image(s) selected (max 4).</div>
          </div>

          {/* videos */}
          <div>
            <label className="block text-sm font-medium">Videos (0–4) — optional</label>
            <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={(e) => onVideosChange(e.target.files)} />
            <div className="mt-3 flex gap-3">
              {videoPreviews.map((src, idx) => (
                <div key={idx} className="w-36 h-24 border rounded overflow-hidden">
                  <video src={src} controls className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">{selectedVideos.length} video(s) selected (max 4).</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Logo (required)</label>
              {logoUrl ? (
                <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                  <Image src={logoUrl} alt="logo" fill style={{ objectFit: "contain" }} sizes="112px" />
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingLogo(true);
                  try {
                    const url = await uploadFileToServer(file);
                    setLogoUrl(url);
                    setStatus("Logo uploaded");
                  } catch (err: any) {
                    console.error("Logo upload error:", err);
                    setStatus("Upload failed: " + (err?.message || err));
                  } finally {
                    setUploadingLogo(false);
                  }
                }} />
              )}
              {uploadingLogo && <div className="text-xs text-gray-500">Uploading...</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Feature Image (optional)</label>
              {featureImageUrl ? (
                <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                  <Image src={featureImageUrl} alt="feature" fill style={{ objectFit: "contain" }} sizes="112px" />
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingFeature(true);
                  try {
                    const url = await uploadFileToServer(file);
                    setFeatureImageUrl(url);
                    setStatus("Feature image uploaded");
                  } catch (err: any) {
                    console.error("Feature upload error:", err);
                    setStatus("Upload failed: " + (err?.message || err));
                  } finally {
                    setUploadingFeature(false);
                  }
                }} />
              )}
              {uploadingFeature && <div className="text-xs text-gray-500">Uploading...</div>}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={uploadingFiles} className="px-4 py-2 bg-orange-500 text-white rounded">
              {uploadingFiles ? "Creating…" : "Create"}
            </button>
          </div>
        </form>

        {/* Existing clients list */}
        <div>
          <h2 className="font-semibold text-lg mb-2">Existing Clients</h2>
          {loading ? <div>Loading…</div> : list.length === 0 ? <div>No clients found.</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {list.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded shadow flex gap-4">
                  <div className="w-28 h-20 relative flex-shrink-0">
                    {c.logo_url ? <Image src={c.logo_url} alt={c.client_name || "logo"} fill style={{ objectFit: "contain" }} sizes="112px" /> : <div className="bg-gray-100 w-full h-full flex items-center justify-center text-xs text-gray-400">No logo</div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-600">{c.client_name}</div>
                        <div className="font-semibold">{c.blog_title}</div>
                        <div className="text-xs text-gray-500">{c.blog_slug}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="px-2 py-1 bg-blue-500 text-white text-sm rounded">Edit</button>
                        <button onClick={() => handleDelete(c)} className="px-2 py-1 bg-red-500 text-white text-sm rounded">Delete</button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-700 line-clamp-3" dangerouslySetInnerHTML={{ __html: c.blog_body_html || "" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {status && <div className="text-sm mt-4 text-gray-700">{status}</div>

        }
        {/* Edit modal rendered below (kept same layout as earlier segment) */}
        {editing && (
  <div
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    role="dialog"
    aria-modal="true"
    onClick={() => setEditing(null)}
  >
    <div
      className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Edit — {editing.blog_title}</h3>
        <button
          aria-label="Close"
          onClick={() => setEditing(null)}
          className="rounded-full bg-gray-100 hover:bg-gray-200 w-9 h-9 flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-4 overflow-auto" style={{ maxHeight: "calc(80vh - 112px)" }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Client Name</label>
            <input
              value={editing.client_name || ""}
              onChange={(e) => setEditing({ ...editing, client_name: e.target.value })}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Blog Title</label>
            <input
              value={editing.blog_title || ""}
              onChange={(e) => setEditing({ ...editing, blog_title: e.target.value })}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Blog Body (HTML/text)</label>
            <div className="border rounded" style={{ height: "240px", overflow: "auto", padding: 8, background: "white" }}>
              <SimpleEditor
                value={editing.blog_body_html || ""}
                onChange={(html) => setEditing({ ...editing, blog_body_html: html })}
                placeholder="Start typing the blog..."
              />
            </div>
          </div>

          {/* Existing images */}
          <div>
            <label className="block text-sm font-medium mb-2">Existing Images</label>
            {(!editing.images || editing.images.length === 0) ? (
              <div className="text-xs text-gray-500">No images attached.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {(editing.images || []).map((src, idx) => (
                  <div key={idx} className="relative w-full h-24 rounded overflow-hidden border">
                    <div className="absolute right-2 top-2 z-20">
                      <button
                        onClick={() => {
                          const next = (editing.images || []).filter((_, i) => i !== idx);
                          setEditing({ ...editing, images: next.length ? next : undefined });
                        }}
                        className="rounded-full bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center shadow"
                        title="Remove image"
                        aria-label={`Remove image ${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="w-full h-full relative">
                      <Image src={src} alt={`image-${idx}`} fill style={{ objectFit: "cover" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image upload (keep existing) */}
          <div>
            <label className="block text-sm font-medium">Add Images (1–4) — optional</label>
            <input type="file" accept="image/*" multiple onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const newUrls = Array.from(files).map((f) => URL.createObjectURL(f));
              setEditing({ ...editing, images: [...(editing.images || []), ...newUrls] });
            }} />
            <div className="text-xs text-gray-500 mt-1">{(editing.images || []).length} image(s) attached.</div>
          </div>

          {/* Existing videos */}
          <div>
            <label className="block text-sm font-medium mb-2">Existing Videos</label>
            {(!editing.videos || editing.videos.length === 0) ? (
              <div className="text-xs text-gray-500">No videos attached.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(editing.videos || []).map((src, idx) => (
                  <div key={idx} className="relative w-full h-28 rounded overflow-hidden border bg-black/5 flex items-center justify-center">
                    <div className="absolute right-2 top-2 z-20">
                      <button
                        onClick={() => {
                          const next = (editing.videos || []).filter((_, i) => i !== idx);
                          // if user removed last video, explicitly set an empty array so backend receives videos: []
                          setEditing({ ...editing, videos: next.length ? next : [] });
                        }}
                        className="rounded-full bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center shadow"
                        title="Remove video"
                        aria-label={`Remove video ${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>

                    <video src={src} controls className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video upload (keep existing) */}
          <div>
            <label className="block text-sm font-medium">Add Videos — optional</label>
            <input type="file" accept="video/*" multiple onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const newUrls = Array.from(files).map((f) => URL.createObjectURL(f));
              setEditing({ ...editing, videos: [...(editing.videos || []), ...newUrls] });
            }} />
            <div className="text-xs text-gray-500 mt-1">{(editing.videos || []).length || 0} video(s) attached.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-end gap-2">
        <button onClick={() => setEditing(null)} className="px-3 py-1 bg-gray-200 rounded">
          Cancel
        </button>
        <button onClick={() => saveEdit(editing)} className="px-3 py-1 bg-green-600 text-white rounded">
          Save
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}
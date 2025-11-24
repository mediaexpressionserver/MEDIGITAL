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
  logo_url?: string | null;
  blog_title?: string;
  blog_slug?: string;
  blog_body_html?: string;
  blog_feature_image?: string | null;
  cta_text?: string;
  created_at?: string;
  images?: string[];
  videos?: string[];
  // blog2 fields
  blog2_title?: string;
  blog2_slug?: string;
  blog2_body_html?: string;
  blog2_feature_image?: string | null;
  blog2_images?: string[];
  blog2_videos?: string[];
  body_data?: any;
  // source indicates which backend/table this row came from
  source?: "clients" | "clients_blog2";
};

/* ---------- component ---------- */
export default function AdminPage() {
  const [list, setList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);

  /* ----- Client create states ----- */
  const [clientName1, setClientName1] = useState("");
  const [blogTitle1, setBlogTitle1] = useState("");
  const [blogBody1, setBlogBody1] = useState(""); // HTML
  const [ctaText1, setCtaText1] = useState("Read full Case study");

  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const videoInputRef1 = useRef<HTMLInputElement | null>(null);

  const [selectedFiles1, setSelectedFiles1] = useState<File[]>([]);
  const [previews1, setPreviews1] = useState<string[]>([]);
  const [selectedVideos1, setSelectedVideos1] = useState<File[]>([]);
  const [videoPreviews1, setVideoPreviews1] = useState<string[]>([]);
  const [logoUrl1, setLogoUrl1] = useState("");
  const [featureImageUrl1, setFeatureImageUrl1] = useState("");
  const [uploadingLogo1, setUploadingLogo1] = useState(false);
  const [uploadingFeature1, setUploadingFeature1] = useState(false);

  /* ----- Blog create states (completely separate) ----- */
  const [clientName2, setClientName2] = useState("");
  const [blogTitle2, setBlogTitle2] = useState("");
  const [blogBody2, setBlogBody2] = useState(""); // HTML for blog2

  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const videoInputRef2 = useRef<HTMLInputElement | null>(null);

  const [selectedFiles2, setSelectedFiles2] = useState<File[]>([]);
  const [previews2, setPreviews2] = useState<string[]>([]);
  const [selectedVideos2, setSelectedVideos2] = useState<File[]>([]);
  const [videoPreviews2, setVideoPreviews2] = useState<string[]>([]);
  const [logoUrl2, setLogoUrl2] = useState("");
  const [featureImageUrl2, setFeatureImageUrl2] = useState("");
  const [uploadingLogo2, setUploadingLogo2] = useState(false);
  const [uploadingFeature2, setUploadingFeature2] = useState(false);

  /* ----- editing helpers ----- */
  const [editingLogoUploading, setEditingLogoUploading] = useState(false);
  const [editingFeatureUploading, setEditingFeatureUploading] = useState(false);
  const [editingVideoUploading, setEditingVideoUploading] = useState(false);
  const [editingLogoPreview, setEditingLogoPreview] = useState<string | null>(null);
  const [editingFeaturePreview, setEditingFeaturePreview] = useState<string | null>(null);
  const [editingVideoPreview, setEditingVideoPreview] = useState<string | null>(null);
  const [editingBlogFeatureUploading, setEditingBlogFeatureUploading] = useState(false);
  const [editingBlogFeaturePreview, setEditingBlogFeaturePreview] = useState<string | null>(null);

  const [lastPayload, setLastPayload] = useState<any | null>(null);
  const [lastResponse, setLastResponse] = useState<any | null>(null);

  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Per-field uploading indicators (create + edit)
  const [uploadingImages1, setUploadingImages1] = useState(false);
  const [uploadingVideos1, setUploadingVideos1] = useState(false);
  const [uploadingImages2, setUploadingImages2] = useState(false);
  const [uploadingVideos2, setUploadingVideos2] = useState(false);
  const [editingUploadingImages, setEditingUploadingImages] = useState(false);
  const [editingUploadingVideos, setEditingUploadingVideos] = useState(false);

  useEffect(() => {
    fetchList();

    return () => {
      // revoke object URLs for all previews
      [...previews1, ...previews2].forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
      [...videoPreviews1, ...videoPreviews2].forEach((p) => {
        try {
          // revoke only blob: URLs (server URLs shouldn't be revoked)
          if (p && p.startsWith("blob:")) URL.revokeObjectURL(p);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------ API helpers ------------------ */
  async function uploadFileToServer(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const { ok, status, json, text } = await readResponse(res);
    if (!ok) {
      const msg = (json && (json.error || json.message)) || text || `Upload failed (${status})`;
      throw new Error(msg);
    }
    // try to pick url
    const payload = json ?? (text ? JSON.parse(text) : null);
    if (!payload) throw new Error("Upload returned no payload");
    if (typeof payload === "string") return payload;
    if (payload.url) return String(payload.url);
    if (payload.publicUrl) return String(payload.publicUrl);
    if (payload.public_url) return String(payload.public_url);
    if (payload.data?.publicUrl) return String(payload.data.publicUrl);
    if (Array.isArray(payload.urls) && payload.urls.length) return String(payload.urls[0]);
    // fallback: return raw JSON as string (unlikely)
    throw new Error("Upload response didn't contain a usable URL");
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

  async function uploadFilesAndReplaceState(files: FileList | File[], stateKey: 'images' | 'videos' | 'blog2_images' | 'blog2_videos') {
    const arr = Array.from(files);
    const tempUrls = arr.map((f) => URL.createObjectURL(f));
    setEditing((prev) => (prev ? { ...prev, [stateKey]: [...(prev[stateKey] || []), ...tempUrls] } : prev));
    try {
      const uploaded = await uploadFilesToServer(arr);
      setEditing((prev) => {
        if (!prev) return prev;
        const existing = (prev[stateKey] || []).filter((s: string) => !s.startsWith("blob:"));
        return { ...prev, [stateKey]: [...existing, ...uploaded] };
      });
      tempUrls.forEach((u) => { try { if (u.startsWith("blob:")) URL.revokeObjectURL(u); } catch {} });
      setStatus(`Uploaded ${uploaded.length} file(s)`);
    } catch (err: any) {
      console.error("upload error:", err);
      setStatus("Upload failed: " + (err?.message || "unknown"));
    }
  }

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
        const res = await fetch(endpoint, {
          method: "GET",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const text = await res.text().catch(() => "");
        if (!res.ok) {
          lastDebug = { endpoint, status: res.status, preview: text?.slice(0, 500) ?? "" };
          continue;
        }
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          lastDebug = { endpoint, parseError: true, preview: text?.slice(0, 500) ?? "" };
          continue;
        }

        let raw: any[] = [];
        if (Array.isArray(data)) raw = data;
        else if (Array.isArray(data.clients)) raw = data.clients;
        else if (Array.isArray(data.data)) raw = data.data;
        else if (data && typeof data === "object" && Object.keys(data).length > 0) raw = [data];

        const normalized = raw.map((item: any, idx: number) => ({
          id: String(item.id ?? item._id ?? item.client_id ?? item.clientId ?? item.slug ?? item.blog_slug ?? `tmp-${idx}`),
          client_name: item.client_name ?? item.clientName ?? item.name ?? "",
          logo_url: item.logo_url ?? item.logoUrl ?? item.logo ?? item.image ?? "",
          blog_title: item.blog_title ?? item.blogTitle ?? item.title ?? "",
          blog_slug: item.blog_slug ?? item.blogSlug ?? item.slug ?? "",
          blog_body_html: item.blog_body_html ?? item.blogBodyHtml ?? item.body ?? item.blogBody ?? "",
          blog_feature_image: item.blog_feature_image ?? item.blogFeatureImage ?? item.feature_image ?? null,
          cta_text: item.cta_text ?? item.ctaText ?? "Read full Case study",
          images: item.images ?? item.imageUrls ?? undefined,
          videos: item.videos ?? item.videoUrls ?? item.videos_urls ?? undefined,
          blog2_title: item.blog2_title ?? item.blog2Title ?? undefined,
          blog2_slug: item.blog2_slug ?? item.blog2Slug ?? undefined,
          blog2_body_html: item.blog2_body_html ?? item.blog2BodyHtml ?? undefined,
          blog2_feature_image: item.blog2_feature_image ?? item.blog2FeatureImage ?? undefined,
          blog2_images: item.blog2_images ?? item.blog2Images ?? undefined,
          blog2_videos: item.blog2_videos ?? item.blog2Videos ?? undefined,
          body_data: item.body_data ?? undefined,
          created_at: item.created_at ?? item.createdAt ?? undefined,
          source: "clients" as const,
        }));

        // set initial list from whichever candidate responded first
        setList(normalized);
        setLoading(false);
        setStatus(`Loaded ${normalized.length} client(s) from ${endpoint} (status ${res.status})`);

        // Now also try to fetch clients_blog2 and merge (non-blocking)
        try {
          const res2 = await fetch("/api/admin/clients_blog2", {
            method: "GET",
            credentials: "same-origin",
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          if (res2.ok) {
            const data2 = await res2.json().catch(() => []);
            if (Array.isArray(data2) && data2.length) {
              const blog2Normalized = data2.map((r: any) => ({
                id: String(r.id),
                client_name: r.client_name ?? r.clientName ?? r.name ?? "",
                logo_url: r.logo_url ?? r.logoUrl ?? r.logo ?? r.image ?? "",
                blog2_title: r.blog2_title ?? r.blog2Title ?? "",
                blog2_slug: r.blog2_slug ?? r.blog2Slug ?? "",
                blog2_body_html: r.blog2_body_html ?? r.blog2BodyHtml ?? r.blog_body_html ?? "",
                blog2_feature_image: r.blog2_feature_image ?? r.blog2FeatureImage ?? (r.blog2_images && r.blog2_images[0]) ?? null,
                blog2_images: Array.isArray(r.blog2_images) ? r.blog2_images : [],
                blog2_videos: Array.isArray(r.blog2_videos) ? r.blog2_videos : [],
                created_at: r.created_at ?? r.createdAt ?? null,
                source: "clients_blog2" as const,
              }));

              const existingIds = new Set(normalized.map((x: any) => x.id));
              const combined = [...normalized, ...blog2Normalized.filter((r: any) => !existingIds.has(r.id))];
              setList(combined);
              setStatus((s) => (s ? s + " + blog2 loaded" : `Loaded ${combined.length} clients including blog2`));
            }
          } else {
            // ignore non-OK for blog2 (optional)
          }
        } catch (err) {
          console.warn("fetch /api/admin/clients_blog2 failed:", err);
        }

        return;
      } catch (err) {
        lastDebug = { endpoint, err };
      }
    }

    setLoading(false);
    setStatus(lastDebug ? `Failed to load clients. See console.` : "No endpoints returned clients.");
    console.error("fetchList last debug:", lastDebug);
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
      blog_feature_image: i.blog_feature_image ?? i.blogFeatureImage ?? i.feature_image ?? null,
      images: i.images ?? i.imageUrls ?? undefined,
      videos: i.videos ?? i.videoUrls ?? undefined,
      blog2_title: i.blog2_title ?? i.blog2Title ?? undefined,
      blog2_slug: i.blog2_slug ?? i.blog2Slug ?? undefined,
      blog2_body_html: i.blog2_body_html ?? i.blog2BodyHtml ?? undefined,
      blog2_feature_image: i.blog2_feature_image ?? i.blog2FeatureImage ?? null,
      blog2_images: i.blog2_images ?? i.blog2Images ?? undefined,
      blog2_videos: i.blog2_videos ?? i.blog2Videos ?? undefined,
      body_data: i.body_data ?? undefined,
      // IMPORTANT: preserve which source this row came from so modal can branch
      source: (i.source as any) ?? (i.blog2_title || i.blog2_body_html ? "clients_blog2" : "clients"),
    });

    setEditingLogoPreview(i.logo_url ?? i.logoUrl ?? i.logo ?? null);
    setEditingFeaturePreview(i.blog_feature_image ?? i.blogFeatureImage ?? i.feature_image ?? null);
    setEditingVideoPreview((i.videos && i.videos[0]) ?? null);
    setEditingBlogFeaturePreview(i.blog2_feature_image ?? i.blog2FeatureImage ?? null);
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

  function sanitizeUrls(arr?: string[] | null) {
    if (!arr) return undefined;
    return arr.filter((u) => !!u && !String(u).startsWith("blob:"));
  }

  const CLIENT_MAX_MB = 8;
  const CLIENT_MAX_BYTES = CLIENT_MAX_MB * 1024 * 1024;

  /* ------------------ upload helpers ------------------ */

  /* ------------------ create handlers (separate) ------------------ */

  // Create Client only (does NOT send blog2 fields)
  async function handleCreateClient(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!clientName1.trim() || !blogTitle1.trim()) {
      setStatus("Please fill required fields (client name & blog title).");
      return;
    }
    if (!logoUrl1 && selectedFiles1.length === 0 && previews1.length === 0) {
      setStatus("Please upload a logo (required) or select files to include.");
      return;
    }
    // prevent creating while related uploads (logo/feature) are in progress
    if (uploadingLogo1 || uploadingFeature1 || uploadingImages1 || uploadingVideos1) {
      setStatus('Please wait for logo/feature/image/video uploads to finish before creating.');
      return;
    }
    setStatus("Creating Client Case Study...");
    setUploadingFiles(true);

    try {
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrls: string[] = [];

      // If images were already uploaded during selection, use those previews (they contain public URLs).
      if (previews1.length > 0 && selectedFiles1.length === 0) {
        uploadedImageUrls = sanitizeUrls(previews1) || [];
      } else if (selectedFiles1.length > 0) {
        uploadedImageUrls = await uploadFilesToServer(selectedFiles1);
      }
      if (selectedVideos1.length > 0) uploadedVideoUrls = await uploadFilesToServer(selectedVideos1);

      let logoToSend = (logoUrl1 && !String(logoUrl1).startsWith('blob:')) ? logoUrl1 : (sanitizeUrls(uploadedImageUrls) ? sanitizeUrls(uploadedImageUrls)![0] : undefined);

      const payload: any = {
        client_name: clientName1.trim(),
        logo_url: logoToSend,
        blog_title: blogTitle1.trim(),
        blog_slug: slugify(blogTitle1),
        cta_text: ctaText1 || undefined,
        images: sanitizeUrls(uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined),
        videos: sanitizeUrls(uploadedVideoUrls.length > 0 ? uploadedVideoUrls : undefined),
        blog_body_html: blogBody1 || "", // ensure non-null to avoid DB constraint
        blog_feature_image: (featureImageUrl1 && !String(featureImageUrl1).startsWith('blob:')) ? featureImageUrl1 : (sanitizeUrls(uploadedImageUrls) ? sanitizeUrls(uploadedImageUrls)![0] : undefined),
        created_at: new Date().toISOString(),
      };
      // Also include legacy key name for servers that expect `feature_image`
      payload.feature_image = payload.blog_feature_image ?? payload.feature_image;

      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const { ok, json, text, status: st } = await readResponse(res);
      console.debug("[Admin] handleCreateClient response:", { ok, status: st, json, text });

      // If server returned an object with the created client, try to read its feature image and set local state.
      const created = (json && (json.data || json.client || json.item)) || json;
      if (created && typeof created === "object") {
        const feature = created.blog_feature_image ?? created.feature_image ?? created.blogFeatureImage ?? null;
        if (feature) {
          setFeatureImageUrl1(String(feature));
          console.debug("[Admin] handleCreateClient - detected saved feature image:", feature);
        }
      }

      if (!ok) throw new Error((json && (json.error || json.message)) || text || `Server returned ${st}`);

      setStatus("✅ Created Client Case Study");
      // reset Client form
      setClientName1("");
      setBlogTitle1("");
      setBlogBody1("");
      setCtaText1("Read full Case study");
      setSelectedFiles1([]);
      setPreviews1([]);
      setSelectedVideos1([]);
      setVideoPreviews1([]);
      if (fileInputRef1.current) fileInputRef1.current.value = "";
      if (videoInputRef1.current) videoInputRef1.current.value = "";
      setLogoUrl1("");
      setFeatureImageUrl1("");
      await fetchList();
    } catch (err: any) {
      console.error("handleCreateClient error:", err);
      setStatus("Create failed: " + (err?.message || "unknown"));
    } finally {
      setUploadingFiles(false);
    }
  }

  // Create Blog only (does NOT send blog1 fields)
  async function handleCreateBlog(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!clientName2.trim() || !blogTitle2.trim()) {
      setStatus("Please fill required fields for Blog (client & title).");
      return;
    }
    // prevent creating while related uploads (logo/feature) are in progress
    if (uploadingLogo2 || uploadingFeature2 || uploadingImages2 || uploadingVideos2) {
      setStatus('Please wait for logo/feature/image/video uploads to finish before creating.');
      return;
    }
    setStatus("Creating Blog...");
    setUploadingFiles(true);

    try {
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrls: string[] = [];

      if (selectedFiles2.length > 0) uploadedImageUrls = await uploadFilesToServer(selectedFiles2);
      if (selectedVideos2.length > 0) uploadedVideoUrls = await uploadFilesToServer(selectedVideos2);

      // Build payload (include top-level blog_title for server validation)
      const payload: any = {
        client_name: clientName2.trim(),
        blog_title: blogTitle2.trim(), // required by server validation in your route
        blog_slug: slugify(blogTitle2),
        logo_url: (logoUrl2 && !String(logoUrl2).startsWith('blob:')) ? logoUrl2 : (sanitizeUrls(uploadedImageUrls) ? sanitizeUrls(uploadedImageUrls)![0] : undefined),
        // blog2-specific fields (kept separate)
        blog2_title: blogTitle2.trim(),
        blog2_slug: slugify(blogTitle2),
        blog2_body_html: blogBody2 || undefined,
        blog2_feature_image: (featureImageUrl2 && !String(featureImageUrl2).startsWith('blob:')) ? featureImageUrl2 : (sanitizeUrls(uploadedImageUrls) ? sanitizeUrls(uploadedImageUrls)![0] : undefined),
        blog2_images: sanitizeUrls(uploadedImageUrls.length ? uploadedImageUrls : undefined),
        blog2_videos: sanitizeUrls(uploadedVideoUrls.length ? uploadedVideoUrls : undefined),
        // important: ensure top-level blog_body_html is never null (db constraint).
        blog_body_html: "",
        created_at: new Date().toISOString(),
      };
      // Also set legacy and top-level feature keys so backend accepts the feature image
      payload.feature_image = payload.blog2_feature_image ?? payload.blog_feature_image ?? payload.feature_image;

      // <<< DEBUG: print payload so you can confirm what's actually being sent
      console.debug("[Admin] handleCreateBlog payload:", payload);

      const res = await fetch("/api/admin/clients_blog2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // <<< DEBUG: read raw response and log details
      const rawText = await res.text().catch(() => "");
      let jsonBody = null;
      try {
        jsonBody = rawText ? JSON.parse(rawText) : null;
      } catch {}
      console.debug("[Admin] handleCreateBlog response status:", res.status, res.statusText);
      console.debug("[Admin] handleCreateBlog response body:", rawText, jsonBody);

      if (!res.ok) {
        // try to show server-provided message when possible
        const serverMsg = (jsonBody && (jsonBody.error || jsonBody.message)) || rawText || `Server returned ${res.status}`;
        throw new Error(serverMsg);
      }

      // If server returned an object with the created blog, update local state for feature image
      const created = (jsonBody && (jsonBody.data || jsonBody.client || jsonBody.item)) || jsonBody;
      if (created && typeof created === "object") {
        const feature = created.blog2_feature_image ?? created.blog_feature_image ?? created.feature_image ?? created.blog2FeatureImage ?? null;
        if (feature) {
          setFeatureImageUrl2(String(feature));
          console.debug("[Admin] handleCreateBlog - detected saved feature image:", feature);
        }
      }

      setStatus("✅ Created Blog");
      // reset Blog form
      setClientName2("");
      setBlogTitle2("");
      setBlogBody2("");
      setSelectedFiles2([]);
      setPreviews2([]);
      setSelectedVideos2([]);
      setVideoPreviews2([]);
      if (fileInputRef2.current) fileInputRef2.current.value = "";
      if (videoInputRef2.current) videoInputRef2.current.value = "";
      setLogoUrl2("");
      setFeatureImageUrl2("");
      await fetchList();
    } catch (err: any) {
      console.error("handleCreateBlog error:", err);
      // make UI error include the server message if we have one
      setStatus("Create Blog failed: " + (err?.message || "unknown") + " — check console/network tab for full response.");
    } finally {
      setUploadingFiles(false);
    }
  }

  /* ------------------ helpers for selecting files ------------------ */

  function onFilesChange1(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4);
    setSelectedFiles1(arr);

    // immediate previews for UX
    const tempUrls = arr.map((f) => URL.createObjectURL(f));
    setPreviews1((prev) => {
      prev.forEach((p) => {
        try { if (p && p.startsWith('blob:')) URL.revokeObjectURL(p); } catch {}
      });
      return tempUrls;
    });
    setStatus(arr.length ? `${arr.length} image(s) selected for Client` : null);

    // upload immediately and replace previews with server URLs
    (async () => {
      setUploadingImages1(true);
      setUploadingFiles(true);
      try {
        const uploaded = await uploadFilesToServer(arr);
        // revoke temporary blob URLs
        tempUrls.forEach((u) => { try { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); } catch {} });
        // replace previews with uploaded public URLs
        setPreviews1(uploaded);
        // clear selectedFiles1 to avoid double-upload later
        setSelectedFiles1([]);
        setStatus(`Uploaded ${uploaded.length} image(s)`);
      } catch (err: any) {
        console.error('onFilesChange1 upload error:', err);
        setStatus('Image upload failed: ' + (err?.message || 'unknown'));
        // keep blob previews so user can retry
      } finally {
        setUploadingImages1(false);
        setUploadingFiles(false);
      }
    })();
  }

  async function onVideosChange1(files: FileList | null) {
    if (!files) return;
    setUploadingVideos1(true);
    setUploadingFiles(true);
    const arr = Array.from(files).slice(0, 4);
    setSelectedVideos1(arr);

    // show immediate blob previews so user sees something
    const tempUrls = arr.map((f) => URL.createObjectURL(f));
    setVideoPreviews1((prev) => {
      prev.forEach((p) => {
        try {
          if (p && p.startsWith("blob:")) URL.revokeObjectURL(p);
        } catch {}
      });
      return tempUrls;
    });
    setStatus(`Uploading ${arr.length} video(s)...`);

    try {
      const uploaded = await uploadFilesToServer(arr);
      // replace previews with server URLs, revoke blobs
      tempUrls.forEach((t) => {
        try {
          if (t && t.startsWith("blob:")) URL.revokeObjectURL(t);
        } catch {}
      });
      setVideoPreviews1(uploaded);
      setStatus(`Uploaded ${uploaded.length} video(s)`);
    } catch (err: any) {
      console.error("onVideosChange1 upload error:", err);
      setStatus("Video upload failed: " + (err?.message || "unknown"));
      // keep blob previews so user can retry upload or inspect
    } finally {
      setUploadingVideos1(false);
      setUploadingFiles(false);
    }
  }

  function onFilesChange2(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4);
    setSelectedFiles2(arr);
    const tempUrls = arr.map((f) => URL.createObjectURL(f));
    setPreviews2((prev) => {
      prev.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
      return tempUrls;
    });
    setStatus(arr.length ? `${arr.length} image(s) selected for Blog` : null);

    (async () => {
      setUploadingImages2(true);
      setUploadingFiles(true);
      try {
        const uploaded = await uploadFilesToServer(arr);
        tempUrls.forEach((u) => { try { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); } catch {} });
        setPreviews2(uploaded);
        setSelectedFiles2([]);
        setStatus(`Uploaded ${uploaded.length} image(s)`);
      } catch (err: any) {
        console.error('onFilesChange2 upload error:', err);
        setStatus('Image upload failed: ' + (err?.message || 'unknown'));
      } finally {
        setUploadingImages2(false);
        setUploadingFiles(false);
      }
    })();
  }

  async function onVideosChange2(files: FileList | null) {
    if (!files) return;
    setUploadingVideos2(true);
    setUploadingFiles(true);
    const arr = Array.from(files).slice(0, 4);
    setSelectedVideos2(arr);

    // show immediate blob previews
    const tempUrls = arr.map((f) => URL.createObjectURL(f));
    setVideoPreviews2((prev) => {
      prev.forEach((p) => {
        try {
          if (p && p.startsWith("blob:")) URL.revokeObjectURL(p);
        } catch {}
      });
      return tempUrls;
    });
    setStatus(`Uploading ${arr.length} video(s)...`);

    try {
      const uploaded = await uploadFilesToServer(arr);
      tempUrls.forEach((t) => {
        try {
          if (t && t.startsWith("blob:")) URL.revokeObjectURL(t);
        } catch {}
      });
      setVideoPreviews2(uploaded);
      setStatus(`Uploaded ${uploaded.length} video(s)`);
    } catch (err: any) {
      console.error("onVideosChange2 upload error:", err);
      setStatus("Video upload failed: " + (err?.message || "unknown"));
    } finally {
      setUploadingVideos2(false);
      setUploadingFiles(false);
    }
  }

  function slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-_\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
  }

  /* ------------------ delete + edit helpers ------------------ */

  async function handleDelete(item: Client) {
    if (!confirm(`Delete "${item.blog_title || item.blog2_title || item.client_name}"? This will remove images.`)) return;
    setStatus("Deleting...");
    try {
      const base = item.source === "clients_blog2" ? "/api/admin/clients_blog2" : "/api/admin/clients";
      const res = await fetch(`${base}/${item.id}`, { method: "DELETE" });
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
        setEditing((prev) => (prev ? { ...prev, logo_url: url } : prev));
      } else if (type === "feature") {
        setEditingFeaturePreview(url);
        setEditing((prev) => (prev ? { ...prev, blog_feature_image: url } : prev));
      } else {
        // append the uploaded video to the videos array (don't truncate existing videos)
        setEditingVideoPreview(url);
        setEditing((prev) => (prev ? { ...prev, videos: [url, ...(prev.videos ?? [])] } : prev));
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

  async function handleEditBlogFileInput(e: React.ChangeEvent<HTMLInputElement>, type: "blog2Feature" | "blog2Video") {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    try {
      if (type === "blog2Feature") setEditingBlogFeatureUploading(true);
      else setEditingVideoUploading(true);
      setStatus(null);
      const url = await uploadFileToServer(file);
      if (type === "blog2Feature") {
        setEditingBlogFeaturePreview(url);
        setEditing((prev) => (prev ? { ...prev, blog2_feature_image: url } : prev));
      } else {
        // append the uploaded blog2 video to the blog2_videos array
        setEditing((prev) => (prev ? { ...prev, blog2_videos: [url, ...(prev.blog2_videos ?? [])] } : prev));
      }
      setStatus("Uploaded blog2 file");
    } catch (err: any) {
      console.error("handleEditBlogFileInput error:", err);
      setStatus("Upload failed: " + (err?.message || "unknown"));
    } finally {
      if (type === "blog2Feature") setEditingBlogFeatureUploading(false);
      else setEditingVideoUploading(false);
    }
  }

  // Save edited client (PATCH)
  async function saveEdit(updated: Client | null) {
    const cur = (updated && typeof updated === 'object') ? updated : editing;
    if (!cur?.id) return;

    // prevent saving while any uploads are still in flight
    if (uploadingFiles || editingLogoUploading || editingFeatureUploading || editingVideoUploading || editingBlogFeatureUploading || editingUploadingImages || editingUploadingVideos) {
      setStatus('Please wait for uploads to finish before saving.');
      return;
    }

    setStatus('Saving...');

    try {
      // Build payload from freshest state. Include feature image fields even when explicitly set to null
      const payload: any = {
        client_name: cur.client_name,
        blog_title: cur.blog_title,
        blog_slug: cur.blog_slug,
        blog_body_html: cur.blog_body_html ?? undefined,
        cta_text: cur.cta_text,
        images: sanitizeUrls(Array.isArray(cur.images) ? cur.images as string[] : undefined),
        videos: sanitizeUrls(Array.isArray(cur.videos) ? cur.videos as string[] : undefined),
        body_data: cur.body_data || undefined,
        // blog2 fields - include explicitly if present
        blog2_title: (cur as any).blog2_title ?? undefined,
        blog2_slug: (cur as any).blog2_slug ?? undefined,
        blog2_body_html: (cur as any).blog2_body_html ?? undefined,
        blog2_images: sanitizeUrls((cur as any).blog2_images !== undefined ? (cur as any).blog2_images as string[] : undefined),
        blog2_videos: sanitizeUrls((cur as any).blog2_videos !== undefined ? (cur as any).blog2_videos as string[] : undefined),
      };

      // Handle blog_feature_image: if the `cur` object explicitly has the property (even null), include it in the payload.
      if (Object.prototype.hasOwnProperty.call(cur, 'blog_feature_image')) {
        const val = (cur as any).blog_feature_image;
        if (val === null) payload.blog_feature_image = null;
        else if (val && !String(val).startsWith('blob:')) payload.blog_feature_image = val;
        else payload.blog_feature_image = undefined; // don't send blob: temporary URLs
        // also include legacy `feature_image` key for servers expecting that name
        if (payload.blog_feature_image !== undefined) payload.feature_image = payload.blog_feature_image;
      }

      // Handle blog2_feature_image the same way
      if (Object.prototype.hasOwnProperty.call(cur, 'blog2_feature_image')) {
        const val2 = (cur as any).blog2_feature_image;
        if (val2 === null) payload.blog2_feature_image = null;
        else if (val2 && !String(val2).startsWith('blob:')) payload.blog2_feature_image = val2;
        else payload.blog2_feature_image = undefined;
        if (payload.blog2_feature_image !== undefined) payload.feature_image = payload.blog2_feature_image;
      }

      // include logo if present (avoid sending blob URLs)
      if (Object.prototype.hasOwnProperty.call(cur, 'logo_url')) {
        const lv = (cur as any).logo_url;
        if (lv === null) payload.logo_url = null;
        else if (lv && !String(lv).startsWith('blob:')) payload.logo_url = lv;
      }

      // DEBUG: capture payload
      console.debug('[Admin] saveEdit - payload being sent:', payload);
      try { setLastPayload && setLastPayload(payload); } catch {}

      const base = cur.source === 'clients_blog2' ? '/api/admin/clients_blog2' : '/api/admin/clients';
      const res = await fetch(`${base}/${cur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // read and log response for diagnosis
      const rawText = await res.text().catch(() => '');
      let json: any = null;
      try { json = rawText ? JSON.parse(rawText) : null; } catch (e) { json = null; }
      console.debug('[Admin] saveEdit response status:', res.status, res.statusText);
      console.debug('[Admin] saveEdit response body:', rawText, json);
      try { setLastResponse && setLastResponse(json ?? rawText); } catch {}

      if (!res.ok) {
        const serverMsg = (json && (json.error || json.message)) || rawText || `Server returned ${res.status}`;
        throw new Error(serverMsg);
      }

      // Try to get authoritative saved object from server (some backends don't return the updated object in the PATCH response)
      let serverObj: any = null;
      try {
        const getRes = await fetch(`${base}/${cur.id}`, { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (getRes.ok) {
          const t = await getRes.text().catch(() => '');
          try { serverObj = t ? JSON.parse(t) : null; } catch { serverObj = null; }
          serverObj = (serverObj && (serverObj.data || serverObj.client || serverObj.item)) || serverObj;
        }
      } catch (err) {
        console.warn('Could not fetch updated item after PATCH:', err);
        serverObj = null;
      }

      // Prefer server-returned updated object; fall back to parsed PATCH response; finally fallback to payload
      const updatedObj = (json && (json.data || json.updated || json.client || json.item)) || serverObj || json || null;

      if (updatedObj && typeof updatedObj === 'object') {
        // update editing state with authoritative values (handle different key names)
        const feature = updatedObj.blog_feature_image ?? updatedObj.feature_image ?? updatedObj.blogFeatureImage ?? null;
        const blog2Feature = updatedObj.blog2_feature_image ?? updatedObj.blog2FeatureImage ?? null;
        const logo = updatedObj.logo_url ?? updatedObj.logoUrl ?? updatedObj.logo ?? null;

        setEditing((prev) => (prev ? {
          ...prev,
          blog_feature_image: feature === undefined ? prev?.blog_feature_image ?? null : (feature === null ? null : String(feature)),
          blog2_feature_image: blog2Feature === undefined ? prev?.blog2_feature_image ?? null : (blog2Feature === null ? null : String(blog2Feature)),
          logo_url: logo === undefined ? prev?.logo_url ?? null : (logo === null ? null : String(logo)),
        } : prev));

        setEditingFeaturePreview(feature ? String(feature) : null);
        setEditingBlogFeaturePreview(blog2Feature ? String(blog2Feature) : null);
        setEditingLogoPreview(logo ? String(logo) : null);

        // update the item within the list so UI overview shows the new image immediately
        setList((prev) => prev.map((it) => it.id === cur.id ? ({ ...it, blog_feature_image: feature ?? null, blog2_feature_image: blog2Feature ?? null, logo_url: logo ?? null }) : it));
      } else {
        // server didn't return updated object; use payload as fallback (only non-blob values)
        if (payload.blog_feature_image !== undefined) {
          setEditing((prev) => (prev ? { ...prev, blog_feature_image: payload.blog_feature_image } : prev));
          setEditingFeaturePreview(payload.blog_feature_image ?? null);
        }
        if (payload.blog2_feature_image !== undefined) {
          setEditing((prev) => (prev ? { ...prev, blog2_feature_image: payload.blog2_feature_image } : prev));
          setEditingBlogFeaturePreview(payload.blog2_feature_image ?? null);
        }
        if (payload.logo_url !== undefined) {
          setEditing((prev) => (prev ? { ...prev, logo_url: payload.logo_url } : prev));
          setEditingLogoPreview(payload.logo_url ?? null);
        }

        // also update list from payload when possible
        setList((prev) => prev.map((it) => it.id === cur.id ? ({ ...it, blog_feature_image: payload.blog_feature_image ?? it.blog_feature_image, blog2_feature_image: payload.blog2_feature_image ?? it.blog2_feature_image, logo_url: payload.logo_url ?? it.logo_url }) : it));
      }

      setStatus('Saved ✅');

      // Close modal after a short delay to ensure UI reflects saved image (optional)
      setTimeout(() => {
        setEditing(null);
        setEditingLogoPreview(null);
        setEditingFeaturePreview(null);
        setEditingVideoPreview(null);
        setEditingBlogFeaturePreview(null);
      }, 150);

      await fetchList();
    } catch (err: any) {
      console.error('saveEdit error:', err);
      setStatus('Save failed: ' + (err?.message || 'unknown'));
    }
  }

  /* ------------------ small helpers for rendering videos ------------------ */
  function videoOnError(e: React.SyntheticEvent<HTMLVideoElement>) {
    console.warn("video error", e);
    setStatus("Video failed to load. Check file or server URL.");
  }

  /* ------------------ UI ------------------ */
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold mb-4">Admin — Manage Clients & Blogs</h1>

        {/* ---------- CREATE PANELS: Client (left) + Blog (right) ---------- */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Case Study create */}
          <form onSubmit={async (e) => { e.preventDefault(); await handleCreateClient(); }} className="bg-white shadow p-6 rounded space-y-4">
            <h2 className="font-semibold text-lg">Create Client Case study</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Client Name *</label>
                <input value={clientName1} onChange={(e) => setClientName1(e.target.value)} className="w-full border rounded px-2 py-1" />
              </div>

              <div>
                <label className="block text-sm font-medium">Case Study Title *</label>
                <input value={blogTitle1} onChange={(e) => setBlogTitle1(e.target.value)} className="w-full border rounded px-2 py-1" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Case Study Body *</label>
              <SimpleEditor value={blogBody1} onChange={(html) => setBlogBody1(html)} placeholder="Start typing your blog..." />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Images (1–4)</label>
                <input ref={fileInputRef1} type="file" accept="image/*" multiple onChange={(e) => onFilesChange1(e.target.files)} />
                {(uploadingImages1 || uploadingFiles) && <div className="text-xs text-gray-500 mt-2">Uploading images…</div>}
                <div className="mt-3 flex gap-3">
                  {previews1.map((src, idx) => (
                    <div key={idx} className="w-24 h-24 relative border overflow-hidden rounded">
                      <Image src={src} alt={`preview1-${idx}`} fill style={{ objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Videos (0–4)</label>
                <input ref={videoInputRef1} type="file" accept="video/*" multiple onChange={(e) => onVideosChange1(e.target.files)} />
                {(uploadingVideos1 || uploadingFiles) && <div className="text-xs text-gray-500 mt-2">Uploading videos…</div>}
                <div className="mt-3 flex gap-3">
                  {videoPreviews1.map((src) => (
                    <div key={src} className="w-36 h-24 border rounded overflow-hidden">
                      <video
                        key={src}
                        src={src}
                        controls
                        preload="metadata"
                        crossOrigin="anonymous"
                        onError={videoOnError}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Client Logo (required)</label>

                {logoUrl1 ? (
                  <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                    <Image src={logoUrl1} alt="logo1" fill style={{ objectFit: "contain" }} sizes="112px" />
                    <button
                      type="button"
                      aria-label="Remove logo"
                      onClick={() => setLogoUrl1("")}
                      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                      title="Remove logo"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingLogo1(true);
                      try {
                        const url = await uploadFileToServer(file);
                        setLogoUrl1(url);
                        setStatus("Logo uploaded (Client)");
                      } catch (err: any) {
                        console.error("Logo upload error:", err);
                        setStatus("Upload failed: " + (err?.message || err));
                      } finally {
                        setUploadingLogo1(false);
                      }
                    }}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Client Feature Image (optional)</label>

                {featureImageUrl1 ? (
                  <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                    <img
  src={featureImageUrl1 ?? ''}
  alt="feature1"
  style={{ width: '112px', height: '80px', objectFit: 'contain', display: 'block' }}
  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
/>
                    <button
                      type="button"
                      aria-label="Remove feature image"
                      onClick={() => setFeatureImageUrl1("")}
                      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                      title="Remove feature image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingFeature1(true);
                      try {
                        const url = await uploadFileToServer(file);
                        setFeatureImageUrl1(url);
                        setStatus("Feature uploaded (Client)");
                      } catch (err: any) {
                        console.error("Feature upload error:", err);
                        setStatus("Upload failed: " + (err?.message || err));
                      } finally {
                        setUploadingFeature1(false);
                      }
                    }}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={uploadingFiles || uploadingLogo1 || uploadingFeature1 || uploadingImages1 || uploadingVideos1} className="px-4 py-2 bg-orange-500 text-white rounded">
                {uploadingFiles || uploadingLogo1 || uploadingFeature1 || uploadingImages1 || uploadingVideos1 ? "Creating…" : "Create Client Case Study"}
              </button>
            </div>
          </form>

          {/* Blog create */}
          <form onSubmit={async (e) => { e.preventDefault(); await handleCreateBlog(); }} className="bg-white shadow p-6 rounded space-y-4">
            <h2 className="font-semibold text-lg">Create — Blog</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Author Name *</label>
                <input value={clientName2} onChange={(e) => setClientName2(e.target.value)} className="w-full border rounded px-2 py-1" />
              </div>

              <div>
                <label className="block text-sm font-medium">Blog Title *</label>
                <input value={blogTitle2} onChange={(e) => setBlogTitle2(e.target.value)} className="w-full border rounded px-2 py-1" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Blog Body *</label>
              <SimpleEditor value={blogBody2} onChange={(html) => setBlogBody2(html)} placeholder="Start typing Blog..." />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Blog Images (1–4)</label>
                <input ref={fileInputRef2} type="file" accept="image/*" multiple onChange={(e) => onFilesChange2(e.target.files)} />
                {(uploadingImages2 || uploadingFiles) && <div className="text-xs text-gray-500 mt-2">Uploading images…</div>}
                <div className="mt-3 flex gap-3">
                  {previews2.map((src, idx) => (
                    <div key={idx} className="w-24 h-24 relative border overflow-hidden rounded">
                      <Image src={src} alt={`preview2-${idx}`} fill style={{ objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Blog Videos (0–4)</label>
                <input ref={videoInputRef2} type="file" accept="video/*" multiple onChange={(e) => onVideosChange2(e.target.files)} />
                {(uploadingVideos2 || uploadingFiles) && <div className="text-xs text-gray-500 mt-2">Uploading videos…</div>}
                <div className="mt-3 flex gap-3">
                  {videoPreviews2.map((src) => (
                    <div key={src} className="w-36 h-24 border rounded overflow-hidden">
                      <video
                        key={src}
                        src={src}
                        controls
                        preload="metadata"
                        crossOrigin="anonymous"
                        onError={videoOnError}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Author Photo (required)</label>

                {logoUrl2 ? (
                  <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                    <Image src={logoUrl2} alt="logo2" fill style={{ objectFit: "contain" }} sizes="112px" />
                    <button
                      type="button"
                      aria-label="Remove logo"
                      onClick={() => setLogoUrl2("")}
                      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                      title="Remove logo"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingLogo2(true);
                      try {
                        const url = await uploadFileToServer(file);
                        setLogoUrl2(url);
                        setStatus("Logo uploaded (Blog)");
                      } catch (err: any) {
                        console.error("Logo upload error:", err);
                        setStatus("Upload failed: " + (err?.message || err));
                      } finally {
                        setUploadingLogo2(false);
                      }
                    }}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Feature Image (optional)</label>

                {featureImageUrl2 ? (
                  <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                    <img
  src={featureImageUrl2 ?? ''}
  alt="feature2"
  style={{ width: '112px', height: '80px', objectFit: 'contain', display: 'block' }}
  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
/>
                    <button
                      type="button"
                      aria-label="Remove feature image"
                      onClick={() => setFeatureImageUrl2("")}
                      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                      title="Remove feature image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingFeature2(true);
                      try {
                        const url = await uploadFileToServer(file);
                        setFeatureImageUrl2(url);
                        setStatus("Feature uploaded (Blog)");
                      } catch (err: any) {
                        console.error("Feature upload error:", err);
                        setStatus("Upload failed: " + (err?.message || err));
                      } finally {
                        setUploadingFeature2(false);
                      }
                    }}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={uploadingFiles || uploadingLogo2 || uploadingFeature2 || uploadingImages2 || uploadingVideos2} className="px-4 py-2 bg-sky-600 text-white rounded">
                {uploadingFiles || uploadingLogo2 || uploadingFeature2 || uploadingImages2 || uploadingVideos2 ? "Creating…" : "Create Blog"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing clients lists (separated into Client and Blog) */}
        <div>
          <h2 className="font-semibold text-lg mb-2">Existing Clients</h2>

          {loading ? (
            <div>Loading…</div>
          ) : list.length === 0 ? (
            <div>No clients found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {list
                  .filter((c) => (c.blog_title && String(c.blog_title).trim()) || (c.blog_body_html && String(c.blog_body_html).trim()))
                  .map((c) => (
                    <div key={`b1-${c.id}`} className="bg-white p-4 rounded shadow flex gap-4">
                      <div className="w-28 h-20 relative flex-shrink-0">
                        {c.logo_url ? (
                          <Image src={c.logo_url} alt={c.client_name || "logo"} fill style={{ objectFit: "contain" }} sizes="112px" />
                        ) : (
                          <div className="bg-gray-100 w-full h-full flex items-center justify-center text-xs text-gray-400">No logo</div>
                        )}
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
            </>
          )}
        </div>

        {/* Blog list */}
        <div>
          <h2 className="font-semibold text-lg mb-2">Existing Blogs</h2>

          {loading ? (
            <div>Loading…</div>
          ) : list.length === 0 ? (
            <div>No clients found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {list
                  .filter((c) => (c.blog2_title && String(c.blog2_title).trim()) || (c.blog2_body_html && String(c.blog2_body_html).trim()))
                  .map((c) => (
                    <div key={`b2-${c.id}`} className="bg-white p-4 rounded shadow flex gap-4">
                      <div className="w-28 h-20 relative flex-shrink-0">
                        {c.logo_url ? (
                          <Image src={c.logo_url} alt={c.client_name || "logo"} fill style={{ objectFit: "contain" }} sizes="112px" />
                        ) : (
                          <div className="bg-gray-100 w-full h-full flex items-center justify-center text-xs text-gray-400">No logo</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-gray-600">{c.client_name}</div>
                            <div className="font-semibold">{c.blog2_title}</div>
                            <div className="text-xs text-gray-500">{c.blog2_slug}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(c)} className="px-2 py-1 bg-blue-500 text-white text-sm rounded">Edit</button>
                            <button onClick={() => handleDelete(c)} className="px-2 py-1 bg-red-500 text-white text-sm rounded">Delete</button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-700 line-clamp-3" dangerouslySetInnerHTML={{ __html: c.blog2_body_html || "" }} />
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        {status && <div className="text-sm mt-4 text-gray-700">{status}</div>}

        {/* Edit modal (unchanged, handles both blog1 + blog2 fields) */}
        {editing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Edit — {editing.blog_title || editing.blog2_title}</h3>
                <button aria-label="Close" onClick={() => setEditing(null)} className="rounded-full bg-gray-100 hover:bg-gray-200 w-9 h-9 flex items-center justify-center">✕</button>
              </div>

              {/* inside the existing modal: replace the content of the scrollable area with this */}
              <div className="p-4 overflow-auto" style={{ maxHeight: "calc(80vh - 112px)" }}>
                {/*
                  Show a simplified Blog-only editor when editing a clients_blog2 row.
                  Otherwise show the full editor (old behavior).
                */}
                {editing.source === "clients_blog2" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium">Author Name</label>
                      <input
                        value={editing.client_name || ""}
                        onChange={(e) => setEditing((prev) => (prev ? { ...prev, client_name: e.target.value } : prev))}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Blog Title</label>
                      <input
                        value={(editing as any).blog2_title ?? ""}
                        onChange={(e) => setEditing((prev) => (prev ? { ...prev, blog2_title: e.target.value } : prev))}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Blog Body (HTML)</label>
                      <div className="border rounded" style={{ height: "240px", overflow: "auto", padding: 8, background: "white" }}>
                        <SimpleEditor
                          value={(editing as any).blog2_body_html ?? ""}
                          onChange={(html) => setEditing((prev) => (prev ? { ...prev, blog2_body_html: html } : prev))}
                          placeholder="Start typing Blog..."
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Blog Images (1–4)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            // immediate blob previews for UX
                            const tempUrls = Array.from(files).map((f) => URL.createObjectURL(f));
                            setEditing((prev) => (prev ? { ...prev, blog2_images: [...((prev.blog2_images as string[]) || []), ...tempUrls] } : prev));

                            setEditingUploadingImages(true);
                            setUploadingFiles(true);
                            try {
                              const uploaded = await uploadFilesToServer(Array.from(files));
                              setEditing((prev) => {
                                if (!prev) return prev;
                                // remove the temp blob urls we added and append server URLs instead.
                                const existing = (prev.blog2_images || []).filter((s: string) => !s.startsWith("blob:"));
                                return { ...prev, blog2_images: [...existing, ...uploaded] };
                              });
                              // revoke blob urls
                              tempUrls.forEach((u) => { try { if (u.startsWith("blob:")) URL.revokeObjectURL(u); } catch {} });
                              setStatus(`Uploaded ${uploaded.length} image(s)`);
                            } catch (err: any) {
                              console.error("upload blog2 images failed:", err);
                              setStatus("Image upload failed: " + (err?.message || "unknown"));
                            } finally {
                              setEditingUploadingImages(false);
                              setUploadingFiles(false);
                            }
                          }}
                        />
                        {(editingUploadingImages || uploadingFiles) && <div className="text-xs text-gray-500 mt-2">Uploading images…</div>}
                        <div className="mt-3 grid grid-cols-3 gap-3">
                          {(editing.blog2_images || []).map((src: string, idx: number) => (
                            <div key={idx} className="relative w-full h-24 rounded overflow-hidden border">
                              <div className="absolute right-2 top-2 z-20">
                                <button
                                  onClick={() => {
                                    setEditing((prev) => {
                                      if (!prev) return prev;
                                      const next = (prev.blog2_images || []).filter((_, i) => i !== idx);
                                      try { URL.revokeObjectURL(src); } catch {}
                                      return { ...prev, blog2_images: next.length ? next : [] };
                                    });
                                  }}
                                  className="rounded-full bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center shadow"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="w-full h-full relative">
                                <Image src={src} alt={`b2-image-${idx}`} fill style={{ objectFit: "cover" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium">Blog Videos (0–4)</label>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            const tempUrls = Array.from(files).map((f) => URL.createObjectURL(f));
                            setEditing((prev) => (prev ? { ...prev, blog2_videos: [...((prev.blog2_videos as string[]) || []), ...tempUrls] } : prev));
                            setStatus(`Uploading ${files.length} video(s)...`);

                            setEditingUploadingVideos(true);
                            setUploadingFiles(true);
                            try {
                              const uploaded = await uploadFilesToServer(Array.from(files));
                              setEditing((prev) => {
                                if (!prev) return prev;
                                const existing = (prev.blog2_videos || []).filter((s: string) => !s.startsWith("blob:"));
                                return { ...prev, blog2_videos: [...existing, ...uploaded] };
                              });
                              tempUrls.forEach((u) => { try { if (u.startsWith("blob:")) URL.revokeObjectURL(u); } catch {} });
                              setStatus(`Uploaded ${uploaded.length} video(s)`);
                            } catch (err: any) {
                              console.error("upload blog2 videos failed:", err);
                              setStatus("Video upload failed: " + (err?.message || "unknown"));
                            } finally {
                              setEditingUploadingVideos(false);
                              setUploadingFiles(false);
                            }
                          }}
                        />
                        {(editingUploadingVideos || uploadingFiles) && <div className="text-xs text-gray-500 mt-2">Uploading videos…</div>}
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {(editing.blog2_videos || []).map((src: string, idx: number) => (
                            <div key={idx} className="relative w-full h-28 rounded overflow-hidden border bg-black/5 flex items-center justify-center">
                              <div className="absolute right-2 top-2 z-20">
                                <button
                                  onClick={() => {
                                    setEditing((prev) => {
                                      if (!prev) return prev;
                                      const next = (prev.blog2_videos || []).filter((_, i) => i !== idx);
                                      try { URL.revokeObjectURL(src); } catch {}
                                      return { ...prev, blog2_videos: next.length ? next : [] };
                                    });
                                  }}
                                  className="rounded-full bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center shadow"
                                >
                                  ✕
                                </button>
                              </div>
                              <video src={src} controls className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Author Photo (required)</label>
                        {editing.logo_url ? (
                          <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                            <Image src={editing.logo_url} alt="logo" fill style={{ objectFit: "contain" }} sizes="112px" />
                            <button
                              type="button"
                              aria-label="Remove logo (editing)"
                              onClick={() => setEditing((prev) => (prev ? { ...prev, logo_url: null } : prev))}
                              className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                              title="Remove logo"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setEditingLogoUploading(true);
                              try {
                                const url = await uploadFileToServer(file);
                                setEditing((prev) => (prev ? { ...prev, logo_url: url } : prev));
                                setStatus("Logo uploaded (editing)");
                              } catch (err: any) {
                                console.error("Logo upload error:", err);
                                setStatus("Upload failed: " + (err?.message || err));
                              } finally {
                                setEditingLogoUploading(false);
                              }
                            }}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium">Feature Image (optional)</label>
                        {editing.blog2_feature_image ? (
                          <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                            <img
  src={editing.blog2_feature_image ?? ''}
  alt="feature"
  style={{ width: '112px', height: '80px', objectFit: 'contain', display: 'block' }}
  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
/>
                            <button
                              type="button"
                              aria-label="Remove blog2 feature image"
                              onClick={() => setEditing((prev) => (prev ? { ...prev, blog2_feature_image: null } : prev))}
                              className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                              title="Remove feature image"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setEditingBlogFeatureUploading(true);
                              try {
                                const url = await uploadFileToServer(file);
                                setEditing((prev) => (prev ? { ...prev, blog2_feature_image: url } : prev));
                                setStatus("Feature uploaded (editing)");
                              } catch (err: any) {
                                console.error("Feature upload error:", err);
                                setStatus("Upload failed: " + (err?.message || err));
                              } finally {
                                setEditingBlogFeatureUploading(false);
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ---------- existing full editor for Client rows (unchanged) ---------- */
                  /* ---------- REPLACE Client editor (inside edit modal) with this minimal + logo/feature + Blog block ---------- */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium">Client Name *</label>
                      <input
                        value={editing.client_name || ""}
                        onChange={(e) => setEditing((prev) => (prev ? { ...prev, client_name: e.target.value } : prev))}
                        className="w-full border rounded px-2 py-1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Case study Title *</label>
                      <input
                        value={editing.blog_title || ""}
                        onChange={(e) => setEditing((prev) => (prev ? { ...prev, blog_title: e.target.value } : prev))}
                        className="w-full border rounded px-2 py-1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Case study Body *</label>
                      <div className="border rounded" style={{ height: "240px", overflow: "auto", padding: 8, background: "white" }}>
                        <SimpleEditor
                          value={editing.blog_body_html || ""}
                          onChange={(html) => setEditing((prev) => (prev ? { ...prev, blog_body_html: html } : prev))}
                          placeholder="Start typing the blog..."
                        />
                      </div>
                    </div>

                    {/* Images */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Existing Images</label>
                      {(!editing.images || editing.images.length === 0) ? (
                        <div className="text-xs text-gray-500">No images attached.</div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {(editing.images || []).map((src, idx) => (
                            <div key={idx} className="relative w-full h-24 rounded overflow-hidden border">
                              <div className="absolute right-2 top-2 z-20">
                                <button
                                  onClick={() => setEditing((prev) => {
                                    if (!prev) return prev;
                                    const next = (prev.images || []).filter((_, i) => i !== idx);
                                    try { URL.revokeObjectURL(src); } catch {}
                                    return { ...prev, images: next.length ? next : [] };
                                  })}
                                  className="rounded-full bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center shadow"
                                  title="Remove image"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="w-full h-full relative"><Image src={src} alt={`image-${idx}`} fill style={{ objectFit: "cover" }} /></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Add Images (1–4)</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;

                          const tempUrls = Array.from(files).map((f) => URL.createObjectURL(f));
                          setEditing((prev) => (prev ? { ...prev, images: [...(prev.images || []), ...tempUrls] } : prev));
                          setStatus(`Uploading ${files.length} image(s)...`);

                          setEditingUploadingImages(true);
                          setUploadingFiles(true);
                          try {
                            const uploaded = await uploadFilesToServer(Array.from(files));
                            setEditing((prev) => {
                              if (!prev) return prev;
                              const existing = (prev.images || []).filter((s: string) => !s.startsWith("blob:"));
                              return { ...prev, images: [...existing, ...uploaded] };
                            });
                            tempUrls.forEach((u) => { try { if (u.startsWith("blob:")) URL.revokeObjectURL(u); } catch {} });
                            setStatus(`Uploaded ${uploaded.length} image(s)`);
                          } catch (err: any) {
                            console.error("upload images failed:", err);
                            setStatus("Image upload failed: " + (err?.message || "unknown"));
                          } finally {
                            setEditingUploadingImages(false);
                            setUploadingFiles(false);
                          }
                        }}
                      />
                      {(editingUploadingImages || uploadingFiles) && <div className="text-xs text-gray-500 mt-2">Uploading images…</div>}
                    </div>

                    {/* Videos */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Existing Videos</label>
                      {(!editing.videos || editing.videos.length === 0) ? (
                        <div className="text-xs text-gray-500">No videos attached.</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {(editing.videos || []).map((src, idx) => (
                            <div key={idx} className="relative w-full h-28 rounded overflow-hidden border bg-black/5 flex items-center justify-center">
                              <div className="absolute right-2 top-2 z-20">
                                <button
                                  onClick={() => setEditing((prev) => {
                                    if (!prev) return prev;
                                    const next = (prev.videos || []).filter((_, i) => i !== idx);
                                    try { URL.revokeObjectURL(src); } catch {}
                                    return { ...prev, videos: next.length ? next : [] };
                                  })}
                                  className="rounded-full bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center shadow"
                                  title="Remove video"
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

                    <div>
                      <label className="block text-sm font-medium">Add Videos (0–4)</label>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;

                          const tempUrls = Array.from(files).map((f) => URL.createObjectURL(f));
                          setEditing((prev) => (prev ? { ...prev, videos: [...(prev.videos || []), ...tempUrls] } : prev));
                          setStatus(`Uploading ${files.length} video(s)...`);

                          setEditingUploadingVideos(true);
                          setUploadingFiles(true);
                          try {
                            const uploaded = await uploadFilesToServer(Array.from(files));
                            setEditing((prev) => {
                              if (!prev) return prev;
                              const existing = (prev.videos || []).filter((s: string) => !s.startsWith("blob:"));
                              return { ...prev, videos: [...existing, ...uploaded] };
                            });
                            tempUrls.forEach((u) => { try { if (u.startsWith("blob:")) URL.revokeObjectURL(u); } catch {} });
                            setStatus(`Uploaded ${uploaded.length} video(s)`);
                          } catch (err: any) {
                            console.error("upload videos failed:", err);
                            setStatus("Video upload failed: " + (err?.message || "unknown"));
                          } finally {
                            setEditingUploadingVideos(false);
                            setUploadingFiles(false);
                          }
                        }}
                      />
                      {(editingUploadingVideos || uploadingFiles) && <div className="text-xs text-gray-500 mt-2">Uploading videos…</div>}
                    </div>

                    {/* Logo & Feature Image (with X remove) */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Client Logo (required)</label>
                        {editing.logo_url ? (
                          <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
                            <Image src={editing.logo_url} alt="logo" fill style={{ objectFit: "contain" }} sizes="112px" />
                            <button
                              type="button"
                              aria-label="Remove logo (editing)"
                              onClick={() => setEditing((prev) => (prev ? { ...prev, logo_url: null } : prev))}
                              className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                              title="Remove logo"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setEditingLogoUploading(true);
                              try {
                                const url = await uploadFileToServer(file);
                                setEditing((prev) => (prev ? { ...prev, logo_url: url } : prev));
                                setStatus("Logo uploaded (editing)");
                              } catch (err: any) {
                                console.error("Logo upload error:", err);
                                setStatus("Upload failed: " + (err?.message || err));
                              } finally {
                                setEditingLogoUploading(false);
                              }
                            }}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium">Client Feature Image (optional)</label>
                        {editing.blog_feature_image ? (
  <div className="relative w-28 h-20 bg-gray-50 border rounded flex items-center justify-center">
    <img
      src={editing.blog_feature_image ?? ''}
      alt="feature"
      style={{ width: '112px', height: '80px', objectFit: 'contain', display: 'block' }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
    <button
      type="button"
      aria-label="Remove feature image (editing)"
      onClick={() => setEditing((prev) => (prev ? { ...prev, blog_feature_image: null } : prev))}
      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
      title="Remove feature image"
    >
      ✕
    </button>
  </div>
) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setEditingFeatureUploading(true);
                              try {
                                const url = await uploadFileToServer(file);
                                setEditing((prev) => (prev ? { ...prev, blog_feature_image: url } : prev));
                                setStatus("Feature uploaded (editing)");
                              } catch (err: any) {
                                console.error("Feature upload error:", err);
                                setStatus("Upload failed: " + (err?.message || err));
                              } finally {
                                setEditingFeatureUploading(false);
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                <button
                  onClick={() => saveEdit(editing)}
                  disabled={uploadingFiles || editingLogoUploading || editingFeatureUploading || editingVideoUploading || editingBlogFeatureUploading || editingUploadingImages || editingUploadingVideos}
                  className={`px-3 py-1 rounded ${uploadingFiles || editingLogoUploading || editingFeatureUploading || editingVideoUploading || editingBlogFeatureUploading || editingUploadingImages || editingUploadingVideos ? 'bg-gray-300 text-gray-700' : 'bg-green-600 text-white'}`}>
                  {uploadingFiles || editingLogoUploading || editingFeatureUploading || editingVideoUploading || editingBlogFeatureUploading || editingUploadingImages || editingUploadingVideos ? 'Saving... (wait for uploads)' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
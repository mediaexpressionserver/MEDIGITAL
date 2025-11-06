"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Helper: slugify blog titles
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminPage() {
  const [clientName, setClientName] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [blogBodyHtml, setBlogBodyHtml] = useState("");
  const [ctaText, setCtaText] = useState("Read full case study");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [featureFile, setFeatureFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // 🟠 Upload to Supabase Storage
  async function handleFileUpload(file: File, folder: string) {
    const filePath = `${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("client-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("client-assets")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  // 🟢 Submit handler — now uses server route for DB insert
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Uploading...");

    try {
      if (!logoFile) throw new Error("Please select a logo image");
      if (!featureFile) throw new Error("Please select a feature image");

      // 1️⃣ Upload both images to Supabase Storage (client-side)
      const [logoUrl, featureUrl] = await Promise.all([
        handleFileUpload(logoFile, "logos"),
        handleFileUpload(featureFile, "features"),
      ]);

      // 2️⃣ Prepare payload
      const slug = slugify(blogTitle);
      const payload = {
        clientName,
        logoUrl,
        blogTitle,
        blogSlug: slug,
        blogBodyHtml,
        ctaText,
        blogFeatureImageUrl: featureUrl,
      };

      // 3️⃣ Send data to server route (server inserts into DB)
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Server error ${res.status}`);
      }

      // ✅ Success
      setStatus("✅ Client & Blog saved successfully!");
      setClientName("");
      setBlogTitle("");
      setBlogBodyHtml("");
      setLogoFile(null);
      setFeatureFile(null);
      setCtaText("Read full case study");
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ ${err.message || "Error saving data"}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin — Create Client + Blog</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Client Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Client Name</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Client Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            required
          />
          {logoFile && (
            <p className="text-xs text-gray-600 mt-1">Selected: {logoFile.name}</p>
          )}
        </div>

        {/* Blog Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Blog Title</label>
          <input
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        {/* Blog Body */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Blog Body (HTML allowed)
          </label>
          <textarea
            value={blogBodyHtml}
            onChange={(e) => setBlogBodyHtml(e.target.value)}
            rows={6}
            className="w-full border px-3 py-2 rounded"
            placeholder="<p>Your blog content...</p>"
            required
          />
        </div>

        {/* CTA Text */}
        <div>
          <label className="block text-sm font-medium mb-1">CTA Text</label>
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Feature Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Feature Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFeatureFile(e.target.files?.[0] || null)}
            required
          />
          {featureFile && (
            <p className="text-xs text-gray-600 mt-1">Selected: {featureFile.name}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            Save Client + Blog
          </button>
        </div>

        {status && <div className="mt-3 text-sm">{status}</div>}
      </form>
    </div>
  );
}
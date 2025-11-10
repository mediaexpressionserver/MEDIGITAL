"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";

type ClientBlog = {
  id: string;
  clientName: string;
  logoUrl: string;
  blogTitle: string;
  blogSlug: string;
  blogBodyHtml: string;
  ctaText: string;
  blogFeatureImageUrl?: string;
  createdAt: string;
  images?: string[]; // <-- new: array of uploaded images (1-4)
};

export default function BlogListPage() {
  const [clients, setClients] = useState<ClientBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching clients:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const INITIAL_COUNT = 9;
  const initialPosts = clients.slice(0, INITIAL_COUNT);
  const remainingPosts = clients.slice(INITIAL_COUNT);

  // helper: pick a display image (feature image first, then first of images array)
  const pickImage = (c: ClientBlog) =>
    c.blogFeatureImageUrl || (c.images && c.images.length > 0 ? c.images[0] : null);

  return (
    <main
      className="relative min-h-screen w-full bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/Blogpagebg.png')" }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-16">
        <Header />

        <section className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 text-white">Our Clients&apos; Stories</h1>
          <p className="text-gray-200 max-w-xl mx-auto">
            Explore how our clients achieved success through MeDigital.
          </p>
        </section>

        {loading ? (
          <p className="text-center text-white">Loading...</p>
        ) : clients.length === 0 ? (
          <p className="text-center text-white">No client blogs available.</p>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {initialPosts.map((client) => (
                <article
                  key={client.id}
                  className="bg-white shadow-sm rounded overflow-hidden hover:shadow-md transition"
                >
                  <Link href={`/blog/${client.blogSlug}`} className="block">
                    <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                      {pickImage(client) ? (
                        <Image
                          src={pickImage(client) as string}
                          alt={client.blogTitle}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h2 className="font-semibold text-lg mb-2">{client.blogTitle}</h2>
                      <p
                        className="text-sm text-gray-600 line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: (client.blogBodyHtml || "").substring(0, 120) + "...",
                        }}
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                        <span>{client.clientName}</span>
                        <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </section>

            {remainingPosts.length > 0 && (
              <>
                <div
                  className={`mt-10 transition-all duration-300 ${
                    showAll ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0 overflow-hidden"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {remainingPosts.map((client) => (
                      <article
                        key={client.id}
                        className="bg-white shadow-sm rounded overflow-hidden hover:shadow-md transition"
                      >
                        <Link href={`/blog/${client.blogSlug}`} className="block">
                          <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                            {pickImage(client) ? (
                              <Image
                                src={pickImage(client) as string}
                                alt={client.blogTitle}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h2 className="font-semibold text-lg mb-2">{client.blogTitle}</h2>
                            <p
                              className="text-sm text-gray-600 line-clamp-4"
                              dangerouslySetInnerHTML={{
                                __html: (client.blogBodyHtml || "").substring(0, 160) + "...",
                              }}
                            />
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                              <span>{client.clientName}</span>
                              <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="text-center mt-10">
                  <button
                    onClick={() => setShowAll((s) => !s)}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-white text-black rounded hover:bg-[#C4C6C8] transition"
                  >
                    {showAll ? "Show less" : `Load more (${remainingPosts.length})`}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
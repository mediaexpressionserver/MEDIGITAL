"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";

type ClientBlog = {
  id: string;
  clientName: string;
  logoUrl?: string;
  logo_url?: string;
  logo?: string;
  client_name?: string;
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

  // Use the client's logo as the card image.
  const pickImage = (c: ClientBlog) => c.logoUrl || c.logo_url || c.logo || null;
  const pickClientName = (c: ClientBlog) =>
    c.clientName || c.client_name || c.blogTitle || "Client";

  return (
    <main
      className="relative min-h-screen w-full bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/Blogpagebg.png')" }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-16">
        <Header />

        <section className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 text-white">Our Client&apos;s Stories</h1>
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
            <section className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {initialPosts.map((client) => (
                <article
                  key={client.id}
                  className="w-full bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <Link href={`/blog/${client.blogSlug}`} className="flex h-full flex-col">
                    <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-white p-4">
                      {pickImage(client) ? (
                        <Image
                          src={pickImage(client) as string}
                          alt={`${pickClientName(client)} logo`}
                          fill
                          style={{ objectFit: "contain" }}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : (
                        <div className="w-full h-full" aria-hidden="true" />
                      )}
                    </div>

                    <div className="px-3 py-2 text-center">
                      <h2 className="line-clamp-2 text-sm font-semibold sm:text-base">
                        {pickClientName(client)}
                      </h2>
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
                  <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {remainingPosts.map((client) => (
                      <article
                        key={client.id}
                        className="w-full bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition"
                  style={{ aspectRatio: "1 / 1" }}
                      >
                        <Link href={`/blog/${client.blogSlug}`} className="flex h-full flex-col">
                          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-white p-4">
                            {pickImage(client) ? (
                              <Image
                                src={pickImage(client) as string}
                                alt={`${pickClientName(client)} logo`}
                                fill
                                style={{ objectFit: "contain" }}
                              />
                            ) : (
                              <div className="w-full h-full" aria-hidden="true" />
                            )}
                          </div>
                          <div className="px-3 py-2 text-center">
                            <h2 className="line-clamp-2 text-sm font-semibold sm:text-base">
                              {pickClientName(client)}
                            </h2>
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
"use client";

import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function BackButtonClient() {
  return (
    <Link href="/blog" aria-label="Back to blog" className="inline-block">
      <BackButton />
    </Link>
  );
}

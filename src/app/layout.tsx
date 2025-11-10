import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MeDigital - Digital Marketing Agency",
  description: "Digital is what's happening. We create ideas that break through.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-black`}>
        {/* ✅ Global Header visible on all pages */}
        <Header />

        {/* ✅ Main Page Content */}
        <main className="relative min-h-screen w-full bg-fixed bg-cover bg-center bg-no-repeat">{/* adjust padding if header height changes */}
          {children}
        </main>
      </body>
    </html>
  );
}
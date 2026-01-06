import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        <main className="relative min-h-screen w-full bg-fixed bg-cover bg-center bg-no-repeat">
          {children}
        </main>
      </body>
    </html>
  );
}
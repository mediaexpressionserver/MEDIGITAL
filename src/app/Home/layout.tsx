import React from "react";

export const metadata = {
  title: "Horizontal Scroll Website",
};

export default function HorizontalScrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⚠️ No <Header /> here, unlike the root layout
  return <>{children}</>;
}
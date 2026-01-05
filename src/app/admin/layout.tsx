// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/authServer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
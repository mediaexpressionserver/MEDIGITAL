import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/authServer";

export async function requireAdmin() {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  return null; // allowed
}
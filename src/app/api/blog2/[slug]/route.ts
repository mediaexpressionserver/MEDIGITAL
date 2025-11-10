// src/app/api/blog2/[slug]/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const BLOGS_FILE = path.join(DATA_DIR, "blogs.json"); // reuses same data file; change if you want a separate file

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const raw = await fs.readFile(BLOGS_FILE, "utf-8");
    const blogs = JSON.parse(raw || "[]");
    const slug = params.slug;
    const blog = blogs.find((b: any) => b.slug === slug);
    if (!blog) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(blog);
  } catch (err) {
    return new NextResponse("Not found", { status: 404 });
  }
}
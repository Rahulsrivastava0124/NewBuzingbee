import { NextResponse } from "next/server";
import { fetchBlogCards } from "@/lib/blog";

export const revalidate = 300;

export async function GET() {
  try {
    const posts = await fetchBlogCards();

    if (posts.length > 0) {
      return NextResponse.json({ posts }, { status: 200 });
    }

    return NextResponse.json({ posts: [] }, { status: 200 });
  } catch (error) {
    console.error("[API /blog] Failed to fetch live posts:", error);
    return NextResponse.json(
      { posts: [], error: "Unable to fetch live blog posts" },
      { status: 502 },
    );
  }
}

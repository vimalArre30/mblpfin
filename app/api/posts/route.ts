import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

/**
 * Public list of all published blog posts (metadata only, no body).
 * Consumed by the Flutter app's creator screen to render an in-app article list.
 *
 * No auth — articles are already public on the website.
 */
export async function GET() {
  try {
    const posts = getAllPosts();
    return NextResponse.json(
      { posts },
      {
        headers: {
          // Allow Flutter app to fetch from any origin (including emulator localhost)
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          // 5-minute cache — articles change rarely
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  } catch (e) {
    console.error("[/api/posts] error:", e);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

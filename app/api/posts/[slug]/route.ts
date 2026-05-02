import { NextRequest, NextResponse } from "next/server";
import { getPostMarkdownBySlug } from "@/lib/blog";

/**
 * Returns a single post by slug, with raw markdown body.
 * Consumed by the Flutter app's article screen — renders via flutter_markdown.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = getPostMarkdownBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(post, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

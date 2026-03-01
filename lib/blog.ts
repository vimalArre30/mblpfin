import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POSTS_DIR = path.join(process.cwd(), "content/blog");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Category =
  | "Personal Finance"
  | "Philosophy"
  | "Lifestyle"
  | "Technology";

/** Frontmatter fields present on every published post. */
export interface PostMeta {
  title: string;
  slug: string;
  date: string;        // ISO 8601 — YYYY-MM-DD
  category: Category;
  excerpt: string;
  readTime: string;
  coverImage?: string; // Optional — omit or leave blank in frontmatter if unavailable
  published: boolean;
}

/** Full post — PostMeta plus the HTML-rendered body returned by getPostBySlug. */
export interface Post extends PostMeta {
  content: string; // HTML string produced by remark + remark-html
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reads a single .md file and returns its raw gray-matter result. */
function readPostFile(filename: string): matter.GrayMatterFile<string> {
  const filePath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  return matter(raw);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns metadata for every published post, sorted newest-first.
 *
 * Reads all `.md` files in `/content/blog/`, parses frontmatter only (no body
 * rendering), and filters out any post where `published !== true`.
 *
 * @returns Array of PostMeta objects ordered by date descending.
 */
export function getAllPosts(): PostMeta[] {
  const filenames = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"));

  const posts = filenames.map((filename) => {
    const { data } = readPostFile(filename);
    return data as PostMeta;
  });

  return posts
    .filter((post) => post.published === true)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

/**
 * Returns a single post by slug, including the HTML-rendered body.
 *
 * Looks for `/content/blog/<slug>.md`, parses frontmatter and body content,
 * converts the body markdown to an HTML string via remark + remark-html, and
 * returns the combined Post object.
 *
 * @param slug - The URL-friendly slug matching the markdown filename (without .md).
 * @returns The full Post object, or null if no matching file is found.
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const { data, content: rawBody } = readPostFile(`${slug}.md`);

  const processed = await remark()
    .use(remarkHtml, { sanitize: false })
    .process(rawBody);

  return {
    ...(data as PostMeta),
    content: processed.toString(),
  };
}

/**
 * Returns a deduplicated list of every category that appears across published posts.
 *
 * Useful for building category filter UI or generating static category pages.
 *
 * @returns Array of unique Category strings, in the order they first appear (newest post first).
 */
export function getAllCategories(): Category[] {
  const posts = getAllPosts();
  const seen = new Set<Category>();

  for (const post of posts) {
    seen.add(post.category);
  }

  return [...seen];
}

import { api } from "./api";

export interface BlogAuthor {
  id: number;
  full_name: string;
  role: "client" | "therapist" | "admin";
}

export interface BlogCard {
  id: number;
  title: string;
  excerpt: string;
  author: BlogAuthor;
  published_at: string | null;
}

export interface BlogPost {
  id: number;
  title: string;
  body: string; // Markdown source
  status: "draft" | "published";
  author: BlogAuthor;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
}

// ---- public (no auth) ----

export async function fetchPublicBlogPosts(): Promise<BlogCard[]> {
  const res = await api.get("/public/blog_posts");
  return res.data.blog_posts as BlogCard[];
}

export async function fetchPublicBlogPost(id: number): Promise<BlogPost> {
  const res = await api.get(`/public/blog_posts/${id}`);
  return res.data.blog_post as BlogPost;
}

// ---- authoring (auth required; permissions enforced server-side) ----

export async function fetchMyBlogPosts(): Promise<BlogPost[]> {
  const res = await api.get("/blog_posts");
  return res.data.blog_posts as BlogPost[];
}

export async function fetchBlogPost(id: number): Promise<BlogPost> {
  const res = await api.get(`/blog_posts/${id}`);
  return res.data.blog_post as BlogPost;
}

export async function createBlogPost(input: {
  title: string;
  body: string;
  status: "draft" | "published";
}): Promise<BlogPost> {
  const res = await api.post("/blog_posts", { blog_post: input });
  return res.data.blog_post as BlogPost;
}

export async function updateBlogPost(
  id: number,
  input: Partial<{ title: string; body: string; status: "draft" | "published" }>
): Promise<BlogPost> {
  const res = await api.patch(`/blog_posts/${id}`, { blog_post: input });
  return res.data.blog_post as BlogPost;
}

export async function deleteBlogPost(id: number): Promise<void> {
  await api.delete(`/blog_posts/${id}`);
}

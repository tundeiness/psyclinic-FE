import {
  fetchPublicBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "@/lib/blogApi";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("blogApi", () => {
  afterEach(() => jest.clearAllMocks());

  it("fetchPublicBlogPosts maps the cards payload", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        blog_posts: [
          {
            id: 1,
            title: "Hi",
            excerpt: "intro",
            author: { id: 9, full_name: "Jane", role: "therapist" },
            published_at: "2026-05-01T10:00:00Z",
          },
        ],
      },
    });
    const cards = await fetchPublicBlogPosts();
    expect(api.get).toHaveBeenCalledWith("/public/blog_posts");
    expect(cards[0].author.role).toBe("therapist");
  });

  it("createBlogPost wraps params under blog_post", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { blog_post: { id: 1, title: "T", body: "B", status: "draft" } },
    });
    await createBlogPost({ title: "T", body: "B", status: "draft" });
    expect(api.post).toHaveBeenCalledWith("/blog_posts", {
      blog_post: { title: "T", body: "B", status: "draft" },
    });
  });

  it("updateBlogPost can publish a draft", async () => {
    (api.patch as jest.Mock).mockResolvedValue({
      data: { blog_post: { id: 1, status: "published" } },
    });
    await updateBlogPost(1, { status: "published" });
    expect(api.patch).toHaveBeenCalledWith("/blog_posts/1", {
      blog_post: { status: "published" },
    });
  });

  it("deleteBlogPost calls the right route", async () => {
    (api.delete as jest.Mock).mockResolvedValue({ data: {} });
    await deleteBlogPost(42);
    expect(api.delete).toHaveBeenCalledWith("/blog_posts/42");
  });
});

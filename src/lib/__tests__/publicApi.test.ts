import { fetchPublicTherapists } from "@/lib/publicApi";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn() },
}));

describe("publicApi", () => {
  it("maps the therapists payload", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        therapists: [
          {
            id: 1,
            full_name: "Jane Doe",
            headline: "Anxiety",
            bio: "Bio",
            years_experience: 8,
            hourly_rate_cents: 12000,
            avatar: null,
            specializations: [{ id: 1, name: "Anxiety" }],
          },
        ],
      },
    });

    const result = await fetchPublicTherapists();
    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe("Jane Doe");
    expect(result[0].specializations[0].name).toBe("Anxiety");
    expect(api.get).toHaveBeenCalledWith("/public/therapists");
  });
});

import {
  createClientNote,
  createSlot,
  fetchMyClients,
} from "@/lib/therapistApi";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn(), put: jest.fn() },
}));

describe("therapistApi", () => {
  afterEach(() => jest.clearAllMocks());

  it("createClientNote posts to the nested notes route", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { note: { id: 1, body: "hi", created_at: "x", client_profile_id: 2 } },
    });
    const n = await createClientNote(2, "hi");
    expect(api.post).toHaveBeenCalledWith("/therapist/clients/2/notes", {
      note: { body: "hi" },
    });
    expect(n.body).toBe("hi");
  });

  it("createSlot wraps params under availability_slot", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { availability_slot: { id: 5, booked: false } },
    });
    await createSlot({ starts_at: "a", ends_at: "b" });
    expect(api.post).toHaveBeenCalledWith("/therapist/availability_slots", {
      availability_slot: { starts_at: "a", ends_at: "b" },
    });
  });

  it("fetchMyClients maps the clients payload", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        clients: [
          { id: 1, date_of_birth: null, notes: null, user: { id: 9, full_name: "A B", email: "a@b.c" } },
        ],
      },
    });
    const c = await fetchMyClients();
    expect(c[0].user.full_name).toBe("A B");
  });
});

import {
  approveApplication,
  rejectApplication,
  fetchDashboard,
} from "@/lib/adminApi";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

describe("adminApi", () => {
  afterEach(() => jest.clearAllMocks());

  it("approveApplication patches the approve member route", async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: {} });
    await approveApplication(7);
    expect(api.patch).toHaveBeenCalledWith("/admin/applications/7/approve");
  });

  it("rejectApplication patches the reject member route", async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: {} });
    await rejectApplication(7);
    expect(api.patch).toHaveBeenCalledWith("/admin/applications/7/reject");
  });

  it("fetchDashboard returns the full shape", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        pending_applications: [],
        counts: {
          clients: 1,
          therapists: 2,
          pending_applications: 0,
          appointments_upcoming: 3,
        },
        payment_inflows: { total_cents: 5000, count: 1, recent: [] },
        calendar: { month: "2026-05", availability: [], appointments: [] },
      },
    });
    const d = await fetchDashboard();
    expect(d.counts.therapists).toBe(2);
    expect(d.payment_inflows.total_cents).toBe(5000);
  });
});

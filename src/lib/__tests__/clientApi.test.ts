import {
  bookAppointment,
  confirmPayment,
  fetchSlots,
} from "@/lib/clientApi";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

describe("clientApi", () => {
  afterEach(() => jest.clearAllMocks());

  it("fetchSlots passes filter params", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { availability_slots: [] },
    });
    await fetchSlots({ date: "2026-06-01" });
    expect(api.get).toHaveBeenCalledWith("/client/availability_slots", {
      params: { date: "2026-06-01" },
    });
  });

  it("bookAppointment returns appointment + payment", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        appointment: { id: 1, status: "pending_payment" },
        payment: { id: 9, status: "pending", amount_cents: 9000 },
      },
    });
    const r = await bookAppointment({ availability_slot_id: 5 });
    expect(r.appointment.status).toBe("pending_payment");
    expect(r.payment.id).toBe(9);
  });

  it("confirmPayment posts force_failure flag", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        payment: { id: 9, status: "succeeded" },
        appointment: { id: 1, status: "booked" },
      },
    });
    await confirmPayment(9, true);
    expect(api.post).toHaveBeenCalledWith("/client/payments/9/confirm", {
      force_failure: true,
    });
  });
});

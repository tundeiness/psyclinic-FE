import {
  fetchIntakeForm,
  createIntakeForm,
  updateIntakeForm,
  signIntakeForm,
} from "@/lib/intakeApi";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), put: jest.fn() },
}));

describe("intakeApi", () => {
  afterEach(() => jest.clearAllMocks());

  it("fetchIntakeForm returns the form on 200", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { intake_form: { id: 7, presenting_complaint: "anxiety", signed: false } },
    });
    const r = await fetchIntakeForm(2);
    expect(api.get).toHaveBeenCalledWith("/clients/2/intake_form");
    expect(r?.presenting_complaint).toBe("anxiety");
  });

  it("fetchIntakeForm returns null on 404", async () => {
    (api.get as jest.Mock).mockRejectedValue({
      status: 404,
      code: "not_found",
      message: "Intake form not found",
    });
    const r = await fetchIntakeForm(2);
    expect(r).toBeNull();
  });

  it("createIntakeForm wraps the payload under intake_form", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { intake_form: { id: 1, presenting_complaint: "x" } },
    });
    await createIntakeForm(5, { presenting_complaint: "x" });
    expect(api.post).toHaveBeenCalledWith("/clients/5/intake_form", {
      intake_form: { presenting_complaint: "x" },
    });
  });

  it("updateIntakeForm PATCHes the wrapped payload", async () => {
    (api.patch as jest.Mock).mockResolvedValue({
      data: { intake_form: { id: 1, presenting_complaint: "y" } },
    });
    await updateIntakeForm(5, { presenting_complaint: "y" });
    expect(api.patch).toHaveBeenCalledWith("/clients/5/intake_form", {
      intake_form: { presenting_complaint: "y" },
    });
  });

  it("signIntakeForm POSTs to the sign route", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { intake_form: { id: 1, signed: true } },
    });
    const r = await signIntakeForm(5);
    expect(api.post).toHaveBeenCalledWith("/clients/5/intake_form/sign");
    expect(r.signed).toBe(true);
  });
});

import { isApiError, ERROR_CODES } from "@/lib/apiError";

describe("isApiError", () => {
  it("accepts a well-formed ApiError", () => {
    expect(
      isApiError({ status: 403, code: "forbidden", message: "no" })
    ).toBe(true);
  });

  it("rejects non-errors", () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError("oops")).toBe(false);
    expect(isApiError({ status: 500 })).toBe(false);
  });

  it("exposes stable error codes matching the backend contract", () => {
    expect(ERROR_CODES.FORBIDDEN).toBe("forbidden");
    expect(ERROR_CODES.NOT_FOUND).toBe("not_found");
  });
});

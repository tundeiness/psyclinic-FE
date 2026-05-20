import authReducer, {
  logout,
  clearAuthError,
  markInitialized,
  hasAdminAccess,
} from "@/store/authSlice";

type State = ReturnType<typeof authReducer>;

const baseState: State = {
  user: {
    id: 1,
    email: "c@psyclinic.test",
    full_name: "C Test",
    role: "client",
    status: "approved",
  },
  loading: false,
  error: { status: 403, code: "forbidden", message: "no" },
  initialized: true,
};

describe("authSlice reducer", () => {
  it("clears user and error on logout", () => {
    const next = authReducer(baseState, logout());
    expect(next.user).toBeNull();
    expect(next.error).toBeNull();
  });

  it("clears only the error on clearAuthError", () => {
    const next = authReducer(baseState, clearAuthError());
    expect(next.error).toBeNull();
    expect(next.user).not.toBeNull();
  });

  it("has a sane initial state", () => {
    const init = authReducer(undefined, { type: "@@INIT" });
    expect(init.user).toBeNull();
    expect(init.initialized).toBe(false);
  });

  it("markInitialized flips initialized without touching user", () => {
    const init = authReducer(undefined, { type: "@@INIT" });
    const next = authReducer(init, markInitialized());
    expect(next.initialized).toBe(true);
    expect(next.user).toBeNull();
  });

  describe("hasAdminAccess", () => {
    const u = (
      role: "client" | "therapist" | "admin",
      coAdmin = false
    ) => ({
      id: 1,
      email: "x@y",
      full_name: "X Y",
      role,
      status: "approved" as const,
      therapist_profile:
        role === "therapist"
          ? { id: 2, co_admin: coAdmin }
          : undefined,
    });

    it("is false when no user", () => {
      expect(hasAdminAccess(null)).toBe(false);
    });
    it("admin always has admin access", () => {
      expect(hasAdminAccess(u("admin"))).toBe(true);
    });
    it("therapist with co_admin true has admin access", () => {
      expect(hasAdminAccess(u("therapist", true))).toBe(true);
    });
    it("plain therapist does NOT have admin access", () => {
      expect(hasAdminAccess(u("therapist", false))).toBe(false);
    });
    it("client never has admin access", () => {
      expect(hasAdminAccess(u("client"))).toBe(false);
    });
  });
});

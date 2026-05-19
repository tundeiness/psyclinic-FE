import authReducer, {
  logout,
  clearAuthError,
  markInitialized,
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
});

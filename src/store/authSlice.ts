import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api, setToken, clearToken, getToken } from "@/lib/api";
import { ApiError } from "@/lib/apiError";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "client" | "therapist" | "admin";
  status: "pending" | "approved" | "rejected";
  // Only present when role === "therapist". A therapist flagged
  // co_admin is granted admin-like powers by the admin.
  therapist_profile?: {
    id: number;
    co_admin: boolean;
  };
}

// True if the user can see/use the admin workspace. Admins always can.
// Therapists can ONLY if they're flagged co_admin.
export function hasAdminAccess(user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.role === "therapist" && user.therapist_profile?.co_admin === true;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: ApiError | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
};

export const login = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: ApiError }
>("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post(
      "/login",
      { user: { email, password } },
      { headers: { Accept: "application/json" } }
    );
    const authHeader =
      res.headers["authorization"] || res.headers["Authorization"];
    const token =
      typeof authHeader === "string" ? authHeader.replace("Bearer ", "") : "";
    if (!token) {
      return rejectWithValue({
        status: 500,
        code: "error",
        message: "No auth token returned by the server.",
      });
    }
    setToken(token);
    return { user: res.data.user as User, token };
  } catch (e) {
    return rejectWithValue(e as ApiError);
  }
});

export const fetchMe = createAsyncThunk<
  User,
  void,
  { rejectValue: ApiError }
>("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/me");
    return res.data.user as User;
  } catch (e) {
    return rejectWithValue(e as ApiError);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      clearToken();
      state.user = null;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    markInitialized(state) {
      // Auth bootstrap completed with nothing to restore (no stored
      // token). Lets the UI stop waiting and render public content.
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.initialized = true;
      });
  },
});

export const { logout, clearAuthError, markInitialized } = authSlice.actions;
export const hasStoredToken = () => Boolean(getToken());
export default authSlice.reducer;

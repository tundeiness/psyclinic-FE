import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api, setToken, clearToken, getToken } from "@/lib/api";
import { ApiError } from "@/lib/apiError";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "client" | "therapist" | "admin";
  status: "pending" | "approved" | "rejected";
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

export const { logout, clearAuthError } = authSlice.actions;
export const hasStoredToken = () => Boolean(getToken());
export default authSlice.reducer;

import { api } from "./api";

export interface PublicTherapist {
  id: number;
  full_name: string;
  headline: string | null;
  bio: string | null;
  years_experience: number | null;
  hourly_rate_cents: number;
  avatar: { url: string | null; filename: string } | null;
  specializations: { id: number; name: string }[];
}

export async function fetchPublicTherapists(): Promise<PublicTherapist[]> {
  const res = await api.get("/public/therapists");
  return res.data.therapists as PublicTherapist[];
}

export interface SignupInput {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: "client" | "therapist";
}

export async function signup(
  input: SignupInput
): Promise<{ message: string }> {
  const res = await api.post("/signup", { user: input });
  return { message: res.data.message as string };
}

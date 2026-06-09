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

// v2: public pricing endpoint — read-only, accessible to any user
// (and to logged-out visitors browsing the marketing site).
export interface PublicPricing {
  assessment_session_price_cents: number;
  block_full_price_cents: number;
  block_installment_first_pct: number;
  block_installment_second_pct: number;
  installment_first_amount_cents: number;
  installment_second_amount_cents: number;
}

export async function fetchPublicPricing(): Promise<PublicPricing> {
  const res = await api.get("/public/pricing");
  return res.data.pricing as PublicPricing;
}

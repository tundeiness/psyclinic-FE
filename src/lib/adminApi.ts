import { api } from "./api";

export interface PendingApplication {
  id: number;
  email: string;
  full_name: string;
  role: "client" | "therapist";
  created_at: string;
}

export interface DashboardData {
  pending_applications: PendingApplication[];
  counts: {
    clients: number;
    therapists: number;
    pending_applications: number;
    appointments_upcoming: number;
    blog_posts: number;
    blog_posts_published: number;
  };
  payment_inflows: {
    total_cents: number;
    count: number;
    recent: {
      id: number;
      amount_cents: number;
      currency: string;
      paid_at: string | null;
      client_profile_id: number;
      appointment_id: number;
    }[];
  };
  calendar: {
    month: string;
    availability: {
      id: number;
      therapist: string;
      starts_at: string;
      ends_at: string;
      status: string;
    }[];
    appointments: {
      id: number;
      client: string;
      therapist: string;
      starts_at: string;
      status: string;
    }[];
  };
  bookings_by_day: { date: string; count: number }[];
  status_breakdown: Record<string, number>;
  top_therapists: { id: number; full_name: string; session_count: number }[];
  recent_bookings: {
    id: number;
    client: string;
    therapist: string;
    starts_at: string;
    status: string;
    created_at: string;
  }[];
  practice_metrics: {
    bookings_this_month: number;
    avg_sessions_per_active_therapist: number;
    top_blog_author: {
      id: number;
      full_name: string;
      post_count: number;
    } | null;
  };
}

export interface AdminClient {
  id: number;
  date_of_birth: string | null;
  user: { id: number; full_name: string; email: string };
}

export interface AdminTherapist {
  id: number;
  bio: string | null;
  license_number: string | null;
  active: boolean;
  co_admin: boolean;
  specializations: { id: number; name: string }[];
  user: { id: number; full_name: string; email: string };
}

export async function fetchDashboard(month?: string): Promise<DashboardData> {
  const res = await api.get("/admin/dashboard", {
    params: month ? { month } : {},
  });
  return res.data as DashboardData;
}

export async function fetchApplications(): Promise<PendingApplication[]> {
  const res = await api.get("/admin/applications");
  return res.data.applications as PendingApplication[];
}

export async function approveApplication(id: number): Promise<void> {
  await api.patch(`/admin/applications/${id}/approve`);
}

export async function rejectApplication(id: number): Promise<void> {
  await api.patch(`/admin/applications/${id}/reject`);
}

export async function fetchAdminClients(): Promise<AdminClient[]> {
  const res = await api.get("/admin/clients");
  return res.data.clients as AdminClient[];
}

export async function deleteAdminClient(id: number): Promise<void> {
  await api.delete(`/admin/clients/${id}`);
}

export async function fetchAdminTherapists(): Promise<AdminTherapist[]> {
  const res = await api.get("/admin/therapists");
  return res.data.therapists as AdminTherapist[];
}

export async function deleteAdminTherapist(id: number): Promise<void> {
  await api.delete(`/admin/therapists/${id}`);
}

// ---- practice-wide settings (real admin only — co-admins forbidden) ----

export interface Settings {
  flat_rate_cents: number;
  // v2 pricing keys, all in kobo (smallest naira unit).
  assessment_session_price_cents: number;
  block_full_price_cents: number;
  block_installment_first_pct: number;
  block_installment_second_pct: number;
  // Computed by the server; read-only on the client side.
  installment_first_amount_cents: number;
  installment_second_amount_cents: number;
}

// Editable subset — computed installment_*_amount_cents are derived
// server-side and shouldn't be sent in PATCH payloads.
export type SettingsInput = Partial<Omit<
  Settings,
  "installment_first_amount_cents" | "installment_second_amount_cents"
>>;

export async function fetchSettings(): Promise<Settings> {
  const res = await api.get("/admin/settings");
  return res.data.settings as Settings;
}

export async function updateSettings(input: SettingsInput): Promise<Settings> {
  const res = await api.patch("/admin/settings", { settings: input });
  return res.data.settings as Settings;
}

// ---- co-admin promotion (real admin only) ----

export async function promoteCoAdmin(
  therapistProfileId: number
): Promise<AdminTherapist> {
  const res = await api.patch(
    `/admin/therapists/${therapistProfileId}/promote_co_admin`
  );
  return res.data.therapist as AdminTherapist;
}

export async function demoteCoAdmin(
  therapistProfileId: number
): Promise<AdminTherapist> {
  const res = await api.patch(
    `/admin/therapists/${therapistProfileId}/demote_co_admin`
  );
  return res.data.therapist as AdminTherapist;
}

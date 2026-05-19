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

import { api } from "./api";

export interface Slot {
  id: number;
  therapist_profile_id: number;
  therapist_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  booked: boolean;
}

export interface Appointment {
  id: number;
  status:
    | "pending_payment"
    | "booked"
    | "completed"
    | "cancelled"
    | "payment_failed";
  reason: string | null;
  client: { id: number; name: string };
  therapist: { id: number; name: string };
  slot: { id: number; starts_at: string; ends_at: string };
  created_at: string;
}

export interface Payment {
  id: number;
  appointment_id: number;
  amount_cents: number;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  provider: string | null;
  provider_reference: string | null;
  client_secret: string | null;
  paid_at: string | null;
}

export interface AttachmentMeta {
  id?: number;
  filename: string;
  content_type: string;
  byte_size: number;
  url: string | null;
}

export async function fetchSlots(params: {
  therapist_profile_id?: number;
  date?: string;
  month?: string;
}): Promise<Slot[]> {
  const res = await api.get("/client/availability_slots", { params });
  return res.data.availability_slots as Slot[];
}

export async function bookAppointment(input: {
  availability_slot_id: number;
  reason?: string;
}): Promise<{ appointment: Appointment; payment: Payment }> {
  const res = await api.post("/client/appointments", input);
  return res.data as { appointment: Appointment; payment: Payment };
}

export async function confirmPayment(
  paymentId: number,
  forceFailure = false
): Promise<{ payment: Payment; appointment: Appointment }> {
  const res = await api.post(`/client/payments/${paymentId}/confirm`, {
    force_failure: forceFailure,
  });
  return res.data as { payment: Payment; appointment: Appointment };
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const res = await api.get("/client/appointments");
  return res.data.appointments as Appointment[];
}

export async function cancelAppointment(id: number): Promise<void> {
  await api.delete(`/client/appointments/${id}`);
}

// ---- profile (avatar + documents) ----

export async function uploadAvatar(file: File): Promise<void> {
  const form = new FormData();
  form.append("avatar", file);
  await api.put("/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function fetchDocuments(): Promise<AttachmentMeta[]> {
  const res = await api.get("/me/documents");
  return res.data.documents as AttachmentMeta[];
}

export async function uploadDocument(file: File): Promise<void> {
  const form = new FormData();
  form.append("document", file);
  await api.post("/me/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/me/documents/${id}`);
}

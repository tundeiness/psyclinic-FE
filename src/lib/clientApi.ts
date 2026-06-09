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
  // v2: assessment session (first with this therapist, individually
  // paid) vs normal session (drawn from a SessionBlock). Backend
  // defaults to "normal" — bookAppointment() explicitly sends
  // "assessment" for now since block-purchasing is a later phase.
  session_kind?: "assessment" | "normal";
  reason: string | null;
  client: { id: number; name: string };
  therapist: { id: number; name: string };
  slot: { id: number; starts_at: string; ends_at: string };
  created_at: string;
  // Present only when status == "pending_payment". The dashboard's
  // "Pending payments" panel uses these to build resume-checkout
  // links. Absent for booked/completed/cancelled/failed.
  payment?: {
    id: number;
    provider_reference: string | null;
    amount_cents: number;
    // v2 Phase 7.1: ISO-string timestamp when this pending payment
    // will be auto-cancelled by the backend's stale-payment sweeper.
    // The frontend countdown component renders the remaining time.
    expires_at?: string;
  };
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

// v2: a 6-session block purchased by the client.
export interface SessionBlock {
  id: number;
  therapist_profile_id: number;
  therapist_name: string | null;
  purchased_at: string;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number;
  payment_mode: "full" | "installment";
  status: "active" | "completed" | "refunded" | "forfeited";
  installment_due: boolean;
  // Up-front payment status. "succeeded" means the block is usable.
  first_payment_status:
    | "pending"
    | "succeeded"
    | "failed"
    | "refunded"
    | null;
}

export async function fetchSessionBlocks(): Promise<SessionBlock[]> {
  const res = await api.get("/client/session_blocks");
  return res.data.session_blocks as SessionBlock[];
}

export async function purchaseSessionBlock(
  paymentMode: "full" | "installment" = "full"
): Promise<{ session_block: SessionBlock; payment: Payment }> {
  const res = await api.post("/client/session_blocks", {
    payment_mode: paymentMode,
  });
  return res.data as { session_block: SessionBlock; payment: Payment };
}

// v2 Phase 7: pay the remaining 40% on an installment block.
// Creates a new Payment + payment intent so the frontend can
// redirect to the mock checkout for the second installment.
export async function payInstallment(
  blockId: number
): Promise<{ session_block: SessionBlock; payment: Payment }> {
  const res = await api.post(`/client/session_blocks/${blockId}/pay_installment`);
  return res.data as { session_block: SessionBlock; payment: Payment };
}

export async function bookAppointment(input: {
  availability_slot_id: number;
  reason?: string;
  session_kind?: "assessment" | "normal";
}): Promise<{ appointment: Appointment; payment: Payment }> {
  const res = await api.post("/client/appointments", {
    ...input,
    // v2: default to assessment for now. Normal sessions require an
    // active SessionBlock which Phase 6 will surface in the UI.
    session_kind: input.session_kind ?? "assessment",
  });
  return res.data as { appointment: Appointment; payment: Payment };
}

// LEGACY: kept only for backward compat with any pre-checkout-redirect
// callers. New code uses simulateMockPayment via the checkout page.
export async function confirmPayment(
  paymentId: number,
  forceFailure = false
): Promise<{ payment: Payment; appointment: Appointment }> {
  const res = await api.post(`/client/payments/${paymentId}/confirm`, {
    force_failure: forceFailure,
  });
  return res.data as { payment: Payment; appointment: Appointment };
}

// Dev-only mock checkout simulator. Posts to the backend's
// /api/v1/dev/mock_gateway/:intent/simulate endpoint. When real
// Stripe lands, this whole function goes away — clients will
// redirect to Stripe's hosted checkout instead.
export async function simulateMockPayment(
  paymentIntentId: string,
  outcome: "succeed" | "fail"
): Promise<{
  simulated: string;
  payment_status: string;
  payable_type: "Appointment" | "SessionBlock";
  appointment_status: string | null;
  session_block_id: number | null;
}> {
  const res = await api.post(
    `/dev/mock_gateway/${encodeURIComponent(paymentIntentId)}/simulate`,
    { outcome }
  );
  return res.data;
}

// Fetch a single payment by id (used by the checkout page to show
// the amount the user is about to "pay").
export async function fetchPayment(id: number): Promise<Payment> {
  const res = await api.get(`/client/payments/${id}`);
  return res.data.payment as Payment;
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

export async function deleteAvatar(): Promise<void> {
  await api.delete("/me/avatar");
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

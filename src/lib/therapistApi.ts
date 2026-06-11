import { api } from "./api";
import { Slot, Appointment } from "./clientApi";

export type { Slot, Appointment };

export interface TherapistClient {
  id: number;
  date_of_birth: string | null;
  notes: string | null;
  user: { id: number; full_name: string; email: string };
  // Phase 12: signals the therapist UI uses to flag clients per the
  // Cerca Africa policy ("Missing 3 consecutive sessions will lead
  // to a review of therapy or coaching goals").
  consecutive_no_shows?: number;
  treatment_review_recommended?: boolean;
  // Phase 14: who is the client's CURRENT therapist. The therapist
  // page compares this to its own id to know whether this is "their"
  // client or a former patient.
  current_therapist_id?: number | null;
}

// ---- availability ----

export async function fetchMySlots(): Promise<Slot[]> {
  const res = await api.get("/therapist/availability_slots");
  return res.data.availability_slots as Slot[];
}

export async function createSlot(input: {
  starts_at: string;
  ends_at: string;
}): Promise<Slot> {
  const res = await api.post("/therapist/availability_slots", {
    availability_slot: input,
  });
  return res.data.availability_slot as Slot;
}

export async function deleteSlot(id: number): Promise<void> {
  await api.delete(`/therapist/availability_slots/${id}`);
}

// ---- appointments ----

export async function fetchMyAppointments(): Promise<Appointment[]> {
  const res = await api.get("/therapist/appointments");
  return res.data.appointments as Appointment[];
}

export async function updateAppointmentStatus(
  id: number,
  status: "completed" | "cancelled"
): Promise<Appointment> {
  const res = await api.put(`/therapist/appointments/${id}`, {
    appointment: { status },
  });
  return res.data.appointment as Appointment;
}

// ---- clients ----

export async function fetchMyClients(): Promise<TherapistClient[]> {
  const res = await api.get("/therapist/clients");
  return res.data.clients as TherapistClient[];
}

export async function fetchClient(id: number): Promise<TherapistClient> {
  const res = await api.get(`/therapist/clients/${id}`);
  return res.data.client as TherapistClient;
}

// (Private clinical notes via the old ClientNote API removed in the
// EMR redesign — replaced by structured forms under
// /api/v1/clients/:id/intake_form, etc. See intakeApi.ts.)

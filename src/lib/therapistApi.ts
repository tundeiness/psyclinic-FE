import { api } from "./api";
import { Slot, Appointment } from "./clientApi";

export type { Slot, Appointment };

export interface TherapistClient {
  id: number;
  date_of_birth: string | null;
  notes: string | null;
  user: { id: number; full_name: string; email: string };
}

export interface ClientNote {
  id: number;
  body: string;
  created_at: string;
  client_profile_id: number;
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

// ---- private clinical notes ----

export async function fetchClientNotes(
  clientId: number
): Promise<ClientNote[]> {
  const res = await api.get(`/therapist/clients/${clientId}/notes`);
  return res.data.notes as ClientNote[];
}

export async function createClientNote(
  clientId: number,
  body: string
): Promise<ClientNote> {
  const res = await api.post(`/therapist/clients/${clientId}/notes`, {
    note: { body },
  });
  return res.data.note as ClientNote;
}

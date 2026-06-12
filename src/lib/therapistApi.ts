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

// Phase 15: PDF export helpers. Each returns a Blob suitable for
// triggering a browser download via Object URL + temporary anchor.
// Files are watermarked server-side when the underlying record is
// unsigned (draft).

export async function downloadIntakeFormPdf(
  clientId: number
): Promise<Blob> {
  const res = await api.get(`/clients/${clientId}/intake_form/pdf`, {
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function downloadSessionNotePdf(
  appointmentId: number
): Promise<Blob> {
  const res = await api.get(
    `/appointments/${appointmentId}/session_note/pdf`,
    { responseType: "blob" }
  );
  return res.data as Blob;
}

export async function downloadServicePlanNotePdf(
  clientId: number
): Promise<Blob> {
  const res = await api.get(
    `/clients/${clientId}/service_plan_note/pdf`,
    { responseType: "blob" }
  );
  return res.data as Blob;
}

// Phase 17.4: therapist read access to a client's DASS-42 history.
// Drafts are hidden by the backend — only signed assessments come back.
// The therapist serialization includes raw numeric scores (the client
// view excludes them per Q7).

export interface TherapistDassAssessment {
  id: number;
  client_profile_id: number;
  assessment_date: string;
  signed: boolean;
  signed_at: string | null;
  author_name: string | null;
  depression_score: number | null;
  anxiety_score: number | null;
  stress_score: number | null;
  depression_severity: string | null;
  anxiety_severity: string | null;
  stress_severity: string | null;
  [key: `item_${number}`]: number | null;
}

export async function listClientDassAssessments(
  clientId: number
): Promise<TherapistDassAssessment[]> {
  const res = await api.get(
    `/therapist/clients/${clientId}/dass_assessments`
  );
  return res.data.dass_assessments as TherapistDassAssessment[];
}

export async function fetchClientDassAssessment(
  clientId: number,
  assessmentId: number
): Promise<TherapistDassAssessment> {
  const res = await api.get(
    `/therapist/clients/${clientId}/dass_assessments/${assessmentId}`
  );
  return res.data.dass_assessment as TherapistDassAssessment;
}

export async function downloadDassPdf(
  clientId: number,
  assessmentId: number
): Promise<Blob> {
  const res = await api.get(
    `/therapist/clients/${clientId}/dass_assessments/${assessmentId}/pdf`,
    { responseType: "blob" }
  );
  return res.data as Blob;
}

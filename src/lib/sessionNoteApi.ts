import { api } from "./api";
import { isApiError } from "./apiError";

// Therapist-authored note attached to a specific appointment. Once
// signed, becomes read-only (per the Signable model concern).
// Structured fields match Cerca Africa's session-notes template:
// review, addressed_and_plan, clinician_impression.
export interface SessionNote {
  id: number;
  appointment_id: number;
  client_profile_id: number;
  session_number: number | null;
  session_date: string | null;
  session_start_time: string | null;
  session_end_time: string | null;
  review: string | null;
  addressed_and_plan: string | null;
  clinician_impression: string | null;
  signed: boolean;
  signed_at: string | null;
  signed_by_name: string | null;
  author_name: string | null;
  appointment: {
    id: number;
    client_profile_id: number;
    therapist_profile_id: number;
    slot_starts_at: string | null;
    slot_ends_at: string | null;
    status: string;
  };
}

export type SessionNoteInput = {
  session_number?: number | null;
  session_date?: string | null;
  session_start_time?: string | null;
  session_end_time?: string | null;
  review?: string | null;
  addressed_and_plan?: string | null;
  clinician_impression?: string | null;
};

export async function fetchSessionNote(
  appointmentId: number
): Promise<SessionNote | null> {
  try {
    const res = await api.get(`/appointments/${appointmentId}/session_note`);
    return res.data.session_note as SessionNote;
  } catch (err) {
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

export async function createSessionNote(
  appointmentId: number,
  input: SessionNoteInput
): Promise<SessionNote> {
  const res = await api.post(
    `/appointments/${appointmentId}/session_note`,
    { session_note: input }
  );
  return res.data.session_note as SessionNote;
}

export async function updateSessionNote(
  appointmentId: number,
  input: SessionNoteInput
): Promise<SessionNote> {
  const res = await api.patch(
    `/appointments/${appointmentId}/session_note`,
    { session_note: input }
  );
  return res.data.session_note as SessionNote;
}

export async function signSessionNote(
  appointmentId: number
): Promise<SessionNote> {
  const res = await api.post(
    `/appointments/${appointmentId}/session_note/sign`
  );
  return res.data.session_note as SessionNote;
}

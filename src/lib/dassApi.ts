import { api } from "./api";
import { isApiError } from "./apiError";

// Phase 17.3: DASS-42 client API.
//
// Client serialization deliberately EXCLUDES raw numeric scores
// (depression_score / anxiety_score / stress_score) — only severity
// bands are exposed. Per the Phase 17 brief Q7, the therapist
// interprets numbers; the client sees clinical bands.

export interface ClientDassAssessment {
  id: number;
  assessment_date: string;
  signed: boolean;
  signed_at: string | null;
  completed_items: number;
  depression_severity: string | null;
  anxiety_severity: string | null;
  stress_severity: string | null;
  // 42 item columns — null until answered.
  [key: `item_${number}`]: number | null;
}

export type DassDraftPatch = Partial<Record<`item_${number}`, number>>;

export async function listMyDassAssessments(): Promise<ClientDassAssessment[]> {
  const res = await api.get("/client/dass_assessments");
  return res.data.dass_assessments as ClientDassAssessment[];
}

export async function fetchMyDassAssessment(
  id: number
): Promise<ClientDassAssessment | null> {
  try {
    const res = await api.get(`/client/dass_assessments/${id}`);
    return res.data.dass_assessment as ClientDassAssessment;
  } catch (err) {
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

export async function startDassAssessment(): Promise<ClientDassAssessment> {
  const res = await api.post("/client/dass_assessments");
  return res.data.dass_assessment as ClientDassAssessment;
}

export async function saveDassDraft(
  id: number,
  patch: DassDraftPatch
): Promise<ClientDassAssessment> {
  const res = await api.patch(`/client/dass_assessments/${id}`, {
    dass_assessment: patch,
  });
  return res.data.dass_assessment as ClientDassAssessment;
}

export async function submitDassAssessment(
  id: number,
  patch: DassDraftPatch = {}
): Promise<ClientDassAssessment> {
  const res = await api.post(`/client/dass_assessments/${id}/submit`, {
    dass_assessment: patch,
  });
  return res.data.dass_assessment as ClientDassAssessment;
}

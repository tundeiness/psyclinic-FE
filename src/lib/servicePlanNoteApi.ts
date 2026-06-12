import { api } from "./api";
import { isApiError } from "./apiError";

// Phase 16: service plan note — therapist-authored, one per client
// globally (unlike intake which is one-per-therapist-per-client).
// Written at session 2 as the treatment-planning record.

export interface ServicePlanNoteInput {
  assessment_summary?: string;
  presenting_problems?: string;
  treatment_goals?: string;
  interventions_planned?: string;
  session_frequency?: string;
  estimated_duration?: string;
  risk_considerations?: string;
  discharge_criteria?: string;
  prepared_on?: string; // ISO date
}

export type ServicePlanNote = ServicePlanNoteInput & {
  id: number;
  client_profile_id: number;
  author_id: number;
  signed: boolean;
  signed_at: string | null;
  signed_by_name: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchServicePlanNote(
  clientId: number
): Promise<ServicePlanNote | null> {
  try {
    const res = await api.get(`/clients/${clientId}/service_plan_note`);
    return res.data.service_plan_note as ServicePlanNote;
  } catch (err) {
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

export async function createServicePlanNote(
  clientId: number,
  input: ServicePlanNoteInput
): Promise<ServicePlanNote> {
  const res = await api.post(`/clients/${clientId}/service_plan_note`, {
    service_plan_note: input,
  });
  return res.data.service_plan_note as ServicePlanNote;
}

export async function updateServicePlanNote(
  clientId: number,
  input: ServicePlanNoteInput
): Promise<ServicePlanNote> {
  const res = await api.patch(`/clients/${clientId}/service_plan_note`, {
    service_plan_note: input,
  });
  return res.data.service_plan_note as ServicePlanNote;
}

export async function signServicePlanNote(
  clientId: number
): Promise<ServicePlanNote> {
  const res = await api.post(`/clients/${clientId}/service_plan_note/sign`);
  return res.data.service_plan_note as ServicePlanNote;
}

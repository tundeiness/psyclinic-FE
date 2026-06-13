import { api } from "./api";
import { isApiError } from "./apiError";

// Phase 18.2: Wheel of Life client API. The client authors the
// assessment, can save progressive drafts, then submits to sign.
// Per Q3 of the Phase 18 brief, the client sees their own scores
// and percentages after submission (different from DASS where raw
// numbers are hidden).

// Backend scores shape: { area_key: [item_1, item_2, ...], ... }
// item values are 1-10 integers or null (nil before answered).
export type WolScores = Record<string, (number | null)[]>;

// Cached totals + percentages computed server-side on save.
// Shape: { area_key: { total, max, percentage } }
export interface WolTotalsEntry {
  total: number;
  max: number;
  percentage: number;
}
export type WolTotals = Record<string, WolTotalsEntry>;

export interface WheelOfLifeAssessment {
  id: number;
  client_profile_id: number;
  author_id: number;
  assessment_date: string;
  scores: WolScores;
  totals: WolTotals;
  focus_area: string | null;
  current_state: string | null;
  whats_missing: string | null;
  what_to_create: string | null;
  signed: boolean;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WolPatchInput {
  scores?: WolScores;
  focus_area?: string;
  current_state?: string;
  whats_missing?: string;
  what_to_create?: string;
}

export async function listMyWheelOfLifeAssessments(): Promise<
  WheelOfLifeAssessment[]
> {
  const res = await api.get("/client/wheel_of_life_assessments");
  return res.data.wheel_of_life_assessments as WheelOfLifeAssessment[];
}

export async function fetchMyWheelOfLifeAssessment(
  id: number
): Promise<WheelOfLifeAssessment | null> {
  try {
    const res = await api.get(`/client/wheel_of_life_assessments/${id}`);
    return res.data.wheel_of_life_assessment as WheelOfLifeAssessment;
  } catch (err) {
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

export async function startWheelOfLifeAssessment(): Promise<WheelOfLifeAssessment> {
  const res = await api.post("/client/wheel_of_life_assessments");
  return res.data.wheel_of_life_assessment as WheelOfLifeAssessment;
}

export async function saveWheelOfLifeDraft(
  id: number,
  patch: WolPatchInput
): Promise<WheelOfLifeAssessment> {
  const res = await api.patch(`/client/wheel_of_life_assessments/${id}`, {
    wheel_of_life_assessment: patch,
  });
  return res.data.wheel_of_life_assessment as WheelOfLifeAssessment;
}

export async function submitWheelOfLifeAssessment(
  id: number,
  patch: WolPatchInput = {}
): Promise<WheelOfLifeAssessment> {
  const res = await api.post(
    `/client/wheel_of_life_assessments/${id}/submit`,
    { wheel_of_life_assessment: patch }
  );
  return res.data.wheel_of_life_assessment as WheelOfLifeAssessment;
}

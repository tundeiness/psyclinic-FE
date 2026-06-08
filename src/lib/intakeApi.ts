import { api } from "./api";
import { isApiError } from "./apiError";

// Sub-records stored as JSONB in the backend.
export interface IntakeMedication {
  drug?: string;
  dosage?: string;
  started?: string;
  ends?: string;
  medical_condition?: string;
}

export interface IntakeHistoryEntry {
  period?: string;
  career_academic_event?: string;
  social_details?: string;
}

export interface IntakeFamilyTreeEntry {
  relation?: string;
  relationship_progression?: string;
  current_state?: string;
}

export interface IntakeSubstanceUseEntry {
  substance?: string;
  frequency_mode?: string;
  onset_progression?: string;
}

export interface IntakeForm {
  id?: number;
  client_profile_id?: number;
  author_id?: number;

  session_date?: string | null;
  session_start_time?: string | null;
  session_end_time?: string | null;

  preferred_address?: string | null;
  date_of_birth?: string | null;
  age_at_intake?: number | null;
  phone_number?: string | null;
  state_of_origin?: string | null;
  sex?: string | null;
  relationship_status?: string | null;
  gender_identity?: string | null;
  email_address?: string | null;
  home_address?: string | null;
  profession?: string | null;
  work_hours?: string | null;
  religion_spirituality?: string | null;
  referral_source?: string | null;

  presenting_complaint?: string | null;
  therapy_goals?: string | null;

  self_harm_history?: boolean | null;
  self_harm_details?: string | null;
  suicidal_ideations?: string | null;
  suicide_plan_present?: boolean | null;
  suicide_means_available?: boolean | null;

  prior_therapy?: boolean | null;
  prior_therapy_details?: string | null;

  medications?: IntakeMedication[];
  history?: IntakeHistoryEntry[];
  family_tree?: IntakeFamilyTreeEntry[];
  substance_use?: IntakeSubstanceUseEntry[];

  living_conditions?: string | null;
  other_concerns?: string | null;

  legal_proceedings?: boolean | null;
  legal_proceedings_details?: string | null;
  legal_proceedings_status?: string | null;

  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_address?: string | null;

  other_details?: string | null;

  case_formulation?: string | null;
  provisional_diagnoses?: string | null;
  treatment_plan?: string | null;

  signed?: boolean;
  signed_at?: string | null;
  signed_by_name?: string | null;
  author_name?: string | null;
}

// Anything mutable on the form — i.e. everything except identity + signing.
export type IntakeFormInput = Omit<
  IntakeForm,
  "id" | "client_profile_id" | "author_id" |
  "signed" | "signed_at" | "signed_by_name" | "author_name"
>;

export async function fetchIntakeForm(
  clientId: number
): Promise<IntakeForm | null> {
  try {
    const res = await api.get(`/clients/${clientId}/intake_form`);
    return res.data.intake_form as IntakeForm;
  } catch (err) {
    // 404 just means none yet — surface as null rather than throwing.
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

export async function createIntakeForm(
  clientId: number,
  input: IntakeFormInput
): Promise<IntakeForm> {
  const res = await api.post(`/clients/${clientId}/intake_form`, {
    intake_form: input,
  });
  return res.data.intake_form as IntakeForm;
}

export async function updateIntakeForm(
  clientId: number,
  input: IntakeFormInput
): Promise<IntakeForm> {
  const res = await api.patch(`/clients/${clientId}/intake_form`, {
    intake_form: input,
  });
  return res.data.intake_form as IntakeForm;
}

export async function signIntakeForm(clientId: number): Promise<IntakeForm> {
  const res = await api.post(`/clients/${clientId}/intake_form/sign`);
  return res.data.intake_form as IntakeForm;
}

// Phase 17.3: DASS-42 questionnaire item wording.
//
// Strings transcribed from the canonical DASS-42 form Cerca provided
// (Lovibond & Lovibond, 1995). If the licensed wording changes in a
// future revision, update both this file AND the matching ITEMS hash
// in app/services/pdf/dass_renderer.rb on the backend so the FE
// questionnaire and the PDF stay in sync.

export interface DassItem {
  number: number; // 1-42
  text: string;
  // Subscale is informational for the FE — the backend's model is the
  // source of truth for scoring. Kept in sync with
  // DassAssessment::DEPRESSION_ITEMS / ANXIETY_ITEMS / STRESS_ITEMS.
  subscale: "depression" | "anxiety" | "stress";
}

const DEPRESSION_ITEMS = new Set([3, 5, 10, 13, 16, 17, 21, 24, 26, 31, 34, 37, 38, 42]);
const ANXIETY_ITEMS = new Set([2, 4, 7, 9, 15, 19, 20, 23, 25, 28, 30, 36, 40, 41]);
// Stress items are everything else: 1, 6, 8, 11, 12, 14, 18, 22, 27, 29, 32, 33, 35, 39

function subscaleFor(n: number): "depression" | "anxiety" | "stress" {
  if (DEPRESSION_ITEMS.has(n)) return "depression";
  if (ANXIETY_ITEMS.has(n)) return "anxiety";
  return "stress";
}

const ITEM_TEXTS: Record<number, string> = {
  1: "I found myself getting upset by quite trivial things",
  2: "I was aware of dryness of my mouth",
  3: "I couldn't seem to experience any positive feeling at all",
  4: "I experienced breathing difficulty (eg, excessively rapid breathing, breathlessness in the absence of physical exertion)",
  5: "I just couldn't seem to get going",
  6: "I tended to over-react to situations",
  7: "I had a feeling of shakiness (eg, legs going to give way)",
  8: "I found it difficult to relax",
  9: "I found myself in situations that made me so anxious I was most relieved when they ended",
  10: "I felt that I had nothing to look forward to",
  11: "I found myself getting upset rather easily",
  12: "I felt that I was using a lot of nervous energy",
  13: "I felt sad and depressed",
  14: "I found myself getting impatient when I was delayed in any way (eg, elevators, traffic lights, being kept waiting)",
  15: "I had a feeling of faintness",
  16: "I felt that I had lost interest in just about everything",
  17: "I felt I wasn't worth much as a person",
  18: "I felt that I was rather touchy",
  19: "I perspired noticeably (eg, hands sweaty) in the absence of high temperatures or physical exertion",
  20: "I felt scared without any good reason",
  21: "I felt that life wasn't worthwhile",
  22: "I found it hard to wind down",
  23: "I had difficulty in swallowing",
  24: "I couldn't seem to get any enjoyment out of the things I did",
  25: "I was aware of the action of my heart in the absence of physical exertion (eg, sense of heart rate increase, heart missing a beat)",
  26: "I felt down-hearted and blue",
  27: "I found that I was very irritable",
  28: "I felt I was close to panic",
  29: "I found it hard to calm down after something upset me",
  30: "I feared that I would be \"thrown\" by some trivial but unfamiliar task",
  31: "I was unable to become enthusiastic about anything",
  32: "I found it difficult to tolerate interruptions to what I was doing",
  33: "I was in a state of nervous tension",
  34: "I felt I was pretty worthless",
  35: "I was intolerant of anything that kept me from getting on with what I was doing",
  36: "I felt terrified",
  37: "I could see nothing in the future to be hopeful about",
  38: "I felt that life was meaningless",
  39: "I found myself getting agitated",
  40: "I was worried about situations in which I might panic and make a fool of myself",
  41: "I experienced trembling (eg, in the hands)",
  42: "I found it difficult to work up the initiative to do things",
};

export const DASS_ITEMS: DassItem[] = Array.from({ length: 42 }, (_, i) => {
  const n = i + 1;
  return {
    number: n,
    text: ITEM_TEXTS[n],
    subscale: subscaleFor(n),
  };
});

// Standard Likert anchor labels per the canonical instrument.
export const LIKERT_OPTIONS = [
  { value: 0, label: "Did not apply to me at all" },
  { value: 1, label: "Applied to me to some degree, or some of the time" },
  { value: 2, label: "Applied to me to a considerable degree, or a good part of time" },
  { value: 3, label: "Applied to me very much, or most of the time" },
];

// Display label for severity bands returned by the API.
export const SEVERITY_LABEL: Record<string, string> = {
  normal: "Normal",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  extremely_severe: "Extremely severe",
};

// Tailwind color classes for severity badges.
export const SEVERITY_CLASSES: Record<string, string> = {
  normal: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  mild: "bg-amber-50 text-amber-700 ring-amber-200",
  moderate: "bg-orange-50 text-orange-700 ring-orange-200",
  severe: "bg-red-50 text-red-700 ring-red-200",
  extremely_severe: "bg-red-100 text-red-900 ring-red-300",
};

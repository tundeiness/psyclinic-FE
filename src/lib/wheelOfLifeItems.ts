// Phase 18.2: Wheel of Life questionnaire content.
//
// Strings transcribed from the canonical Cerca assessment wheel
// (Coaches Training Institute Assessment Wheel) provided in the
// uploaded source form. Keep this file in sync with the backend
// PDF renderer's ITEMS constant in app/services/pdf/wheel_of_life_renderer.rb —
// they are two separate sources of truth that must match.

export interface WolArea {
  key: string;        // matches WheelOfLifeAssessment::AREAS keys (snake_case)
  label: string;      // display label
  items: string[];    // 4-5 questionnaire statements
}

// Order matches the source form's page-1 layout left-column-first.
export const WOL_AREAS: WolArea[] = [
  {
    key: "career",
    label: "Career",
    items: [
      "I love my work.",
      "I feel my talents and skills are well used in my work.",
      "I enjoy my work environment and the people with whom I work.",
      "I see opportunity for growth and development in my position.",
      "I feel like I have found my right livelihood.",
    ],
  },
  {
    key: "fun_and_recreation",
    label: "Fun and Recreation",
    items: [
      "I regularly take the time I need to experience play, adventure and leisure.",
      "I know what activities renew me and bring me alive and I participate in them regularly.",
      "I create plenty of space in my life to relax and enjoy myself and others.",
      "I create fun for myself and others.",
    ],
  },
  {
    key: "money_and_finances",
    label: "Money and Finances",
    items: [
      "I have enough money to do the things I want to do and to accomplish the things that are important to me.",
      "I manage my money and financial affairs and records well.",
      "I am free from worry and anxiety about money.",
      "My financial future feels robust and sustainable.",
    ],
  },
  {
    key: "physical_environment",
    label: "Physical Environment",
    items: [
      "I feel nourished and supported by my home.",
      "I am surrounded by things that I love and have meaning to me.",
      "The level of order in my surroundings is appropriate to my needs. (it serves me)",
      "My wardrobe is a clear expression of who I am. I love being in the clothes I wear.",
    ],
  },
  {
    key: "personal_growth",
    label: "Personal Growth",
    items: [
      "I have a belief system that sustains me no matter what circumstances life throws at me.",
      "I am engaged in the unfolding story of my life and approach each day as an adventure.",
      "I regularly experience living a life that I love and loving who I am becoming.",
      "I regularly engage in activities and learning that grow and expand me.",
    ],
  },
  {
    key: "health_and_wellbeing",
    label: "Health and Wellbeing",
    items: [
      "I approach my health in a proactive and generative way, rather than crisis management mode.",
      "I am satisfied with my level of vitality and well being.",
      "I have support systems and structures in place that allow me to easily maintain my health and well being.",
      "I am conscious of my body and fitness level and take responsibility for my physical well-being.",
      "I know what works for me to maintain my health and I consistently do it.",
    ],
  },
  {
    key: "friends",
    label: "Friends",
    items: [
      "I have a sufficient number of great friends.",
      "My friendships nourish and sustain me.",
      "I am a good friend and I make myself available to my friendships.",
      "I trust the relationships I have with my friends.",
      "I love and make the most of the time I spend with my friends.",
    ],
  },
  {
    key: "family",
    label: "Family",
    items: [
      "I am satisfied with the level of contact I have with my family.",
      "Nothing feels hidden or witheld in my relationships with family members.",
      "I am satisfied with the role I play and the level of contribution I have in my family.",
      "I have created the experience of family in my life, whether or not it is with my biological relatives.",
    ],
  },
  {
    key: "significant_other",
    label: "Significant Other",
    items: [
      "I am open to creating an intimate loving relationship.",
      "I am free from past resentments or blame in the area of intimate relationships.",
      "I am willing to risk myself for the sake of intimacy.",
      "I create romance in my life.",
    ],
  },
];

// The 4 reflection questions, asked once total (not per area).
export const REFLECTION_QUESTIONS: { key: string; question: string }[] = [
  {
    key: "focus_area",
    question: "What area on the wheel are you most wanting and willing to make a difference with?",
  },
  {
    key: "current_state",
    question: "What is the current state of this area in your life?",
  },
  {
    key: "whats_missing",
    question: "What is missing or not working for you in this area?",
  },
  {
    key: "what_to_create",
    question: "What would you like to create in this area?",
  },
];

export const LIKERT_LABEL_LOW = "Highly Disagree";
export const LIKERT_LABEL_HIGH = "Highly Agree";

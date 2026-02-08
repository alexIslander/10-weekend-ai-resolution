export type QuestionOptionSeed = {
  label: string;
  value: string;
};

export type QuestionSeed = {
  prompt: string;
  answerType?: "text" | "single";
  options?: QuestionOptionSeed[];
};

export type QuestionSetSeed = {
  key: string;
  title: string;
  description: string;
  type: "text" | "single";
  questions: QuestionSeed[];
};

export const questionSets: QuestionSetSeed[] = [
  {
    key: "current",
    title: "Current connection",
    description: "Daily care, support, and the small moments that matter.",
    type: "text",
    questions: [
      {
        prompt: "What is a small daily gesture that makes you feel cared for?"
      },
      {
        prompt: "If we had one free evening this week, how would you want to spend it together?"
      },
      {
        prompt: "What is one habit of mine that helps you feel grounded?"
      },
      {
        prompt: "Where do you feel most connected with me right now?"
      },
      {
        prompt: "What support would make this week feel easier for you?"
      },
      {
        prompt: "What is something you want us to celebrate soon?"
      },
      {
        prompt: "What is one surprise that would make you feel special?"
      },
      {
        prompt: "How can I make mornings or nights feel softer for you?"
      }
    ]
  },
  {
    key: "communication",
    title: "Clear communication",
    description: "Understand needs, repair quickly, and feel heard.",
    type: "text",
    questions: [
      {
        prompt: "When you feel stressed, what is the best way for me to check in?"
      },
      {
        prompt: "What topic do you wish we talked about more openly?"
      },
      {
        prompt: "What helps you feel heard when we disagree?"
      },
      {
        prompt: "How do you like to receive apologies or repair after tension?"
      },
      {
        prompt: "Is there a boundary or need you want me to know about?"
      },
      {
        prompt: "What do you wish I understood about your day-to-day load?"
      },
      {
        prompt: "What tone or phrase helps you feel safe to share honestly?"
      },
      {
        prompt: "What is one request you have for how we communicate this month?"
      }
    ]
  },
  {
    key: "lights-off",
    title: "Lights off",
    description: "Intimacy preferences answered with quick picks.",
    type: "single",
    questions: [
      {
        prompt: "What kind of touch do you crave most lately?",
        answerType: "single",
        options: [
          { label: "Slow and gentle", value: "slow_gentle" },
          { label: "Playful and teasing", value: "playful_teasing" },
          { label: "Deep pressure", value: "deep_pressure" },
          { label: "Surprise kisses", value: "surprise_kisses" }
        ]
      },
      {
        prompt: "What pace feels best right now?",
        answerType: "single",
        options: [
          { label: "Unhurried and soft", value: "unhurried_soft" },
          { label: "Builds slowly", value: "builds_slowly" },
          { label: "Quick and spontaneous", value: "quick_spontaneous" },
          { label: "Depends on the mood", value: "depends_on_mood" }
        ]
      },
      {
        prompt: "Where do you want more attention?",
        answerType: "single",
        options: [
          { label: "Neck and shoulders", value: "neck_shoulders" },
          { label: "Back and hips", value: "back_hips" },
          { label: "Hands and arms", value: "hands_arms" },
          { label: "Everywhere", value: "everywhere" }
        ]
      },
      {
        prompt: "What sets the mood most?",
        answerType: "single",
        options: [
          { label: "Dim lights", value: "dim_lights" },
          { label: "Music", value: "music" },
          { label: "Warm shower", value: "warm_shower" },
          { label: "Clean sheets", value: "clean_sheets" }
        ]
      },
      {
        prompt: "How do you want me to initiate?",
        answerType: "single",
        options: [
          { label: "Direct and confident", value: "direct_confident" },
          { label: "Flirty hints", value: "flirty_hints" },
          { label: "Start with a cuddle", value: "cuddle_start" },
          { label: "Let me initiate", value: "let_me_initiate" }
        ]
      },
      {
        prompt: "What kind of words feel best?",
        answerType: "single",
        options: [
          { label: "Sweet and romantic", value: "sweet_romantic" },
          { label: "Playful and bold", value: "playful_bold" },
          { label: "Quiet reassurance", value: "quiet_reassurance" },
          { label: "Less talk, more touch", value: "less_talk" }
        ]
      },
      {
        prompt: "What aftercare helps you feel close?",
        answerType: "single",
        options: [
          { label: "Cuddling", value: "cuddling" },
          { label: "Talking", value: "talking" },
          { label: "A drink or snack", value: "drink_snack" },
          { label: "Space to relax", value: "space" }
        ]
      },
      {
        prompt: "How often would you like to make time for this?",
        answerType: "single",
        options: [
          { label: "A little more often", value: "more_often" },
          { label: "About the same", value: "same" },
          { label: "Less pressure, more quality", value: "less_pressure" },
          { label: "Let's talk about it", value: "talk_about_it" }
        ]
      }
    ]
  }
];

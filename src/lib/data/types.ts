export type RevealStatus = "draft" | "awaiting" | "completed";

export type Reveal = {
  id: string;
  purchaserEmail: string;
  purchaserUserId?: string | null;
  name: string | null;
  status: RevealStatus;
  respondentName?: string | null;
  questionSetId?: string | null;
  quizStartedAt?: string | null;
  quizLockedBy?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type QuestionSet = {
  id: string;
  key: string;
  title: string;
  description: string;
  type: "text" | "single";
};

export type QuestionOption = {
  id: string;
  questionId: string;
  label: string;
  value: string;
  order: number;
};

export type Question = {
  id: string;
  questionSetId?: string | null;
  prompt: string;
  order: number;
  active: boolean;
  answerType: "text" | "single";
  options?: QuestionOption[];
};

export type Answer = {
  id: string;
  revealId: string;
  questionId: string;
  response: string;
  selectedOptionId?: string | null;
  createdAt: string;
};

export type FeedbackSource = "respondent" | "purchaser";

export type Feedback = {
  id: string;
  revealId: string;
  source: FeedbackSource;
  rating: boolean;
  note?: string | null;
  createdAt: string;
};

export type QuizStartStatus = "ok" | "locked" | "completed" | "not_found";

export type QuizStartResult = {
  status: QuizStartStatus;
  reveal?: Reveal | null;
};

export type Coupon = {
  id: string;
  code: string;
  percentOff: number;
  active: boolean;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  redemptions: number;
  createdAt: string;
  updatedAt: string;
};

export type CouponAttempt = {
  id: string;
  attemptKey: string;
  attempts: number;
  cooldownUntil?: string | null;
  bannedUntil?: string | null;
  updatedAt: string;
};

export type FeatureFlag = {
  id: string;
  key: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updatedAt: string;
};

export type AdminAuditLog = {
  id: string;
  adminUserId?: string | null;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

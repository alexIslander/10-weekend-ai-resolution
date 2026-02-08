import type {
  Answer,
  Coupon,
  CouponAttempt,
  Feedback,
  FeedbackSource,
  FeatureFlag,
  Question,
  QuestionSet,
  QuizStartResult,
  Reveal
} from "@/lib/data/types";

export type RevealFilter = {
  status?: string | null;
};

export type DataStore = {
  getRevealById: (id: string) => Promise<Reveal | null>;
  getRevealByEmail: (email: string) => Promise<Reveal | null>;
  createReveal: (email: string, questionSetId?: string | null) => Promise<Reveal>;
  updateRevealName: (id: string, name: string) => Promise<Reveal | null>;
  updateRevealQuestionSet: (
    id: string,
    questionSetId: string
  ) => Promise<Reveal | null>;
  startRevealQuiz: (id: string, lockId: string) => Promise<QuizStartResult>;
  completeReveal: (
    id: string,
    respondentName: string,
    answers: Array<{
      questionId: string;
      response: string;
      selectedOptionId?: string | null;
    }>
  ) => Promise<Reveal | null>;
  listReveals: (filter?: RevealFilter) => Promise<Reveal[]>;
  listAnswers: (revealId: string) => Promise<Answer[]>;
  listQuestionSets: () => Promise<QuestionSet[]>;
  getQuestionSetByKey: (key: string) => Promise<QuestionSet | null>;
  listQuestions: (questionSetId?: string | null) => Promise<Question[]>;
  updateQuestions: (questions: Array<{ id: string; prompt: string }>) => Promise<void>;
  resetQuestions: () => Promise<Question[]>;
  createFeedback: (
    revealId: string,
    source: FeedbackSource,
    rating: boolean,
    note?: string | null
  ) => Promise<Feedback>;
  listFeedback: (limit?: number) => Promise<Feedback[]>;
  getFeatureFlag: (key: string) => Promise<FeatureFlag | null>;
  upsertFeatureFlag: (
    key: string,
    enabled: boolean,
    config?: Record<string, unknown>
  ) => Promise<FeatureFlag>;
  getCouponByCode: (code: string) => Promise<Coupon | null>;
  createCoupon: (
    code: string,
    percentOff: number,
    expiresAt?: string | null,
    maxRedemptions?: number | null
  ) => Promise<Coupon>;
  revokeCoupon: (code: string) => Promise<Coupon | null>;
  incrementCouponRedemptions: (code: string) => Promise<void>;
  getCouponAttempt: (attemptKey: string) => Promise<CouponAttempt | null>;
  upsertCouponAttempt: (
    attemptKey: string,
    updates: Partial<CouponAttempt>
  ) => Promise<CouponAttempt>;
  purgeExpiredReveals: (cutoffIso: string) => Promise<number>;
  logAdminAction: (
    action: string,
    metadata: Record<string, unknown>,
    adminUserId?: string | null
  ) => Promise<void>;
};

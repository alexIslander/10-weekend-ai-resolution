import type {
  Answer,
  Coupon,
  CouponAttempt,
  FeatureFlag,
  Question,
  Reveal
} from "@/lib/data/types";

export type RevealFilter = {
  status?: string | null;
};

export type DataStore = {
  getRevealById: (id: string) => Promise<Reveal | null>;
  getRevealByEmail: (email: string) => Promise<Reveal | null>;
  createReveal: (email: string) => Promise<Reveal>;
  updateRevealName: (id: string, name: string) => Promise<Reveal | null>;
  completeReveal: (
    id: string,
    respondentName: string,
    answers: Array<{ questionId: string; response: string }>
  ) => Promise<Reveal | null>;
  listReveals: (filter?: RevealFilter) => Promise<Reveal[]>;
  listAnswers: (revealId: string) => Promise<Answer[]>;
  listQuestions: () => Promise<Question[]>;
  updateQuestions: (questions: Array<{ id: string; prompt: string }>) => Promise<void>;
  resetQuestions: () => Promise<Question[]>;
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

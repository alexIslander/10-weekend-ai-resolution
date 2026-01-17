export type RevealStatus = "draft" | "awaiting" | "completed";

export type Reveal = {
  id: string;
  purchaserEmail: string;
  purchaserUserId?: string | null;
  name: string | null;
  status: RevealStatus;
  respondentName?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type Question = {
  id: string;
  prompt: string;
  order: number;
  active: boolean;
};

export type Answer = {
  id: string;
  revealId: string;
  questionId: string;
  response: string;
  createdAt: string;
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

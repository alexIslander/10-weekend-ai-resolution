import { defaultQuestions } from "@/lib/questions";
import { nowIso } from "@/lib/utils";
import type {
  AdminAuditLog,
  Answer,
  Coupon,
  CouponAttempt,
  FeatureFlag,
  Question,
  Reveal
} from "@/lib/data/types";
import type { DataStore, RevealFilter } from "@/lib/data/store";

const createId = () => crypto.randomUUID();

type MemoryDb = {
  reveals: Reveal[];
  questions: Question[];
  answers: Answer[];
  coupons: Coupon[];
  attempts: CouponAttempt[];
  flags: FeatureFlag[];
  auditLogs: AdminAuditLog[];
};

const seedQuestions = (): Question[] =>
  defaultQuestions.map((prompt, index) => ({
    id: createId(),
    prompt,
    order: index + 1,
    active: true
  }));

const getDb = (): MemoryDb => {
  const globalStore = globalThis as typeof globalThis & { __dualreveal?: MemoryDb };
  if (!globalStore.__dualreveal) {
    globalStore.__dualreveal = {
      reveals: [],
      questions: seedQuestions(),
      answers: [],
      coupons: [],
      attempts: [],
      flags: [],
      auditLogs: []
    };
  }
  return globalStore.__dualreveal;
};

export const memoryStore: DataStore = {
  async getRevealById(id: string) {
    const db = getDb();
    return db.reveals.find((reveal) => reveal.id === id) ?? null;
  },
  async getRevealByEmail(email: string) {
    const db = getDb();
    const sorted = db.reveals
      .filter((reveal) => reveal.purchaserEmail === email)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted[0] ?? null;
  },
  async createReveal(email: string) {
    const db = getDb();
    const reveal: Reveal = {
      id: createId(),
      purchaserEmail: email,
      purchaserUserId: null,
      name: null,
      status: "awaiting",
      respondentName: null,
      createdAt: nowIso(),
      completedAt: null
    };
    db.reveals.push(reveal);
    return reveal;
  },
  async updateRevealName(id: string, name: string) {
    const db = getDb();
    const reveal = db.reveals.find((item) => item.id === id);
    if (!reveal) return null;
    reveal.name = name;
    return reveal;
  },
  async completeReveal(id: string, respondentName: string, answers) {
    const db = getDb();
    const reveal = db.reveals.find((item) => item.id === id);
    if (!reveal) return null;
    reveal.status = "completed";
    reveal.respondentName = respondentName;
    reveal.completedAt = nowIso();

    answers.forEach((answer) => {
      const existing = db.answers.find(
        (item) => item.revealId === id && item.questionId === answer.questionId
      );
      if (existing) {
        existing.response = answer.response;
        return;
      }
      db.answers.push({
        id: createId(),
        revealId: id,
        questionId: answer.questionId,
        response: answer.response,
        createdAt: nowIso()
      });
    });

    return reveal;
  },
  async listReveals(filter?: RevealFilter) {
    const db = getDb();
    const filtered = filter?.status
      ? db.reveals.filter((item) => item.status === filter.status)
      : [...db.reveals];
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async listAnswers(revealId: string) {
    const db = getDb();
    return db.answers.filter((answer) => answer.revealId === revealId);
  },
  async listQuestions() {
    const db = getDb();
    if (db.questions.length === 0) {
      db.questions = seedQuestions();
    }
    return [...db.questions].sort((a, b) => a.order - b.order);
  },
  async updateQuestions(questions) {
    const db = getDb();
    db.questions = db.questions.map((question) => {
      const match = questions.find((item) => item.id === question.id);
      return match ? { ...question, prompt: match.prompt } : question;
    });
  },
  async resetQuestions() {
    const db = getDb();
    db.questions = seedQuestions();
    return db.questions;
  },
  async getFeatureFlag(key: string) {
    const db = getDb();
    return db.flags.find((flag) => flag.key === key) ?? null;
  },
  async upsertFeatureFlag(key: string, enabled: boolean, config = {}) {
    const db = getDb();
    const existing = db.flags.find((flag) => flag.key === key);
    const updated: FeatureFlag = {
      id: existing?.id ?? createId(),
      key,
      enabled,
      config,
      updatedAt: nowIso()
    };
    if (existing) {
      Object.assign(existing, updated);
    } else {
      db.flags.push(updated);
    }
    return updated;
  },
  async getCouponByCode(code: string) {
    const db = getDb();
    return (
      db.coupons.find((coupon) => coupon.code.toLowerCase() === code.toLowerCase()) ??
      null
    );
  },
  async createCoupon(code, percentOff, expiresAt, maxRedemptions) {
    const db = getDb();
    const coupon: Coupon = {
      id: createId(),
      code,
      percentOff,
      active: true,
      expiresAt: expiresAt ?? null,
      maxRedemptions: maxRedemptions ?? null,
      redemptions: 0,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    db.coupons.push(coupon);
    return coupon;
  },
  async revokeCoupon(code) {
    const db = getDb();
    const coupon = db.coupons.find(
      (item) => item.code.toLowerCase() === code.toLowerCase()
    );
    if (!coupon) return null;
    coupon.active = false;
    coupon.updatedAt = nowIso();
    return coupon;
  },
  async incrementCouponRedemptions(code) {
    const db = getDb();
    const coupon = db.coupons.find(
      (item) => item.code.toLowerCase() === code.toLowerCase()
    );
    if (!coupon) return;
    coupon.redemptions += 1;
    coupon.updatedAt = nowIso();
  },
  async getCouponAttempt(attemptKey: string) {
    const db = getDb();
    return db.attempts.find((attempt) => attempt.attemptKey === attemptKey) ?? null;
  },
  async upsertCouponAttempt(attemptKey: string, updates) {
    const db = getDb();
    const existing = db.attempts.find((attempt) => attempt.attemptKey === attemptKey);
    const updated: CouponAttempt = {
      id: existing?.id ?? createId(),
      attemptKey,
      attempts: updates.attempts ?? existing?.attempts ?? 0,
      cooldownUntil: updates.cooldownUntil ?? existing?.cooldownUntil ?? null,
      bannedUntil: updates.bannedUntil ?? existing?.bannedUntil ?? null,
      updatedAt: nowIso()
    };
    if (existing) {
      Object.assign(existing, updated);
    } else {
      db.attempts.push(updated);
    }
    return updated;
  },
  async purgeExpiredReveals(cutoffIso: string) {
    const db = getDb();
    const cutoff = new Date(cutoffIso);
    const expiredIds = db.reveals
      .filter((reveal) => reveal.completedAt && new Date(reveal.completedAt) < cutoff)
      .map((reveal) => reveal.id);
    db.reveals = db.reveals.filter((reveal) => !expiredIds.includes(reveal.id));
    db.answers = db.answers.filter((answer) => !expiredIds.includes(answer.revealId));
    return expiredIds.length;
  },
  async logAdminAction(action, metadata, adminUserId) {
    const db = getDb();
    db.auditLogs.push({
      id: createId(),
      adminUserId: adminUserId ?? null,
      action,
      metadata,
      createdAt: nowIso()
    });
  }
};

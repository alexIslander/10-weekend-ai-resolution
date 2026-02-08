import { questionSets } from "@/lib/questions";
import { nowIso } from "@/lib/utils";
import type {
  AdminAuditLog,
  Answer,
  Coupon,
  CouponAttempt,
  Feedback,
  FeedbackSource,
  FeatureFlag,
  Question,
  QuestionOption,
  QuestionSet,
  QuizStartResult,
  Reveal
} from "@/lib/data/types";
import type { DataStore, RevealFilter } from "@/lib/data/store";

const createId = () => crypto.randomUUID();

type MemoryDb = {
  reveals: Reveal[];
  questionSets: QuestionSet[];
  questions: Question[];
  questionOptions: QuestionOption[];
  feedback: Feedback[];
  answers: Answer[];
  coupons: Coupon[];
  attempts: CouponAttempt[];
  flags: FeatureFlag[];
  auditLogs: AdminAuditLog[];
};

const seedQuestionData = (): {
  questionSets: QuestionSet[];
  questions: Question[];
  questionOptions: QuestionOption[];
} => {
  const questionSetsSeed: QuestionSet[] = questionSets.map((set) => ({
    id: createId(),
    key: set.key,
    title: set.title,
    description: set.description,
    type: set.type
  }));
  const setIdByKey = new Map(questionSetsSeed.map((set) => [set.key, set.id]));
  const questionsSeed: Question[] = [];
  const optionsSeed: QuestionOption[] = [];

  questionSets.forEach((set) => {
    const setId = setIdByKey.get(set.key);
    if (!setId) return;
    set.questions.forEach((question, index) => {
      const answerType = question.answerType ?? (set.type === "single" ? "single" : "text");
      const questionId = createId();
      questionsSeed.push({
        id: questionId,
        questionSetId: setId,
        prompt: question.prompt,
        order: index + 1,
        active: true,
        answerType
      });
      if (answerType === "single" && question.options) {
        question.options.forEach((option, optionIndex) => {
          optionsSeed.push({
            id: createId(),
            questionId,
            label: option.label,
            value: option.value,
            order: optionIndex + 1
          });
        });
      }
    });
  });

  return {
    questionSets: questionSetsSeed,
    questions: questionsSeed,
    questionOptions: optionsSeed
  };
};

const getDb = (): MemoryDb => {
  const globalStore = globalThis as typeof globalThis & { __dualreveal?: MemoryDb };
  if (!globalStore.__dualreveal) {
    const seeded = seedQuestionData();
    globalStore.__dualreveal = {
      reveals: [],
      questionSets: seeded.questionSets,
      questions: seeded.questions,
      questionOptions: seeded.questionOptions,
      feedback: [],
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
  async createReveal(email: string, questionSetId?: string | null) {
    const db = getDb();
    const reveal: Reveal = {
      id: createId(),
      purchaserEmail: email,
      purchaserUserId: null,
      name: null,
      status: "awaiting",
      respondentName: null,
      questionSetId: questionSetId ?? null,
      quizStartedAt: null,
      quizLockedBy: null,
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
  async updateRevealQuestionSet(id: string, questionSetId: string) {
    const db = getDb();
    const reveal = db.reveals.find((item) => item.id === id);
    if (!reveal) return null;
    reveal.questionSetId = questionSetId;
    return reveal;
  },
  async startRevealQuiz(id: string, lockId: string): Promise<QuizStartResult> {
    const db = getDb();
    const reveal = db.reveals.find((item) => item.id === id);
    if (!reveal) return { status: "not_found" };
    if (reveal.status === "completed") return { status: "completed", reveal };
    if (!reveal.quizStartedAt) {
      reveal.quizStartedAt = nowIso();
      reveal.quizLockedBy = lockId;
      return { status: "ok", reveal };
    }
    if (reveal.quizLockedBy && reveal.quizLockedBy !== lockId) {
      return { status: "locked", reveal };
    }
    return { status: "ok", reveal };
  },
  async completeReveal(id: string, respondentName: string, answers) {
    const db = getDb();
    const reveal = db.reveals.find((item) => item.id === id);
    if (!reveal) return null;
    reveal.status = "completed";
    reveal.respondentName = respondentName;
    reveal.completedAt = nowIso();
    reveal.quizLockedBy = null;

    answers.forEach((answer) => {
      const existing = db.answers.find(
        (item) => item.revealId === id && item.questionId === answer.questionId
      );
      if (existing) {
        existing.response = answer.response;
        existing.selectedOptionId = answer.selectedOptionId ?? null;
        return;
      }
      db.answers.push({
        id: createId(),
        revealId: id,
        questionId: answer.questionId,
        response: answer.response,
        selectedOptionId: answer.selectedOptionId ?? null,
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
  async listQuestionSets() {
    const db = getDb();
    return [...db.questionSets];
  },
  async getQuestionSetByKey(key: string) {
    const db = getDb();
    return db.questionSets.find((set) => set.key === key) ?? null;
  },
  async listQuestions(questionSetId?: string | null) {
    const db = getDb();
    if (db.questions.length === 0) {
      const seeded = seedQuestionData();
      db.questionSets = seeded.questionSets;
      db.questions = seeded.questions;
      db.questionOptions = seeded.questionOptions;
    }
    const filtered = questionSetId
      ? db.questions.filter((question) => question.questionSetId === questionSetId)
      : [...db.questions];
    const optionsByQuestion = db.questionOptions.reduce(
      (acc, option) => {
        const current = acc.get(option.questionId) ?? [];
        current.push(option);
        acc.set(option.questionId, current);
        return acc;
      },
      new Map<string, QuestionOption[]>()
    );
    return filtered
      .map((question) => ({
        ...question,
        options: (optionsByQuestion.get(question.id) ?? []).sort(
          (a, b) => a.order - b.order
        )
      }))
      .sort((a, b) => a.order - b.order);
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
    const seeded = seedQuestionData();
    db.questionSets = seeded.questionSets;
    db.questions = seeded.questions;
    db.questionOptions = seeded.questionOptions;
    return db.questions;
  },
  async createFeedback(revealId, source, rating, note) {
    const db = getDb();
    const feedback: Feedback = {
      id: createId(),
      revealId,
      source,
      rating,
      note: note ?? null,
      createdAt: nowIso()
    };
    db.feedback.push(feedback);
    return feedback;
  },
  async listFeedback(limit = 25) {
    const db = getDb();
    return [...db.feedback]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
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

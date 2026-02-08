import { questionSets } from "@/lib/questions";
import { nowIso } from "@/lib/utils";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type {
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

type InsertedQuestion = { id: string; question_set_id: string; sort_order: number };
type RevealRow = Database["public"]["Tables"]["reveals"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type QuestionOptionRow = Database["public"]["Tables"]["question_options"]["Row"];

const mapReveal = (row: Database["public"]["Tables"]["reveals"]["Row"]): Reveal => ({
  id: row.id,
  purchaserEmail: row.purchaser_email,
  purchaserUserId: row.purchaser_user_id,
  name: row.name,
  status: row.status as Reveal["status"],
  respondentName: row.respondent_name,
  questionSetId: row.question_set_id,
  quizStartedAt: row.quiz_started_at,
  quizLockedBy: row.quiz_locked_by,
  createdAt: row.created_at,
  completedAt: row.completed_at
});

const mapQuestion = (row: Database["public"]["Tables"]["questions"]["Row"]): Question => ({
  id: row.id,
  questionSetId: row.question_set_id,
  prompt: row.prompt,
  order: row.sort_order,
  active: row.active,
  answerType: (row.answer_type as Question["answerType"]) ?? "text"
});

const mapAnswer = (row: Database["public"]["Tables"]["answers"]["Row"]): Answer => ({
  id: row.id,
  revealId: row.reveal_id,
  questionId: row.question_id,
  response: row.response,
  selectedOptionId: row.selected_option_id,
  createdAt: row.created_at
});

const mapFeedback = (
  row: Database["public"]["Tables"]["feedback"]["Row"]
): Feedback => ({
  id: row.id,
  revealId: row.reveal_id,
  source: row.source as FeedbackSource,
  rating: row.rating,
  note: row.note,
  createdAt: row.created_at
});

const mapQuestionSet = (
  row: Database["public"]["Tables"]["question_sets"]["Row"]
): QuestionSet => ({
  id: row.id,
  key: row.key,
  title: row.title,
  description: row.description,
  type: row.type as QuestionSet["type"]
});

const mapQuestionOption = (
  row: Database["public"]["Tables"]["question_options"]["Row"]
): QuestionOption => ({
  id: row.id,
  questionId: row.question_id,
  label: row.label,
  value: row.value,
  order: row.sort_order
});

const mapCoupon = (row: Database["public"]["Tables"]["coupons"]["Row"]): Coupon => ({
  id: row.id,
  code: row.code,
  percentOff: row.percent_off,
  active: row.active,
  expiresAt: row.expires_at,
  maxRedemptions: row.max_redemptions,
  redemptions: row.redemptions,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapAttempt = (
  row: Database["public"]["Tables"]["coupon_attempts"]["Row"]
): CouponAttempt => ({
  id: row.id,
  attemptKey: row.attempt_key,
  attempts: row.attempts,
  cooldownUntil: row.cooldown_until,
  bannedUntil: row.banned_until,
  updatedAt: row.updated_at
});

const mapFlag = (
  row: Database["public"]["Tables"]["feature_flags"]["Row"]
): FeatureFlag => ({
  id: row.id,
  key: row.key,
  enabled: row.enabled,
  config: (row.config as Record<string, unknown>) ?? {},
  updatedAt: row.updated_at
});

const requireClient = () => {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error("Supabase admin client is not configured.");
  }
  return client;
};

const seedQuestionSetsIfNeeded = async () => {
  const client = requireClient();
  const { data: existing, error } = await client
    .from("question_sets")
    .select("id")
    .limit(1);
  if (error) throw error;
  if (existing && existing.length > 0) return;

  const setsPayload: Database["public"]["Tables"]["question_sets"]["Insert"][] =
    questionSets.map((set) => ({
      key: set.key,
      title: set.title,
      description: set.description,
      type: set.type,
      created_at: nowIso(),
      updated_at: nowIso()
    }));

  // Supabase client types infer insert as never for this table; payload matches Insert shape
  const { data: insertedSets, error: setsError } = await client
    .from("question_sets")
    .insert(setsPayload as never)
    .select("id,key");
  if (setsError) throw setsError;

  type InsertedSet = { id: string; key: string };
  const setIdByKey = new Map<string, string>(
    ((insertedSets ?? []) as InsertedSet[]).map((set) => [set.key, set.id])
  );

  const questionPayload: Array<Database["public"]["Tables"]["questions"]["Insert"]> =
    [];
  const optionSeed: Array<{
    questionSetKey: string;
    sortOrder: number;
    options: { label: string; value: string }[];
  }> = [];

  questionSets.forEach((set) => {
    const setId = setIdByKey.get(set.key);
    if (!setId) return;
    set.questions.forEach((question, index) => {
      const answerType = question.answerType ?? (set.type === "single" ? "single" : "text");
      questionPayload.push({
        question_set_id: setId,
        prompt: question.prompt,
        sort_order: index + 1,
        active: true,
        answer_type: answerType,
        created_at: nowIso(),
        updated_at: nowIso()
      });
      if (answerType === "single" && question.options) {
        optionSeed.push({
          questionSetKey: set.key,
          sortOrder: index + 1,
          options: question.options
        });
      }
    });
  });

  const { data: insertedQuestions, error: questionsError } = await client
    .from("questions")
    .insert(questionPayload as never)
    .select("id,question_set_id,sort_order");
  if (questionsError) throw questionsError;

  const questionByKey = new Map(
    ((insertedQuestions ?? []) as InsertedQuestion[]).map((question) => [
      `${question.question_set_id}:${question.sort_order}`,
      question.id
    ])
  );

  const optionsPayload: Array<
    Database["public"]["Tables"]["question_options"]["Insert"]
  > = [];
  optionSeed.forEach((seed) => {
    const setId = setIdByKey.get(seed.questionSetKey);
    if (!setId) return;
    const questionId = questionByKey.get(`${setId}:${seed.sortOrder}`);
    if (!questionId) return;
    seed.options.forEach((option, optionIndex) => {
      optionsPayload.push({
        question_id: questionId,
        label: option.label,
        value: option.value,
        sort_order: optionIndex + 1,
        created_at: nowIso(),
        updated_at: nowIso()
      });
    });
  });

  if (optionsPayload.length > 0) {
    const { error: optionsError } = await client
      .from("question_options")
      .insert(optionsPayload as never);
    if (optionsError) throw optionsError;
  }
};

export const supabaseStore: DataStore = {
  async getRevealById(id) {
    const client = requireClient();
    const { data, error } = await client
      .from("reveals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapReveal(data) : null;
  },
  async getRevealByEmail(email) {
    const client = requireClient();
    const { data, error } = await client
      .from("reveals")
      .select("*")
      .eq("purchaser_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapReveal(data) : null;
  },
  async createReveal(email, questionSetId) {
    const client = requireClient();
    const { data, error } = await client
      .from("reveals")
      .insert({
        purchaser_email: email,
        question_set_id: questionSetId ?? null,
        status: "awaiting",
        created_at: nowIso()
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapReveal(data);
  },
  async updateRevealName(id, name) {
    const client = requireClient();
    const { data, error } = await client
      .from("reveals")
      .update({ name } as never)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? mapReveal(data) : null;
  },
  async updateRevealQuestionSet(id, questionSetId) {
    const client = requireClient();
    const { data, error } = await client
      .from("reveals")
      .update({ question_set_id: questionSetId } as never)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? mapReveal(data) : null;
  },
  async startRevealQuiz(id, lockId): Promise<QuizStartResult> {
    const client = requireClient();
    const { data: reveal, error } = await client
      .from("reveals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!reveal) return { status: "not_found" };
    const row = reveal as RevealRow;
    if (row.status === "completed") {
      return { status: "completed", reveal: mapReveal(row) };
    }

    if (!row.quiz_started_at) {
      const { data: updated, error: updateError } = await client
        .from("reveals")
        .update({
          quiz_started_at: nowIso(),
          quiz_locked_by: lockId
        } as never)
        .eq("id", id)
        .is("quiz_started_at", null)
        .select("*")
        .maybeSingle();
      if (updateError) throw updateError;
      if (updated) return { status: "ok", reveal: mapReveal(updated as RevealRow) };
    }

    if (row.quiz_locked_by && row.quiz_locked_by !== lockId) {
      return { status: "locked", reveal: mapReveal(row) };
    }
    return { status: "ok", reveal: mapReveal(row) };
  },
  async completeReveal(id, respondentName, answers) {
    const client = requireClient();
    const { data: reveal, error } = await client
      .from("reveals")
      .update({
        status: "completed",
        respondent_name: respondentName,
        completed_at: nowIso(),
        quiz_locked_by: null
      } as never)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!reveal) return null;

    if (answers.length > 0) {
      const payload = answers.map((answer) => ({
        reveal_id: id,
        question_id: answer.questionId,
        response: answer.response,
        selected_option_id: answer.selectedOptionId ?? null,
        created_at: nowIso()
      }));
      const { error: insertError } = await client
        .from("answers")
        .upsert(payload as never, { onConflict: "reveal_id,question_id" });
      if (insertError) throw insertError;
    }

    return mapReveal(reveal);
  },
  async listReveals(filter?: RevealFilter) {
    const client = requireClient();
    let query = client.from("reveals").select("*");
    if (filter?.status) {
      query = query.eq("status", filter.status);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(mapReveal);
  },
  async listAnswers(revealId) {
    const client = requireClient();
    const { data, error } = await client
      .from("answers")
      .select("*")
      .eq("reveal_id", revealId);
    if (error) throw error;
    return data.map(mapAnswer);
  },
  async listQuestionSets() {
    await seedQuestionSetsIfNeeded();
    const client = requireClient();
    const { data, error } = await client
      .from("question_sets")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data.map(mapQuestionSet);
  },
  async getQuestionSetByKey(key: string) {
    await seedQuestionSetsIfNeeded();
    const client = requireClient();
    const { data, error } = await client
      .from("question_sets")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? mapQuestionSet(data) : null;
  },
  async listQuestions(questionSetId?: string | null) {
    await seedQuestionSetsIfNeeded();
    const client = requireClient();
    let query = client.from("questions").select("*").eq("active", true);
    if (questionSetId) {
      query = query.eq("question_set_id", questionSetId);
    }
    const { data: questionsData, error } = await query.order("sort_order", {
      ascending: true
    });
    if (error) throw error;
    const questions = (questionsData ?? []) as QuestionRow[];
    const questionIds = questions.map((question) => question.id);
    const optionsByQuestion = new Map<string, QuestionOption[]>();
    if (questionIds.length > 0) {
      const { data: optionsData, error: optionsError } = await client
        .from("question_options")
        .select("*")
        .in("question_id", questionIds)
        .order("sort_order", { ascending: true });
      if (optionsError) throw optionsError;
      const options = (optionsData ?? []) as QuestionOptionRow[];
      options.forEach((option) => {
        const mapped = mapQuestionOption(option);
        const current = optionsByQuestion.get(mapped.questionId) ?? [];
        current.push(mapped);
        optionsByQuestion.set(mapped.questionId, current);
      });
    }
    return questions.map((question) => ({
      ...mapQuestion(question),
      options: optionsByQuestion.get(question.id) ?? []
    }));
  },
  async updateQuestions(questions) {
    const client = requireClient();
    for (const question of questions) {
      const { error } = await client
        .from("questions")
        .update({ prompt: question.prompt, updated_at: nowIso() } as never)
        .eq("id", question.id);
      if (error) throw error;
    }
  },
  async resetQuestions() {
    const client = requireClient();
    await seedQuestionSetsIfNeeded();
    await client
      .from("question_options")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await client
      .from("questions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const { data: setsData, error: setsError } = await client
      .from("question_sets")
      .select("id,key");
    if (setsError) throw setsError;
    const sets = (setsData ?? []) as { id: string; key: string }[];
    const setIdByKey = new Map(sets.map((set) => [set.key, set.id]));

    const questionPayload: Array<Database["public"]["Tables"]["questions"]["Insert"]> =
      [];
    const optionSeed: Array<{
      questionSetKey: string;
      sortOrder: number;
      options: { label: string; value: string }[];
    }> = [];

    questionSets.forEach((set) => {
      const setId = setIdByKey.get(set.key);
      if (!setId) return;
      set.questions.forEach((question, index) => {
        const answerType = question.answerType ?? (set.type === "single" ? "single" : "text");
        questionPayload.push({
          question_set_id: setId,
          prompt: question.prompt,
          sort_order: index + 1,
          active: true,
          answer_type: answerType,
          created_at: nowIso(),
          updated_at: nowIso()
        });
        if (answerType === "single" && question.options) {
          optionSeed.push({
            questionSetKey: set.key,
            sortOrder: index + 1,
            options: question.options
          });
        }
      });
    });

    const { data: insertedQuestions, error: questionError } = await client
      .from("questions")
      .insert(questionPayload as never)
      .select("id,question_set_id,sort_order");
    if (questionError) throw questionError;

    const questionByKey = new Map(
      ((insertedQuestions ?? []) as InsertedQuestion[]).map((question) => [
        `${question.question_set_id}:${question.sort_order}`,
        question.id
      ])
    );
    const optionsPayload: Array<
      Database["public"]["Tables"]["question_options"]["Insert"]
    > = [];
    optionSeed.forEach((seed) => {
      const setId = setIdByKey.get(seed.questionSetKey);
      if (!setId) return;
      const questionId = questionByKey.get(`${setId}:${seed.sortOrder}`);
      if (!questionId) return;
      seed.options.forEach((option, index) => {
        optionsPayload.push({
          question_id: questionId,
          label: option.label,
          value: option.value,
          sort_order: index + 1,
          created_at: nowIso(),
          updated_at: nowIso()
        });
      });
    });

    if (optionsPayload.length > 0) {
      const { error: optionsError } = await client
        .from("question_options")
        .insert(optionsPayload as never);
      if (optionsError) throw optionsError;
    }

    const { data: finalQuestionsData, error: finalError } = await client
      .from("questions")
      .select("*")
      .order("sort_order", { ascending: true });
    if (finalError) throw finalError;
    const finalQuestions = (finalQuestionsData ?? []) as QuestionRow[];
    return finalQuestions.map(mapQuestion);
  },
  async createFeedback(revealId, source, rating, note) {
    const client = requireClient();
    const { data, error } = await client
      .from("feedback")
      .insert({
        reveal_id: revealId,
        source,
        rating,
        note: note ?? null,
        created_at: nowIso()
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapFeedback(data);
  },
  async listFeedback(limit = 25) {
    const client = requireClient();
    const { data, error } = await client
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.map(mapFeedback);
  },
  async getFeatureFlag(key) {
    const client = requireClient();
    const { data, error } = await client
      .from("feature_flags")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? mapFlag(data) : null;
  },
  async upsertFeatureFlag(key, enabled, config = {}) {
    const client = requireClient();
    const { data, error } = await client
      .from("feature_flags")
      .upsert({
        key,
        enabled,
        config,
        updated_at: nowIso()
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapFlag(data);
  },
  async getCouponByCode(code) {
    const client = requireClient();
    const { data, error } = await client
      .from("coupons")
      .select("*")
      .ilike("code", code)
      .maybeSingle();
    if (error) throw error;
    return data ? mapCoupon(data) : null;
  },
  async createCoupon(code, percentOff, expiresAt, maxRedemptions) {
    const client = requireClient();
    const { data, error } = await client
      .from("coupons")
      .insert({
        code: code.toUpperCase(),
        percent_off: percentOff,
        active: true,
        expires_at: expiresAt ?? null,
        max_redemptions: maxRedemptions ?? null,
        redemptions: 0,
        created_at: nowIso(),
        updated_at: nowIso()
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapCoupon(data);
  },
  async revokeCoupon(code) {
    const client = requireClient();
    const { data, error } = await client
      .from("coupons")
      .update({ active: false, updated_at: nowIso() } as never)
      .ilike("code", code)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? mapCoupon(data) : null;
  },
  async incrementCouponRedemptions(code) {
    const client = requireClient();
    const { data: couponData, error } = await client
      .from("coupons")
      .select("redemptions")
      .ilike("code", code)
      .maybeSingle();
    if (error) throw error;
    const redemptions = ((couponData as { redemptions?: number } | null)?.redemptions ?? 0) + 1;
    const { error: updateError } = await client
      .from("coupons")
      .update({ redemptions, updated_at: nowIso() } as never)
      .ilike("code", code);
    if (updateError) throw updateError;
  },
  async getCouponAttempt(attemptKey) {
    const client = requireClient();
    const { data, error } = await client
      .from("coupon_attempts")
      .select("*")
      .eq("attempt_key", attemptKey)
      .maybeSingle();
    if (error) throw error;
    return data ? mapAttempt(data) : null;
  },
  async upsertCouponAttempt(attemptKey, updates) {
    const client = requireClient();
    const payload = {
      attempt_key: attemptKey,
      attempts: updates.attempts,
      cooldown_until: updates.cooldownUntil,
      banned_until: updates.bannedUntil,
      updated_at: nowIso()
    };
    const { data, error } = await client
      .from("coupon_attempts")
      .upsert(payload as never)
      .select("*")
      .single();
    if (error) throw error;
    return mapAttempt(data);
  },
  async purgeExpiredReveals(cutoffIso) {
    const client = requireClient();
    const { data, error } = await client
      .from("reveals")
      .delete()
      .lt("completed_at", cutoffIso)
      .select("id");
    if (error) throw error;
    return data?.length ?? 0;
  },
  async logAdminAction(action, metadata, adminUserId) {
    const client = requireClient();
    const { error } = await client.from("admin_audit_logs").insert({
      admin_user_id: adminUserId ?? null,
      action,
      metadata,
      created_at: nowIso()
    } as never);
    if (error) throw error;
  }
};

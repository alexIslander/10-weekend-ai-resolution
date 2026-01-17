import { defaultQuestions } from "@/lib/questions";
import { nowIso } from "@/lib/utils";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type {
  Answer,
  Coupon,
  CouponAttempt,
  FeatureFlag,
  Question,
  Reveal
} from "@/lib/data/types";
import type { DataStore, RevealFilter } from "@/lib/data/store";

const mapReveal = (row: Database["public"]["Tables"]["reveals"]["Row"]): Reveal => ({
  id: row.id,
  purchaserEmail: row.purchaser_email,
  purchaserUserId: row.purchaser_user_id,
  name: row.name,
  status: row.status as Reveal["status"],
  respondentName: row.respondent_name,
  createdAt: row.created_at,
  completedAt: row.completed_at
});

const mapQuestion = (row: Database["public"]["Tables"]["questions"]["Row"]): Question => ({
  id: row.id,
  prompt: row.prompt,
  order: row.sort_order,
  active: row.active
});

const mapAnswer = (row: Database["public"]["Tables"]["answers"]["Row"]): Answer => ({
  id: row.id,
  revealId: row.reveal_id,
  questionId: row.question_id,
  response: row.response,
  createdAt: row.created_at
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

const seedQuestionsIfNeeded = async () => {
  const client = requireClient();
  const { data: existing, error } = await client
    .from("questions")
    .select("id")
    .limit(1);
  if (error) throw error;
  if (existing && existing.length > 0) return;

  const payload = defaultQuestions.map((prompt, index) => ({
    prompt,
    sort_order: index + 1,
    active: true,
    created_at: nowIso(),
    updated_at: nowIso()
  }));

  const { error: insertError } = await client.from("questions").insert(payload);
  if (insertError) throw insertError;
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
  async createReveal(email) {
    const client = requireClient();
    const { data, error } = await client
      .from("reveals")
      .insert({
        purchaser_email: email,
        status: "awaiting",
        created_at: nowIso()
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapReveal(data);
  },
  async updateRevealName(id, name) {
    const client = requireClient();
    const { data, error } = await client
      .from("reveals")
      .update({ name })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? mapReveal(data) : null;
  },
  async completeReveal(id, respondentName, answers) {
    const client = requireClient();
    const { data: reveal, error } = await client
      .from("reveals")
      .update({
        status: "completed",
        respondent_name: respondentName,
        completed_at: nowIso()
      })
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
        created_at: nowIso()
      }));
      const { error: insertError } = await client
        .from("answers")
        .upsert(payload, { onConflict: "reveal_id,question_id" });
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
  async listQuestions() {
    await seedQuestionsIfNeeded();
    const client = requireClient();
    const { data, error } = await client
      .from("questions")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data.map(mapQuestion);
  },
  async updateQuestions(questions) {
    const client = requireClient();
    for (const question of questions) {
      const { error } = await client
        .from("questions")
        .update({ prompt: question.prompt, updated_at: nowIso() })
        .eq("id", question.id);
      if (error) throw error;
    }
  },
  async resetQuestions() {
    const client = requireClient();
    await client.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const payload = defaultQuestions.map((prompt, index) => ({
      prompt,
      sort_order: index + 1,
      active: true,
      created_at: nowIso(),
      updated_at: nowIso()
    }));
    const { data, error } = await client
      .from("questions")
      .insert(payload)
      .select("*");
    if (error) throw error;
    return data.map(mapQuestion);
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
      })
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
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapCoupon(data);
  },
  async revokeCoupon(code) {
    const client = requireClient();
    const { data, error } = await client
      .from("coupons")
      .update({ active: false, updated_at: nowIso() })
      .ilike("code", code)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? mapCoupon(data) : null;
  },
  async incrementCouponRedemptions(code) {
    const client = requireClient();
    const { data, error } = await client
      .from("coupons")
      .select("redemptions")
      .ilike("code", code)
      .maybeSingle();
    if (error) throw error;
    const redemptions = (data?.redemptions ?? 0) + 1;
    const { error: updateError } = await client
      .from("coupons")
      .update({ redemptions, updated_at: nowIso() })
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
      .upsert(payload)
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
    });
    if (error) throw error;
  }
};

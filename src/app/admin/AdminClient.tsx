"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { clientEnv } from "@/lib/client-env";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Question, Reveal } from "@/lib/data/types";

type FeatureFlag = {
  key: string;
  enabled: boolean;
  config?: Record<string, unknown>;
};

type CouponForm = {
  code: string;
  percentOff: number;
  expiresAt?: string;
  maxRedemptions?: number;
};

export function AdminClient() {
  const [adminToken, setAdminToken] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [campaignEnabled, setCampaignEnabled] = useState(false);
  const [campaignPercent, setCampaignPercent] = useState(0);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [couponForm, setCouponForm] = useState<CouponForm>({
    code: "",
    percentOff: 20
  });
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [retentionMessage, setRetentionMessage] = useState<string | null>(null);

  const supabaseAvailable = Boolean(
    clientEnv.supabaseUrl && clientEnv.supabaseAnonKey
  );

  const authHeaders = useMemo(() => {
    if (accessToken) {
      return { Authorization: `Bearer ${accessToken}` };
    }
    if (adminToken) {
      return { "x-admin-token": adminToken };
    }
    return {};
  }, [accessToken, adminToken]);

  useEffect(() => {
    const storedToken = localStorage.getItem("dualreveal_admin_token") ?? "";
    setAdminToken(storedToken);
  }, []);

  useEffect(() => {
    if (!supabaseAvailable) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null);
    });

    const { data: subscription } = client.auth.onAuthStateChange(
      (_event, session) => {
        setAccessToken(session?.access_token ?? null);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [supabaseAvailable]);

  const fetchQuestions = async () => {
    const response = await fetch("/api/questions");
    const data = await response.json();
    setQuestions(data.questions ?? []);
  };

  const fetchCampaign = async () => {
    const response = await fetch("/api/admin/feature-flags", {
      headers: authHeaders
    });
    if (!response.ok) return;
    const data = await response.json();
    const flag = data.flag as FeatureFlag | null;
    if (flag) {
      setCampaignEnabled(flag.enabled);
      setCampaignPercent(Number(flag.config?.percentOff ?? 0));
    }
  };

  const fetchReveals = async () => {
    const query = statusFilter === "all" ? "" : `?status=${statusFilter}`;
    const response = await fetch(`/api/admin/reveals${query}`, {
      headers: authHeaders
    });
    if (!response.ok) return;
    const data = await response.json();
    setReveals(data.reveals ?? []);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (Object.keys(authHeaders).length === 0) return;
    fetchCampaign();
    fetchReveals();
  }, [authHeaders, statusFilter]);

  const handleSaveToken = () => {
    localStorage.setItem("dualreveal_admin_token", adminToken);
    setAuthMessage("Admin token saved.");
  };

  const handleMagicLink = async () => {
    const client = getSupabaseBrowserClient();
    if (!client || !email) return;
    const { error } = await client.auth.signInWithOtp({ email });
    setAuthMessage(
      error
        ? "Unable to send magic link."
        : "Check your email for the magic link."
    );
  };

  const handleQuestionsUpdate = async () => {
    const response = await fetch("/api/admin/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        questions: questions.map((question) => ({
          id: question.id,
          prompt: question.prompt
        }))
      })
    });
    setAuthMessage(response.ok ? "Questions saved." : "Save failed.");
  };

  const handleQuestionsReset = async () => {
    const response = await fetch("/api/admin/questions/reset", {
      method: "POST",
      headers: { ...authHeaders }
    });
    const data = await response.json();
    if (response.ok) {
      setQuestions(data.questions ?? []);
    }
    setAuthMessage(response.ok ? "Questions reset." : "Reset failed.");
  };

  const handleFlagUpdate = async () => {
    const response = await fetch("/api/admin/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        key: "campaign_discount",
        enabled: campaignEnabled,
        config: { percentOff: campaignPercent }
      })
    });
    setAuthMessage(response.ok ? "Campaign updated." : "Update failed.");
  };

  const handleCouponCreate = async () => {
    setCouponMessage(null);
    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        code: couponForm.code,
        percentOff: couponForm.percentOff,
        expiresAt: couponForm.expiresAt || null,
        maxRedemptions: couponForm.maxRedemptions || null
      })
    });
    const data = await response.json();
    setCouponMessage(response.ok ? "Coupon created." : data.error || "Failed.");
  };

  const handleCouponRevoke = async () => {
    setCouponMessage(null);
    const response = await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ code: couponForm.code })
    });
    const data = await response.json();
    setCouponMessage(response.ok ? "Coupon revoked." : data.error || "Failed.");
  };

  const handleRetentionPurge = async () => {
    setRetentionMessage(null);
    const response = await fetch("/api/admin/retention/purge", {
      method: "POST",
      headers: { ...authHeaders }
    });
    const data = await response.json();
    setRetentionMessage(
      response.ok
        ? `Deleted ${data.deleted} reveal(s) older than ${data.cutoff}.`
        : data.error || "Purge failed."
    );
  };

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <p className="kicker">Admin access</p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-navy">Admin token</p>
            <input
              className="input"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              placeholder="Enter admin token"
            />
            <button type="button" className="btn-secondary" onClick={handleSaveToken}>
              Save token
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-navy">
              Magic link {supabaseAvailable ? "" : "(configure Supabase)"}
            </p>
            <input
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              disabled={!supabaseAvailable}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={handleMagicLink}
              disabled={!supabaseAvailable}
            >
              Send magic link
            </button>
          </div>
        </div>
        {authMessage ? <p className="text-xs text-mint-700">{authMessage}</p> : null}
      </Card>

      <Card className="space-y-4">
        <p className="kicker">Campaign flag</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={campaignEnabled}
              onChange={(event) => setCampaignEnabled(event.target.checked)}
            />
            Campaign active
          </label>
          <input
            type="number"
            className="input w-32"
            min={0}
            max={90}
            value={campaignPercent}
            onChange={(event) => setCampaignPercent(Number(event.target.value))}
          />
          <span className="text-xs uppercase tracking-[0.2em] text-mint-600">% off</span>
        </div>
        <button type="button" className="btn-secondary" onClick={handleFlagUpdate}>
          Save campaign
        </button>
      </Card>

      <Card className="space-y-4">
        <p className="kicker">Questions</p>
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-mint-600">
                Question {index + 1}
              </label>
              <textarea
                className="input min-h-[120px]"
                value={question.prompt}
                onChange={(event) =>
                  setQuestions((prev) =>
                    prev.map((item) =>
                      item.id === question.id
                        ? { ...item, prompt: event.target.value }
                        : item
                    )
                  )
                }
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={handleQuestionsUpdate}>
            Save questions
          </button>
          <button type="button" className="btn-secondary" onClick={handleQuestionsReset}>
            Reset to defaults
          </button>
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="kicker">Coupons</p>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="input"
            placeholder="CODE"
            value={couponForm.code}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, code: event.target.value }))
            }
          />
          <input
            type="number"
            className="input"
            min={1}
            max={90}
            placeholder="Percent off"
            value={couponForm.percentOff}
            onChange={(event) =>
              setCouponForm((prev) => ({
                ...prev,
                percentOff: Number(event.target.value)
              }))
            }
          />
          <input
            type="datetime-local"
            className="input"
            onChange={(event) =>
              setCouponForm((prev) => ({
                ...prev,
                expiresAt: event.target.value
              }))
            }
          />
          <input
            type="number"
            className="input"
            placeholder="Max redemptions"
            onChange={(event) =>
              setCouponForm((prev) => ({
                ...prev,
                maxRedemptions: Number(event.target.value)
              }))
            }
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={handleCouponCreate}>
            Create coupon
          </button>
          <button type="button" className="btn-secondary" onClick={handleCouponRevoke}>
            Revoke coupon
          </button>
        </div>
        {couponMessage ? <p className="text-xs text-mint-700">{couponMessage}</p> : null}
      </Card>

      <Card className="space-y-4">
        <p className="kicker">Reveals</p>
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "All", value: "all" },
            { label: "Awaiting", value: "awaiting" },
            { label: "Completed", value: "completed" }
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={
                statusFilter === filter.value
                  ? "btn-primary"
                  : "btn-secondary"
              }
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {reveals.length === 0 ? (
            <p className="text-sm text-navy/60">No reveals yet.</p>
          ) : (
            reveals.map((reveal) => (
              <div
                key={reveal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mint-200 bg-mint-50/60 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-navy">
                    {reveal.name || "Untitled reveal"}
                  </p>
                  <p className="text-xs text-navy/60">{reveal.purchaserEmail}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-mint-600">
                  {reveal.status}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="kicker">Retention</p>
        <p className="text-sm text-navy/70">
          Deletes completed reveals beyond the configured retention window.
        </p>
        <button type="button" className="btn-secondary" onClick={handleRetentionPurge}>
          Purge expired reveals
        </button>
        {retentionMessage ? (
          <p className="text-xs text-mint-700">{retentionMessage}</p>
        ) : null}
      </Card>
    </div>
  );
}

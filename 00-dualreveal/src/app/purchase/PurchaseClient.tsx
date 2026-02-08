"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { useRevealStore } from "@/store/revealStore";
import { formatCents } from "@/lib/utils";
import { PUBLIC_CONFIG } from "@/lib/public-config";

type CouponResult = {
  valid: boolean;
  message: string;
  discountPercent: number;
  finalPriceCents: number;
  attemptsRemaining: number;
  cooldownUntil?: string | null;
  bannedUntil?: string | null;
  campaignActive: boolean;
  campaignPercent: number;
};

const defaultPricing: CouponResult = {
  valid: true,
  message: "No coupon applied.",
  discountPercent: 0,
  finalPriceCents: PUBLIC_CONFIG.basePriceCents,
  attemptsRemaining: PUBLIC_CONFIG.couponAttemptLimit,
  cooldownUntil: null,
  bannedUntil: null,
  campaignActive: false,
  campaignPercent: 0
};

type PurchaseClientProps = {
  questionSetFlow: "option-a" | "option-b";
};

export function PurchaseClient({ questionSetFlow }: PurchaseClientProps) {
  const router = useRouter();
  const {
    purchaserEmail,
    questionSetKey,
    setPurchaserEmail,
    setLastRevealId,
    hydrated
  } =
    useRevealStore();
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [pricing, setPricing] = useState<CouponResult>(defaultPricing);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (hydrated) {
      setEmail(purchaserEmail);
    }
  }, [hydrated, purchaserEmail]);

  useEffect(() => {
    if (!hydrated) return;
    if (questionSetFlow === "option-a" && !questionSetKey) {
      router.replace("/question-sets");
    }
  }, [hydrated, questionSetFlow, questionSetKey, router]);

  const priceDisplay = useMemo(
    () => formatCents(pricing.finalPriceCents),
    [pricing.finalPriceCents]
  );

  const cooldownMessage = useMemo(() => {
    if (pricing.cooldownUntil) {
      return `Try again after ${new Date(pricing.cooldownUntil).toLocaleString()}.`;
    }
    if (pricing.bannedUntil) {
      return `Blocked until ${new Date(pricing.bannedUntil).toLocaleString()}.`;
    }
    return null;
  }, [pricing.bannedUntil, pricing.cooldownUntil]);

  const handleValidate = async () => {
    setValidating(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: couponCode })
      });
      const data = (await response.json()) as CouponResult;
      setPricing(data);
      if (data.valid) {
        setMessage(data.message);
        setError(null);
      } else {
        setMessage(null);
        setError(data.message);
      }
    } catch (err) {
      setError("We could not validate the coupon yet.");
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch("/api/reveals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          couponCode,
          questionSetKey: questionSetFlow === "option-a" ? questionSetKey : null
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        if (data.coupon) {
          setPricing(data.coupon);
        }
        setLoading(false);
        return;
      }
      setPurchaserEmail(email);
      setLastRevealId(data.revealId);
      router.push(`/dashboard/${data.revealId}`);
    } catch (err) {
      setError("We could not start the reveal. Please try again.");
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <Card>
        <p className="text-sm text-navy/60">Loading your purchase flow...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="kicker">Purchase</p>
          <h1 className="text-3xl font-semibold text-navy">
            Create your reveal
          </h1>
          <p className="text-sm text-navy/70">
            Enter your email to create a private dashboard. Coupons stay visible
            at all times.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="purchase-email"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-600"
            >
              Purchaser email
            </label>
            <input
              type="email"
              id="purchase-email"
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label
                htmlFor="purchase-coupon"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-600"
              >
                Coupon code
              </label>
              <input
                type="text"
                id="purchase-coupon"
                className="input"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Enter code"
              />
              <p className="text-xs text-navy/60">
                Codes are validated server-side. You have {pricing.attemptsRemaining}
                {" "}
                attempts remaining.
              </p>
            </div>
            <button
              type="button"
              onClick={handleValidate}
              className="btn-secondary w-full"
              disabled={validating || !email}
            >
              {validating ? "Checking" : "Apply"}
            </button>
          </div>

          <div className="rounded-2xl border border-mint-200 bg-mint-50/70 px-4 py-3 text-sm text-navy">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Estimated price</span>
              <span className="text-lg font-semibold">{priceDisplay}</span>
            </div>
            <p className="mt-2 text-xs text-navy/60">
              {pricing.campaignActive
                ? `Campaign discount: ${pricing.campaignPercent}% off.`
                : "No campaign discount is active."}
            </p>
          </div>

          {message ? (
            <p
              className={
                pricing.valid ? "text-sm text-mint-700" : "text-sm text-red-700"
              }
            >
              {message}
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {cooldownMessage ? (
            <p className="text-xs text-navy/60">{cooldownMessage}</p>
          ) : null}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating" : "Continue to dashboard"}
          </button>
        </form>
      </Card>

      <Card className="space-y-3">
        <p className="kicker">Make it a ritual</p>
        <h2 className="text-xl font-semibold text-navy">
          Reveal what matters, more than once.
        </h2>
        <p className="text-sm text-navy/70">
          Most couples use DualReveal for quick check-ins before trips, life
          changes, or big weekends. Each new reveal keeps the tone fresh without
          rehashing old answers.
        </p>
        <ul className="space-y-2 text-sm text-navy/70">
          <li>Seasonal resets for changing needs.</li>
          <li>Plan thoughtful surprises together.</li>
          <li>Create a gentle habit of listening.</li>
        </ul>
      </Card>

      <Card className="space-y-3">
        <p className="kicker">Privacy note</p>
        <p className="text-sm text-navy/70">
          Your email is used only to restore your dashboard. The respondent never
          sees it, and answers are kept confidential.
        </p>
      </Card>
    </div>
  );
}

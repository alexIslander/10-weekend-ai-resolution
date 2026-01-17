import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCouponForEmail } from "@/lib/coupons";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDataStore } from "@/lib/data";

const payloadSchema = z.object({
  email: z.string().email(),
  couponCode: z.string().optional().nullable()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload." },
      { status: 400 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rateKey = `create-reveal:${ip}`;
  const rate = checkRateLimit(rateKey, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please slow down." },
      { status: 429 }
    );
  }

  const store = getDataStore();
  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const existing = await store.getRevealByEmail(normalizedEmail);
  if (existing) {
    return NextResponse.json({
      revealId: existing.id,
      existing: true
    });
  }

  const couponResult = await validateCouponForEmail(
    normalizedEmail,
    parsed.data.couponCode ?? null
  );

  if (parsed.data.couponCode && !couponResult.valid) {
    return NextResponse.json(
      { error: couponResult.message, coupon: couponResult },
      { status: 400 }
    );
  }

  const reveal = await store.createReveal(normalizedEmail);

  return NextResponse.json({
    revealId: reveal.id,
    existing: false,
    coupon: couponResult
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDataStore } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";

const createSchema = z.object({
  code: z.string().min(3).max(32),
  percentOff: z.number().min(1).max(90),
  expiresAt: z.string().datetime().optional().nullable(),
  maxRedemptions: z.number().int().min(1).optional().nullable()
});

const revokeSchema = z.object({
  code: z.string().min(3).max(32)
});

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload." },
      { status: 400 }
    );
  }

  const store = getDataStore();
  const coupon = await store.createCoupon(
    parsed.data.code,
    parsed.data.percentOff,
    parsed.data.expiresAt ?? undefined,
    parsed.data.maxRedemptions ?? undefined
  );

  await store.logAdminAction(
    "coupon_created",
    { code: coupon.code, percentOff: coupon.percentOff },
    admin.userId ?? null
  );

  return NextResponse.json({ coupon });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  const body = await request.json();
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload." },
      { status: 400 }
    );
  }

  const store = getDataStore();
  const coupon = await store.revokeCoupon(parsed.data.code);
  if (!coupon) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await store.logAdminAction(
    "coupon_revoked",
    { code: coupon.code },
    admin.userId ?? null
  );

  return NextResponse.json({ coupon });
}

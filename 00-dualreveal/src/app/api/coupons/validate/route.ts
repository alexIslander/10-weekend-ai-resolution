import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCouponForEmail } from "@/lib/coupons";

const payloadSchema = z.object({
  email: z.string().email(),
  code: z.string().optional().nullable()
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

  const result = await validateCouponForEmail(
    parsed.data.email,
    parsed.data.code ?? null
  );

  return NextResponse.json(result);
}

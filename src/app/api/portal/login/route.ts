import { db } from "@/db";
import { vouchers, companies } from "@/db/schema";
import { VoucherEngine } from "@/lib/voucher-engine";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code, companySlug } = await request.json();

    const company = await db.query.companies.findFirst({
      where: eq(companies.slug, companySlug),
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const voucher = await db.query.vouchers.findFirst({
      where: and(
        eq(vouchers.code, code),
        eq(vouchers.companyId, company.id)
      ),
    });

    if (!voucher) {
      return NextResponse.json({ error: "Invalid voucher code" }, { status: 401 });
    }

    if (voucher.status !== "active") {
      return NextResponse.json({ error: "Voucher already used or expired" }, { status: 401 });
    }

    await VoucherEngine.activateVoucher(code);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
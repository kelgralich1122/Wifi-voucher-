import { VoucherEngine } from "@/lib/voucher-engine";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, count, userId, companyId } = body;

    const vouchers = await VoucherEngine.bulkGenerate({
      packageId,
      companyId,
      userId,
      count: parseInt(count),
    });

    return NextResponse.json({ success: true, count: vouchers.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
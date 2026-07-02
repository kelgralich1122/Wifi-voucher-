import { db } from '@/db';
import { vouchers } from '@/db/schema';
import { nanoid } from 'nanoid';

export class VoucherEngine {
  static async bulkGenerate({
    packageId,
    companyId,
    userId,
    count,
  }: {
    packageId: string;
    companyId: string;
    userId: string;
    count: number;
  }) {
    const generated = [];
    for (let i = 0; i < count; i++) {
      const code = `WIFI-${nanoid(12).toUpperCase()}`;
      const [voucher] = await db
        .insert(vouchers)
        .values({
          code,
          companyId,
          packageId,
          status: 'active',
        })
        .returning();
      generated.push(voucher);
    }
    return generated;
  }

  static async activateVoucher(code: string) {
    await db
      .update(vouchers)
      .set({ status: 'used', usedAt: new Date() })
      .where({ code });
  }
}
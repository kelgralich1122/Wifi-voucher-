import { db } from "@/db";
import { vouchers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { Download, QrCode } from "lucide-react";
import Link from "next/link";

export default async function VouchersPage() {
  const allVouchers = await db.query.vouchers.findMany({
    orderBy: [desc(vouchers.createdAt)],
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">WiFi Vouchers</h1>
        <Link href="/dashboard/vouchers/generate">
          <Button className="flex items-center gap-2">
            Generate Vouchers
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-medium">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Package</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Used</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allVouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="px-6 py-4 font-mono text-xs font-bold">{v.code}</td>
                    <td className="px-6 py-4">{v.packageId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        v.status === 'active' ? 'bg-green-100 text-green-700' :
                        v.status === 'used' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(v.createdAt!).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {v.usedAt ? new Date(v.usedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <QrCode size={14} /> QR
                      </Button>
                    </td>
                  </tr>
                ))}
                {allVouchers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                      No vouchers generated yet. Generate your first batch to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

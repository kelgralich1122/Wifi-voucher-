import { db } from "@/db";
import { payments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { CreditCard } from "lucide-react";

export default async function PaymentsPage() {
  try {
    const allPayments = await db.query.payments.findMany({
      orderBy: [desc(payments.createdAt)],
      limit: 100,
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Transaction History</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <p className="text-3xl font-bold">$0.00</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-500">This Month</p>
              <p className="text-3xl font-bold">$0.00</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-500">Transactions</p>
              <p className="text-3xl font-bold">{allPayments.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-medium">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 font-mono text-xs">{p.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 capitalize">
                          <CreditCard size={14} className="text-slate-400" />
                          {p.gateway}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">${p.amount}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            p.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(p.createdAt!).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {allPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                        No transactions recorded yet.
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
  } catch (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error loading payments.
      </div>
    );
  }
}
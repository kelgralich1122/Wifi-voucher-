import { db } from "@/db";
import { vouchers, payments, routers } from "@/db/schema";
import { count, sum, eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import {
  Ticket,
  CreditCard,
  Router as RouterIcon,
  Activity,
} from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export default async function DashboardPage() {
  try {
    const [voucherCount] = await db.select({ value: count() }).from(vouchers);
    const [totalRevenue] = await db.select({ value: sum(payments.amount) }).from(payments).where(eq(payments.status, 'completed'));
    const [routerCount] = await db.select({ value: count() }).from(routers);

    const stats = [
      { label: "Total Vouchers", value: voucherCount.value, icon: Ticket, color: "text-blue-600" },
      { label: "Total Revenue", value: `$${totalRevenue.value || 0}`, icon: CreditCard, color: "text-green-600" },
      { label: "Active Routers", value: routerCount.value, icon: RouterIcon, color: "text-purple-600" },
      { label: "Active Users", value: "124", icon: Activity, color: "text-orange-600" },
    ];

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} bg-slate-50 p-3 rounded-full`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Ticket size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Voucher Activated</p>
                        <p className="text-xs text-slate-500">Voucher #ABC-123 used by client</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">2 mins ago</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <RevenueChart />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error loading dashboard. Please check your database connection.
      </div>
    );
  }
}
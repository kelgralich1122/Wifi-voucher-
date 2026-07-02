import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Ticket,
  Package,
  Router,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Ticket, label: "Vouchers", href: "/dashboard/vouchers" },
    { icon: Package, label: "Packages", href: "/dashboard/packages" },
    { icon: Router, label: "Routers", href: "/dashboard/routers" },
    { icon: Users, label: "Users", href: "/dashboard/users" },
    { icon: Building2, label: "Branches", href: "/dashboard/branches" },
    { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xs">WIFI</span>
            NetManager
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 px-3 py-2 mt-2 rounded-md hover:bg-slate-800 text-red-400 text-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-medium">Dashboard</h2>
        </header>
        <main className="p-8 overflow-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
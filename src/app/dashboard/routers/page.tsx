import { db } from "@/db";
import { routers } from "@/db/schema";
import { Card, CardContent, Button } from "@/components/ui";
import { Plus, Router as RouterIcon, Wifi, WifiOff, Globe } from "lucide-react";
import Link from "next/link";

export default async function RoutersPage() {
  try {
    const allRouters = await db.query.routers.findMany();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Routers & Hotspots</h1>
          <Link href="/dashboard/routers/new">
            <Button className="flex items-center gap-2">
              <Plus size={16} /> Add Router
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allRouters.map((router) => (
            <Card key={router.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-2 rounded-lg ${
                      router.status === "online"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <RouterIcon size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        router.status === "online" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {router.status}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold">{router.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mb-6">
                  <Globe size={14} /> {router.ipAddress || "No IP set"}
                </p>

                <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model</span>
                    <span className="font-bold uppercase text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {router.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Seen</span>
                    <span className="font-medium">
                      {router.lastSeen
                        ? new Date(router.lastSeen).toLocaleString()
                        : "Never"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6">
                  <Button variant="outline" size="sm">
                    Config
                  </Button>
                  <Button variant="outline" size="sm">
                    Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {allRouters.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-lg border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <WifiOff size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No routers connected</h3>
              <p className="text-slate-500 mb-6">Connect your first router to start managing WiFi access.</p>
              <Link href="/dashboard/routers/new">
                <Button>Add Your First Router</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error loading routers.
      </div>
    );
  }
}
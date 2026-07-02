import { db } from "@/db";
import { packages } from "@/db/schema";
import { Card, CardContent, Button } from "@/components/ui";
import { Plus, Package as PackageIcon } from "lucide-react";
import Link from "next/link";

export default async function PackagesPage() {
  try {
    const allPackages = await db.query.packages.findMany();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Data Packages</h1>
          <Link href="/dashboard/packages/new">
            <Button className="flex items-center gap-2">
              <Plus size={16} /> Create Package
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPackages.map((pkg) => (
            <Card key={pkg.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <PackageIcon size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${pkg.price}</p>
                    <p className="text-xs text-slate-500 uppercase font-medium">{pkg.type}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold">{pkg.name}</h3>
                <p className="text-sm text-slate-500 mb-6">{pkg.description || "No description provided."}</p>

                <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Validity</span>
                    <span className="font-medium">
                      {pkg.validitySeconds ? `${pkg.validitySeconds / 3600} Hours` : "Unlimited"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data Limit</span>
                    <span className="font-medium">
                      {pkg.dataLimitBytes ? `${Number(pkg.dataLimitBytes) / (1024 * 1024 * 1024)} GB` : "Unlimited"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error loading packages.
      </div>
    );
  }
}
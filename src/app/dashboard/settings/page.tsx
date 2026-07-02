import { db } from "@/db";
import { companies } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const company = await db.query.companies.findFirst({
    where: eq(companies.id, session.user.companyId),
  });

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your company profile and platform configurations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input defaultValue={company?.name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Slug</label>
                <Input defaultValue={company?.slug} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Email</label>
              <Input defaultValue={company?.contactEmail || ""} />
            </div>
            <Button>Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
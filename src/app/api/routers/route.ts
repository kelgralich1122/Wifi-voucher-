import { db } from "@/db";
import { routers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, ipAddress, secretKey } = body;

    const [newRouter] = await db.insert(routers).values({
      name,
      type,
      ipAddress,
      secretKey,
      companyId: session.user.companyId,
      status: "online",
    }).returning();

    return NextResponse.json(newRouter);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allRouters = await db.query.routers.findMany({
      where: (r, { eq }) => eq(r.companyId, session.user.companyId),
    });

    return NextResponse.json(allRouters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
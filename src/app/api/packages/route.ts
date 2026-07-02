import { db } from "@/db";
import { packages } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, price, type, validitySeconds, dataLimitBytes, description } = body;

    const [newPkg] = await db.insert(packages).values({
      name,
      price: parseFloat(price),
      type,
      validitySeconds: validitySeconds ? parseInt(validitySeconds) : null,
      dataLimitBytes: dataLimitBytes ? dataLimitBytes.toString() : null,
      description,
      companyId: session.user.companyId,
    }).returning();

    return NextResponse.json(newPkg);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allPackages = await db.query.packages.findMany({
      where: (pkgs, { eq }) => eq(pkgs.companyId, session.user.companyId),
    });

    return NextResponse.json(allPackages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
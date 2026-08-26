import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

const permissions = {
  create: "project:create",
  read: "project:read",
  delete: "project:delete",
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ permission: string }> },
) {
  const action = (await params).permission as keyof typeof permissions;
  const permission = permissions[action];

  if (!permission) {
    return NextResponse.json({ error: "Unknown permission test" }, { status: 404 });
  }

  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ allowed: false, permission, error: "Unauthenticated" }, { status: 401 });
  }

  if (!session.user.roles.includes(permission)) {
    return NextResponse.json({ allowed: false, permission, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ allowed: true, permission, subject: session.user.id });
}

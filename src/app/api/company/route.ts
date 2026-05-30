// Replaced by /api/business — kept to avoid 404s during migration
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Use /api/business" }, { status: 308 });
}

export async function POST() {
  return NextResponse.json({ error: "Use /api/business" }, { status: 308 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Use /api/business" }, { status: 308 });
}

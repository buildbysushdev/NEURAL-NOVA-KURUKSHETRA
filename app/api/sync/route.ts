import { NextRequest, NextResponse } from "next/server";
import { getSyncState, updateSyncState } from "@/lib/syncStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = getSyncState();
  return NextResponse.json({
    success: true,
    ...state,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateSyncState((prev) => ({
      ...prev,
      ...body,
    }));
    return NextResponse.json({ success: true, ...updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

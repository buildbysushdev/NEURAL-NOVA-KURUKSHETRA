import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";

export async function GET(req: NextRequest) {
  try {
    const resources = disasterStore.getResources();
    const depots = disasterStore.getDepots();
    return NextResponse.json({
      success: true,
      depots,
      resources,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resource_id, restock_quantity } = body;

    if (!resource_id || typeof restock_quantity !== "number") {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const updated = disasterStore.updateResourceAllocation(resource_id, -restock_quantity);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, resource: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { resqStore } from "@/lib/resq/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message text is required" },
        { status: 400 }
      );
    }

    const result = resqStore.submitCitizenSos(message);
    return NextResponse.json({
      success: true,
      data: {
        packet: result.packet,
        route: result.route,
        state: resqStore.getState(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process emergency packet" },
      { status: 500 }
    );
  }
}

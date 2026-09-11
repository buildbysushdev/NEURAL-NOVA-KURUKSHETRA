import { NextRequest, NextResponse } from "next/server";
import { checkCitizenReportPermission } from "@/lib/ai/permission-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, userId } = body;

    if (latitude === undefined || longitude === undefined || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return NextResponse.json(
        { error: "Valid latitude and longitude coordinates are required." },
        { status: 400 }
      );
    }

    const assessment = await checkCitizenReportPermission({
      latitude: Number(latitude),
      longitude: Number(longitude),
      userId: userId || undefined,
    });

    return NextResponse.json(assessment, { status: 200 });
  } catch (error: any) {
    console.error("API error in check-permission:", error);
    return NextResponse.json(
      {
        allowed: false,
        reason: "Unable to complete geographic hazard verification. If in danger, please call 112 directly.",
        suggestedType: null,
        fallbackNumber: "112",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

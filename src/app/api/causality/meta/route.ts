import { NextResponse } from "next/server";

/**
 * Challenge 4, step 1: announce the causality auditor.
 * The grader knocks here first and checks the token is yours.
 */
export async function GET() {
  return NextResponse.json({
    service: "causality",
    specVersion: "1",
    studentToken: process.env.SITE_TOKEN,
  });
}

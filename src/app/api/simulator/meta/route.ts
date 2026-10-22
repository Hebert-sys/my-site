import { NextResponse } from "next/server";

/**
 * Challenge 3, step 1: announce the decision simulator.
 * The grader knocks here first and checks the token is yours.
 */
export async function GET() {
  return NextResponse.json({
    service: "simulator",
    specVersion: "1",
    studentToken: process.env.SITE_TOKEN,
  });
}

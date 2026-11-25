import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "capstone", // which decision service is answering
    specVersion: "2", // which version of the problem format it speaks
    studentToken: process.env.SITE_TOKEN, // proves this service is yours
    domain: "staffing", // your choice: staffing, inventory, pricing, or channels
  });
}

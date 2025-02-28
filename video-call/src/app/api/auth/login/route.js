import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google-login`);
}
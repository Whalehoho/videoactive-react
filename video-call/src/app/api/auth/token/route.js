import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("AuthToken")?.value;

  if (!authToken) {
    return NextResponse.json({ error: "No auth token found" }, { status: 401 });
  }

  console.log("Auth token found:", authToken);

  return NextResponse.json( authToken );
}
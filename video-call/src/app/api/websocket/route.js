import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export function GET() {
  const cookieStore = cookies();
  const authToken = cookieStore.get("AuthToken")?.value;
  const socketConnection = new WebSocket(
    `${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/direct?authToken=${authToken}`
  );
  return socketConnection;
}
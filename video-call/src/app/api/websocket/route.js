import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
  // const authToken = req.headers.get("Authorization")?.split(" ")[1];
  const cookieStore = await cookies();
  const authToken = cookieStore.get("AuthToken")?.value;
  const socketConnection = new WebSocket(
    `${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/direct?authToken=${authToken}`
  );
  return socketConnection;
}
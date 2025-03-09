import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export function GET(req) {
  const authToken = req.headers.get("Authorization")?.split(" ")[1];
  const socketConnection = new WebSocket(
    `${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/direct?authToken=${authToken}`
  );
  return socketConnection;
}
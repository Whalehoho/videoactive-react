import { NextResponse } from "next/server";

export function middleware(request) {
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Credentials", "true"); // ✅ Allow cookies
  response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_BACKEND_URL);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};

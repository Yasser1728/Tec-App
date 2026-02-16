import { NextResponse } from "next/server";

export function middleware(req: any) {

  const isLoggedIn = req.cookies.get("user");

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  return NextResponse.next();
}

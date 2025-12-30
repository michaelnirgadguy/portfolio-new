import { NextRequest, NextResponse } from "next/server";

const ADMIN_PATHS = ["/admin", "/api/admin"];

function isProtectedPath(pathname: string) {
  return ADMIN_PATHS.some((path) => pathname.startsWith(path));
}

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Area"',
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Admin credentials are not configured.", {
      status: 500,
    });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const base64Credentials = authHeader.replace("Basic ", "").trim();
  let decoded = "";

  try {
    decoded = atob(base64Credentials);
  } catch {
    return unauthorizedResponse();
  }

  const [inputUser, inputPass] = decoded.split(":");
  if (inputUser !== username || inputPass !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

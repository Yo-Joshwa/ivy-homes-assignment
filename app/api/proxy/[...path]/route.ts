import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://solve.ivy.homes";

const API_KEY = process.env.IVY_API_KEY || "";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handler(
  request: NextRequest,
  context: RouteContext
) {
  if (!API_KEY) {
    return NextResponse.json(
      { detail: "Server API key is not configured." },
      { status: 500 }
    );
  }

  const { path } = await context.params;
  const endpoint = "/" + path.join("/");

  const upstreamUrl = new URL(endpoint, API_BASE);

  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  const headers = new Headers();

  headers.set("Accept", "application/json");
  headers.set("X-API-Key", API_KEY);

  // First try Authorization header
  let authorization = request.headers.get("authorization");

  // Otherwise recover login token from HttpOnly cookie
  if (!authorization) {
    const token = request.cookies.get("ivy_token")?.value;

    if (token) {
      authorization = `Bearer ${token}`;
    }
  }

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const upstream = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseBody = await upstream.arrayBuffer();

  const responseHeaders = new Headers();

  const upstreamContentType =
    upstream.headers.get("content-type");

  if (upstreamContentType) {
    responseHeaders.set(
      "Content-Type",
      upstreamContentType
    );
  }

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });

  // Save login token in secure server-side cookie
  if (
    endpoint === "/auth/login" &&
    request.method === "POST" &&
    upstream.ok
  ) {
    try {
      const json = JSON.parse(
        new TextDecoder().decode(responseBody)
      );

      if (json.token) {
        response.cookies.set("ivy_token", json.token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: Number(json.expires_in || 1800),
        });
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  // Clear token on logout
  if (
    endpoint === "/auth/logout" &&
    request.method === "POST"
  ) {
    response.cookies.set("ivy_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
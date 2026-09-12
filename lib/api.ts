import { Collection, Listing, Project, Rental } from "./types";
const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://solve.ivy.homes";

const API_KEY = process.env.NEXT_PUBLIC_IVY_API_KEY || "";

console.log("API KEY LOADED:", API_KEY.length > 0);
console.log("API KEY LENGTH:", API_KEY.length);

type RequestOptions = RequestInit & {
  token?: string;
};

async function api<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = new URL(path, BASE);

  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (API_KEY) {
    headers.set("X-API-Key", API_KEY);
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers,
    cache: "no-store",
  });

  const text = await res.text();

  let body: unknown = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { detail: text };
  }

  if (!res.ok) {
    const detail =
      typeof body === "object" &&
        body !== null &&
        "detail" in body
        ? (body as { detail?: string }).detail
        : undefined;

    throw new Error(
      detail || `API request failed (${res.status})`
    );
  }

  return body as T;
}
export const apiClient = {
  login: (email: string, password: string) =>
    api<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      refresh_url: string;
      user: {
        email: string;
        name: string;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: (token: string) =>
    api("/auth/logout", {
      method: "POST",
      token,
    }),

  listings: (
    params: Record<string, string | number | undefined>,
    token?: string
  ) => {
    const q = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        q.set(key, String(value));
      }
    }

    return api<Collection<Listing>>(
      `/v1/listings?${q.toString()}`,
      { token }
    );
  },

  listing: (id: string, token?: string) =>
    api<Listing>(
      `/v1/listing/${encodeURIComponent(id)}`,
      { token }
    ),

  similar: (id: string, token?: string) =>
    api<Listing[]>(
      `/v1/listings/${encodeURIComponent(id)}/similar`,
      { token }
    ),

  rentals: (
    params: Record<string, string | number | undefined>,
    token?: string
  ) => {
    const q = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        q.set(key, String(value));
      }
    }

    return api<Collection<Rental>>(
      `/v1/rentals?${q.toString()}`,
      { token }
    );
  },

  projects: (
    params: Record<string, string | number | undefined>,
    token?: string
  ) => {
    const q = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        q.set(key, String(value));
      }
    }

    return api<Collection<Project>>(
      `/v1/projects?${q.toString()}`,
      { token }
    );
  },

  project: (id: string, token?: string) =>
    api<Project>(
      `/v1/projects/${encodeURIComponent(id)}`,
      { token }
    ),

  favourites: (token: string) =>
    api<{ count: number; results: Listing[] }>(
      "/v1/favourites",
      { token }
    ),

  addFavourite: (id: string, token: string) =>
    api("/v1/favourites", {
      method: "POST",
      token,
      body: JSON.stringify({ id }),
    }),

  removeFavourite: (id: string, token: string) =>
    api(
      `/v1/favourites/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        token,
      }
    ),

  analytics: async (token?: string) => {
    try {
      return await api<Record<string, unknown>>(
        "/v1/analytics/summary",
        { token }
      );
    } catch (error) {
      console.warn("Analytics endpoint unavailable:", error);
      return null;
    }
  },
};
export async function fetchAll<T>(
  endpoint: string,
  extra: Record<string, string | number> = {},
  token?: string
): Promise<T[]> {
  const results: T[] = [];
  const limit = 50;
  let offset = 0;

  while (true) {
    const params = new URLSearchParams();

    params.set("offset", String(offset));
    params.set("limit", String(limit));

    for (const [key, value] of Object.entries(extra)) {
      params.set(key, String(value));
    }

    const response = await api<{
      total: number;
      results: T[];
    }>(`${endpoint}?${params.toString()}`, {
      token,
    });

    const page = response.results || [];
    const total = response.total;

    const remaining = total - results.length;
    const actualPage = page.slice(0, remaining);

    results.push(...actualPage);

    // console.log(
    //   `${endpoint}: offset=${offset}, got=${page.length}, kept=${actualPage.length}, total=${total}`
    // );

    if (results.length >= total || page.length === 0) {
      break;
    }

    offset += limit;
  }

  return results;
}
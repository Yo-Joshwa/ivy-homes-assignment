import fs from "node:fs/promises";
import path from "node:path";

export const BASE = process.env.IVY_BASE_URL || "https://solve.ivy.homes";
export const KEY = process.env.IVY_API_KEY || "";

export async function request<T>(endpoint: string, init: RequestInit = {}): Promise<{status:number; data:T; headers:Headers}> {
  const url = new URL(endpoint, BASE);
  const headers = new Headers(init.headers);
  headers.set("Accept","application/json");
  if (init.body) headers.set("Content-Type","application/json");
  if (KEY) headers.set("X-API-Key", KEY);
  const response = await fetch(url,{...init,headers});
  const text = await response.text();
  let data: T;
  try { data = JSON.parse(text) as T; } catch { data = text as T; }
  return {status:response.status,data,headers:response.headers};
}

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

    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await request<{
      total: number;
      results: T[];
    }>(`${endpoint}?${params.toString()}`, {
      headers,
    });

    const page = response.data.results || [];
const total = response.data.total;

const remaining = total - results.length;
const actualPage = page.slice(0, remaining);

results.push(...actualPage);

console.log(
  `${endpoint}: offset=${offset}, got=${page.length}, kept=${actualPage.length}, total=${total}`
);

if (results.length >= total || page.length === 0) {
  break;
}

offset += limit;
  }

  return results;
}

export async function writeJson(name:string,data:unknown){
  const dir=path.resolve("data/investigation");
  await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,name),JSON.stringify(data,null,2));
}
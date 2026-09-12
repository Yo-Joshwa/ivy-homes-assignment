import { request } from "./api-client";

async function main() {
  const email = process.env.IVY_EMAIL;
  const password = process.env.IVY_PASSWORD;

  if (!email || !password) {
    throw new Error("Set IVY_EMAIL and IVY_PASSWORD first.");
  }

  const login = await request<{
    access_token: string;
    user: {
      email: string;
      name: string;
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (login.status !== 200) {
    throw new Error(
      `Login failed: ${login.status} ${JSON.stringify(login.data)}`
    );
  }

  const token = login.data.access_token;

  console.log("Login successful");

  const endpoints = [
  "/v1/listings",
  "/v1/rentals",
  "/v1/projects",
];

for (const endpoint of endpoints) {
  for (const offset of [0, 50]) {
    const r = await request<any>(
      `${endpoint}?offset=${offset}&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(endpoint, `offset=${offset}`);
    console.log({
      status: r.status,
      total: r.data?.total,
      results: r.data?.results?.length,
      first_id: r.data?.results?.[0]?.listing_id ||
        r.data?.results?.[0]?.project_id,
      last_id:
        r.data?.results?.[r.data?.results?.length - 1]?.listing_id ||
        r.data?.results?.[r.data?.results?.length - 1]?.project_id,
    });
  }
}
}

main().catch(console.error);
import { fetchAll, request, writeJson } from "./api-client";

type Listing = Record<string,any>;
type Project = Record<string,any>;

async function main(){
  const email = process.env.IVY_EMAIL;
const password = process.env.IVY_PASSWORD;

if (!email || !password) {
  throw new Error("Set IVY_EMAIL and IVY_PASSWORD first.");
}
  console.log("Ivy Homes API investigation");
  console.log("Base:", process.env.IVY_BASE_URL || "https://solve.ivy.homes");
  if(!process.env.IVY_API_KEY) throw new Error("Set IVY_API_KEY first.");

  const health=await request<any>("/health");
  console.log("health:",health.status,health.data);
  const login = await request<{
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
});

if (login.status !== 200) {
  throw new Error(
    `Login failed: ${login.status} ${JSON.stringify(login.data)}`
  );
}

const token = login.data.access_token;

console.log("Login successful:", login.data.user.email);

  const listings = await fetchAll<Listing>("/v1/listings", {}, token);
const rentals = await fetchAll<Listing>("/v1/rentals", {}, token);
const projects = await fetchAll<Project>("/v1/projects", {}, token);

  const coordinateGroups = new Map<string, string[]>();

for (const listing of listings) {
  const key = `${listing.latitude}|${listing.longitude}`;

  if (!coordinateGroups.has(key)) {
    coordinateGroups.set(key, []);
  }

  coordinateGroups.get(key)!.push(listing.listing_id);
}

const repeatedCoordinates = [...coordinateGroups.entries()]
  .filter(([key, ids]) => key !== "undefined|undefined" && ids.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log("Repeated coordinate groups:", repeatedCoordinates.length);
console.log(repeatedCoordinates.slice(0, 20));
  console.log({listings:listings.length,rentals:rentals.length,projects:projects.length});

  await writeJson("listings.json",listings);
  await writeJson("rentals.json",rentals);
  await writeJson("projects.json",projects);

  // Basic first-pass anomalies. Do not label them as fake/corrupt automatically.
  const duplicateListingIds = [...new Set(listings.map(x=>x.listing_id))].filter(id=>listings.filter(x=>x.listing_id===id).length>1);
  const duplicatePropertyKeys = new Map<string,number>();
  for(const x of listings){
    const key=[x.apartment_name,x.locality,x.property_type,x.bedroom,x.carpet_area,x.latitude,x.longitude].join("|");
    duplicatePropertyKeys.set(key,(duplicatePropertyKeys.get(key)||0)+1);
  }
  const repeatedProperties=[...duplicatePropertyKeys.entries()].filter(([,n])=>n>1).map(([key,n])=>({key,n}));

  await writeJson("basic-anomalies.json",{duplicateListingIds,repeatedProperties});
  console.log("Basic anomaly report written.");
}
main().catch(e=>{console.error(e);process.exit(1)});
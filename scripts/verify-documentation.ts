import { request } from "./api-client";

async function check(label:string, endpoint:string, init:RequestInit={}){
  const r=await request<any>(endpoint,init);
  console.log(label, r.status, JSON.stringify(r.data).slice(0,1000));
}

async function main(){
  if(!process.env.IVY_API_KEY) throw new Error("Set IVY_API_KEY first.");
  await check("health","/health");

  // Endpoint/path checks.
  await check("listings","/v1/listings?page=1&limit=1");
  await check("single listing invalid id","/v1/listing/DOES-NOT-EXIST");
  await check("similar invalid id","/v1/listings/DOES-NOT-EXIST/similar");
  await check("rentals","/v1/rentals?page=1&limit=1");
  await check("projects","/v1/projects?page=1&limit=1");
  await check("analytics","/v1/analytics/summary");

  // Pagination/filter/sort experiments should be expanded after observing real responses.
  console.log("Next: compare documented filter/sort semantics against unfiltered records.");
}
main().catch(e=>{console.error(e);process.exit(1)});
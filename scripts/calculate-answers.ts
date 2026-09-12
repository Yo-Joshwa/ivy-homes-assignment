import fs from "node:fs/promises";
import path from "node:path";

const dir=path.resolve("data/investigation");
const listings=JSON.parse(await fs.readFile(path.join(dir,"listings.json"),"utf8")) as any[];
const rentals=JSON.parse(await fs.readFile(path.join(dir,"rentals.json"),"utf8")) as any[];
const projects=JSON.parse(await fs.readFile(path.join(dir,"projects.json"),"utf8")) as any[];

const corrupt = new Set<string>(); // Populate only after a personally reproduced hypothesis.
const fake = new Set<string>();    // Populate only after a personally reproduced hypothesis.
const excluded = new Set([...corrupt,...fake]);

const propertyKeys=new Set(listings.map(x=>[
  x.apartment_name,x.locality,x.property_type,x.bedroom,x.carpet_area,
  x.super_built_up_area,x.latitude,x.longitude
].join("|")));

const active=listings.filter(x=>x.is_live===true);
const twoBhk=active.filter(x=>x.bedroom===2&&!excluded.has(x.listing_id)&&Number(x.carpet_area)>0&&Number.isFinite(Number(x.price)));
const avg=twoBhk.length?twoBhk.reduce((s,x)=>s+Number(x.price)/Number(x.carpet_area),0)/twoBhk.length:0;

const ref=new Date("2026-09-10T00:00:00+05:30");
const start=new Date(ref.getTime()-7*24*60*60*1000);
const recent=listings.filter(x=>{const d=new Date(x.posted_at);return d>=start&&d<ref;});

const velacheryRent = rentals
  .filter(
    x => String(x.locality || "").trim().toLowerCase() === "velachery"
  )
  .reduce(
    (sum, x) => sum + Number(x.price || 0),
    0
  );
const projectCounts=projects.map(p=>{
  const actual=listings.filter(x=>x.project_id===p.project_id).length;
  return {project_id:p.project_id,reported:p.total_listings,actual,wrong:Number(p.total_listings)!==actual};
});

const answer={
  total_listing_records:listings.length,
  unique_properties:propertyKeys.size,
  active_listings:active.length,
  corrupt_listing_ids:[...corrupt].sort(),
  total_monthly_rent:velacheryRent,
  avg_price_per_sqft_2bhk:Number(avg.toFixed(2)),
  costliest_project:projects.reduce((best,p)=>!best||Number(p.price_max)>Number(best.price_max)?p:best,null as any)
    ? (()=>{const p=projects.reduce((best,p)=>!best||Number(p.price_max)>Number(best.price_max)?p:best,null as any);return {project_id:p.project_id,price_max_inr:Number(p.price_max)}})()
    : {project_id:"",price_max_inr:0},
  listings_last_7_days:recent.length,
  fake_listing_ids:[...fake].sort(),
  projects_with_wrong_listing_count:projectCounts.filter(x=>x.wrong).length
};

await fs.writeFile(path.join(dir,"answers.json"),JSON.stringify(answer,null,2));
await fs.writeFile(path.join(dir,"project-count-check.json"),JSON.stringify(projectCounts,null,2));
console.log(JSON.stringify(answer,null,2));
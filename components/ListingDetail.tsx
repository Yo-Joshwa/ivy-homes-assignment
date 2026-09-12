"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import { apiClient } from "../lib/api";
import { getSession } from "../lib/auth";
import { Listing } from "../lib/types";
import {
  getSavedListings,
  isListingSaved,
  saveListing,
  removeSavedListing,
} from "../lib/favourites";
export default function ListingDetail({ id }: { id: string }) {
  const [item, setItem] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const s = getSession();
    if (!s) return;

    async function load() {
      try {
        // First try the documented detail endpoint.
        try {
          const detail = await apiClient.listing(id, s?.token);
          setItem(detail);
        } catch (detailError) {
          // Running API currently returns 404 for the documented
          // listing detail endpoint, so fall back to the collection.
          const result = await apiClient.listings(
            {
              page: 1,
              limit: 200,
            },
            s?.token,
          );

          const found = result.results.find((x) => x.listing_id === id);

          if (!found) {
            throw new Error("Listing not found");
          }

          setItem(found);
        }

        // Similar listings are optional.
        try {
          const similarResults = await apiClient.similar(id, s?.token);
          setSimilar(similarResults);
        } catch {
          setSimilar([]);
        }

        setSaved(isListingSaved(s?.user?.email ?? "", id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load listing");
      }
    }

    load();
  }, [id]);
  async function toggle() {
    const s = getSession();
    if (!s || !item) return;

    if (saved) {
      removeSavedListing(s.user.email, item.listing_id);
      setSaved(false);
    } else {
      saveListing(s.user.email, item);
      setSaved(true);
    }
  }
  return (
    <AppShell>
      <Link href="/listings">← Back</Link>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        item && (
          <>
            <div className="topbar" style={{ marginTop: 20 }}>
              <div>
                <h1>{item.apartment_name || "Listing"}</h1>
                <p className="muted">
                  {item.locality} · {item.property_type}
                </p>
              </div>
              <button className="primary" onClick={toggle}>
                {saved ? "Remove saved" : "Save listing"}
              </button>
            </div>
            <div className="grid grid-3">
              <div className="card">
                <div className="muted">Price</div>
                <div className="stat">
                  ₹{Number(item.price || 0).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="card">
                <div className="muted">Carpet area</div>
                <div className="stat">{item.carpet_area ?? "—"} sqft</div>
              </div>
              <div className="card">
                <div className="muted">Bedrooms</div>
                <div className="stat">{item.bedroom ?? "—"}</div>
              </div>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Details</h3>
              <p>{item.description || "No description."}</p>
              <div className="row meta">
                <span>Furnishing: {item.furnishing || "—"}</span>
                <span>
                  Floor: {item.floor ?? "—"}/{item.total_floors ?? "—"}
                </span>
                <span>Parking: {item.covered_parking ?? "—"}</span>
                <span>Posted: {item.posted_at || "—"}</span>
              </div>
            </div>
            <h2 style={{ marginTop: 28 }}>Similar listings</h2>
            <div className="listing-grid">
              {similar.map((x) => (
                <Link
                  className="listing-card"
                  href={`/listings/${encodeURIComponent(x.listing_id)}`}
                  key={x.listing_id}
                >
                  <strong>{x.apartment_name || "Property"}</strong>
                  <div className="price">
                    ₹{Number(x.price || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="meta">
                    {x.bedroom} BHK · {x.carpet_area} sqft
                  </div>
                </Link>
              ))}
            </div>
          </>
        )
      )}
    </AppShell>
  );
}

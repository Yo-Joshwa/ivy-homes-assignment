"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { getSession } from "../../lib/auth";
import { getSavedListings, removeSavedListing } from "../../lib/favourites";
import { Listing } from "../../lib/types";

export default function SavedListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const session = getSession();

    if (!session) return;

    setListings(getSavedListings(session.user.email));
  }, []);

  function remove(id: string) {
    const session = getSession();

    if (!session) return;

    removeSavedListing(session.user.email, id);

    setListings((current) =>
      current.filter((listing) => listing.listing_id !== id)
    );
  }

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Saved Listings</h1>
          <p className="muted">
            Properties you have saved
          </p>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="card">
          <h3>No saved listings</h3>
          <p className="muted">
            Save a listing to see it here.
          </p>

          <Link href="/listings" className="primary">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map((listing) => (
            <div className="listing-card" key={listing.listing_id}>
              <Link href={`/listings/${encodeURIComponent(listing.listing_id)}`}>
                <strong>
                  {listing.apartment_name || "Property"}
                </strong>

                <div className="price">
                  ₹{Number(listing.price || 0).toLocaleString("en-IN")}
                </div>

                <div className="meta">
                  {listing.bedroom ?? "—"} BHK ·{" "}
                  {listing.carpet_area ?? "—"} sqft
                </div>

                <div className="meta">
                  {listing.locality || "—"}
                </div>
              </Link>

              <button
                className="secondary"
                onClick={() => remove(listing.listing_id)}
                style={{ marginTop: 10 }}
              >
                Remove saved
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
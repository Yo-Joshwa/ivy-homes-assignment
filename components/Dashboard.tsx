"use client";

import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import { apiClient, fetchAll } from "../lib/api";
import { getSession } from "../lib/auth";
import { Listing } from "../lib/types";

export default function Dashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      const s = getSession();

      if (!s) return;

      try {
        // Try analytics first.
        const analytics = await apiClient.analytics(s.token);

        if (analytics) {
          setData(analytics);
          return;
        }

        // Fallback to listings data.
        const listings = await fetchAll<Listing>("/v1/listings", {}, s.token);

        const liveListings = listings.filter(
          (listing) => listing.is_live === true,
        );

        const prices = liveListings
          .map((listing) => Number(listing.price))
          .filter((price) => Number.isFinite(price) && price > 0);

        const pricePerSqft = liveListings
          .map((listing) => {
            const price = Number(listing.price);
            const area = Number(listing.carpet_area);

            if (
              !Number.isFinite(price) ||
              !Number.isFinite(area) ||
              area <= 0
            ) {
              return null;
            }

            return price / area;
          })
          .filter(
            (value): value is number =>
              value !== null && Number.isFinite(value),
          );

        const median = (values: number[]) => {
          if (values.length === 0) return null;

          const sorted = [...values].sort((a, b) => a - b);
          const middle = Math.floor(sorted.length / 2);

          return sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];
        };

        setData({
          total_listings: listings.length,
          active_listings: liveListings.length,
          median_price: median(prices),
          median_price_per_sqft: median(pricePerSqft),
        });
      } catch {
        // Keep dashboard usable even if the API fails.
      }
    };

    loadDashboard();
  }, []);

  const formatNumber = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })
      : String(value);
  };

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Chennai property overview</p>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card">
          <div className="muted">Listings</div>
          <div className="stat">{formatNumber(data?.total_listings)}</div>
        </div>

        <div className="card">
          <div className="muted">Median price</div>
          <div className="stat">
            {data?.median_price !== null && data?.median_price !== undefined
              ? `₹${formatNumber(data.median_price)}`
              : "—"}
          </div>
        </div>

        <div className="card">
          <div className="muted">Median ₹/sqft</div>
          <div className="stat">
            {formatNumber(data?.median_price_per_sqft)}
          </div>
        </div>

        <div className="card">
          <div className="muted">Assigned locality</div>
          <div className="stat">Velachery</div>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import { apiClient, fetchAll } from "../lib/api";
import { getSession } from "../lib/auth";
import { Listing } from "../lib/types";

export default function InsightsPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInsights = async () => {
      const s = getSession();

      if (!s) return;

      try {
        const analytics = await apiClient.analytics(s.token);

        if (analytics) {
          setData(analytics);
          return;
        }

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

        // 2BHK analysis
        const twoBhk = liveListings.filter(
          (listing) =>
            String(listing.bedroom).toLowerCase() === "2" ||
            Number(listing.bedroom) === 2,
        );

        const twoBhkPrices = twoBhk
          .map((listing) => Number(listing.price))
          .filter((price) => Number.isFinite(price) && price > 0);

        const twoBhkPricePerSqft = twoBhk
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

        // Locality counts
        const localityCounts: Record<string, number> = {};

        liveListings.forEach((listing) => {
          const locality =
            String(listing.locality || "Unknown").trim() || "Unknown";

          localityCounts[locality] = (localityCounts[locality] || 0) + 1;
        });

        const topLocalityEntry = Object.entries(localityCounts).sort(
          (a, b) => b[1] - a[1],
        )[0];

        // Furnishing counts
        const furnishingCounts: Record<string, number> = {};

        liveListings.forEach((listing) => {
          const furnishing =
            String(listing.furnishing || "Unknown").trim() || "Unknown";

          furnishingCounts[furnishing] =
            (furnishingCounts[furnishing] || 0) + 1;
        });

        setData({
          city: "Chennai",
          total_listings: listings.length,
          active_listings: liveListings.length,

          median_price: median(prices),
          median_price_per_sqft: median(pricePerSqft),

          two_bhk_count: twoBhk.length,
          two_bhk_average_price:
            twoBhkPrices.length > 0
              ? twoBhkPrices.reduce((a, b) => a + b, 0) / twoBhkPrices.length
              : null,

          two_bhk_average_price_per_sqft:
            twoBhkPricePerSqft.length > 0
              ? twoBhkPricePerSqft.reduce((a, b) => a + b, 0) /
                twoBhkPricePerSqft.length
              : null,

          top_locality: topLocalityEntry ? topLocalityEntry[0] : "—",

          top_locality_count: topLocalityEntry ? topLocalityEntry[1] : 0,

          furnishing_counts: furnishingCounts,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load insights");
      }
    };

    loadInsights();
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

  const formatRupees = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    return `₹${formatNumber(value)}`;
  };

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Insights</h1>
          <p className="muted">
            Market insights from the running listings data
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {data && (
        <>
          {/* Main statistics */}
          <div className="grid grid-4">
            <div className="card">
              <div className="muted">City</div>
              <div className="stat">{String(data.city ?? "Chennai")}</div>
            </div>

            <div className="card">
              <div className="muted">Total listings</div>
              <div className="stat">{formatNumber(data.total_listings)}</div>
            </div>

            <div className="card">
              <div className="muted">Active listings</div>
              <div className="stat">{formatNumber(data.active_listings)}</div>
            </div>

            <div className="card">
              <div className="muted">Median price</div>
              <div className="stat">{formatRupees(data.median_price)}</div>
            </div>
          </div>

          {/* 2BHK insights */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3>2BHK market</h3>

            <div className="grid grid-3" style={{ marginTop: 16 }}>
              <div>
                <div className="muted">Live 2BHK listings</div>
                <strong>{formatNumber(data.two_bhk_count)}</strong>
              </div>

              <div>
                <div className="muted">Average 2BHK price</div>
                <strong>{formatRupees(data.two_bhk_average_price)}</strong>
              </div>

              <div>
                <div className="muted">Average 2BHK ₹/sqft</div>
                <strong>
                  {formatNumber(data.two_bhk_average_price_per_sqft)}
                </strong>
              </div>
            </div>
          </div>

          {/* Locality and furnishing */}
          <div className="grid grid-2" style={{ marginTop: 20 }}>
            <div className="card">
              <h3>Most represented locality</h3>

              <div className="stat" style={{ marginTop: 12 }}>
                {String(data.top_locality ?? "—")}
              </div>

              <p className="muted">
                {formatNumber(data.top_locality_count)} live listings
              </p>
            </div>

            <div className="card">
              <h3>Furnishing distribution</h3>

              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gap: 8,
                }}
              >
                {Object.entries(data.furnishing_counts || {})
                  .sort(([, a], [, b]) => Number(b) - Number(a))
                  .map(([name, count]) => (
                    <div
                      key={name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{name}</span>
                      <strong>{formatNumber(count)}</strong>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Market overview */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3>Market overview</h3>

            <div className="grid grid-3" style={{ marginTop: 16 }}>
              <div>
                <div className="muted">Median ₹/sqft</div>
                <strong>{formatNumber(data.median_price_per_sqft)}</strong>
              </div>

              <div>
                <div className="muted">Active listing ratio</div>
                <strong>
                  {data.total_listings
                    ? `${(
                        (Number(data.active_listings) /
                          Number(data.total_listings)) *
                        100
                      ).toFixed(1)}%`
                    : "—"}
                </strong>
              </div>

              <div>
                <div className="muted">Data source</div>
                <strong>Listings API</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

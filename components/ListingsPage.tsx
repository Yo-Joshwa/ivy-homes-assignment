"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import { apiClient } from "../lib/api";
import { getSession } from "../lib/auth";
import { Listing } from "../lib/types";

export default function ListingsPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [error, setError] = useState("");
  async function load() {
    const s = getSession();
    if (!s) return;

    try {
      const allListings: Listing[] = [];
      let currentPage = 1;

      while (true) {
        const r = await apiClient.listings(
          {
            page: currentPage,
            limit: 200,
          },
          s.token,
        );

        allListings.push(...r.results);

        if (
          r.results.length === 0 ||
          allListings.length >= r.total ||
          r.results.length < 200
        ) {
          break;
        }

        currentPage++;
      }

      let filtered = allListings;

      // Locality
      if (locality.trim()) {
        const value = locality.trim().toLowerCase();

        filtered = filtered.filter((x) =>
          String(x.locality || "")
            .toLowerCase()
            .includes(value),
        );
      }

      // Bedrooms
      if (bhk) {
        const bedrooms = Number(bhk);

        filtered = filtered.filter((x) => Number(x.bedroom) === bedrooms);
      }

      // Minimum price
      if (min) {
        const minPrice = Number(min);

        filtered = filtered.filter((x) => Number(x.price) >= minPrice);
      }

      // Maximum price
      if (max) {
        const maxPrice = Number(max);

        filtered = filtered.filter((x) => Number(x.price) <= maxPrice);
      }

      // Furnishing
      if (furnishing) {
        const value = furnishing.toLowerCase();

        filtered = filtered.filter(
          (x) => String(x.furnishing || "").toLowerCase() === value,
        );
      }

      setTotal(filtered.length);

      // Frontend pagination: 20 listings per page
      const start = (page - 1) * 20;
      const end = start + 20;

      setItems(filtered.slice(start, end));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listings");
    }
  }
  useEffect(() => {
    load();
  }, [page, locality, bhk, min, max, furnishing]);
  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Listings</h1>
          <p className="muted">{total} records</p>
        </div>
      </div>
      <div className="toolbar">
        <input
          placeholder="Locality"
          value={locality}
          onChange={(e) => {
            setPage(1);
            setLocality(e.target.value);
          }}
        />
        <input
          placeholder="Bedrooms"
          type="number"
          value={bhk}
          onChange={(e) => {
            setPage(1);
            setBhk(e.target.value);
          }}
        />
        <input
          placeholder="Min price"
          type="number"
          value={min}
          onChange={(e) => {
            setPage(1);
            setMin(e.target.value);
          }}
        />
        <input
          placeholder="Max price"
          type="number"
          value={max}
          onChange={(e) => {
            setPage(1);
            setMax(e.target.value);
          }}
        />
        <select
          value={furnishing}
          onChange={(e) => {
            setPage(1);
            setFurnishing(e.target.value);
          }}
        >
          <option value="">Furnishing</option>
          <option>unfurnished</option>
          <option>semi-furnished</option>
          <option>fully-furnished</option>
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="listing-grid">
        {items.map((x) => (
          <Link
            className="listing-card"
            href={`/listings/${encodeURIComponent(x.listing_id)}`}
            key={x.listing_id}
          >
            <strong>{x.apartment_name || x.property_type || "Property"}</strong>
            <div className="price">
              ₹{Number(x.price || 0).toLocaleString("en-IN")}
            </div>
            <div className="meta">
              {x.bedroom ?? "—"} BHK · {x.carpet_area ?? "—"} sq ft ·{" "}
              {x.locality}
            </div>
            <div className="meta">
              {x.furnishing || "—"} ·{" "}
              {x.is_live === false ? "Inactive" : "Live"}
            </div>
          </Link>
        ))}
      </div>
      <div className="pagination">
        <button
          className="secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} / {Math.max(1, Math.ceil(total / 20))}
        </span>
        <button
          className="secondary"
          disabled={page * 20 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </AppShell>
  );
}

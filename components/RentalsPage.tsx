"use client";
import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import { apiClient } from "../lib/api";
import { getSession } from "../lib/auth";
import { Rental } from "../lib/types";

export default function RentalsPage() {
  const [items, setItems] = useState<Rental[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [locality, setLocality] = useState("");
  useEffect(() => {
  const s = getSession();
  if (!s) return;

  async function loadRentals() {
    try {
      const allRentals: Rental[] = [];
      let currentPage = 1;
      let apiTotal = 0;

      while (true) {
        const r = await apiClient.rentals(
          {
            page: currentPage,
            limit: 200,
            locality: locality || undefined,
          },
          s.token
        );

        allRentals.push(...r.results);
        apiTotal = r.total;

        if (
          r.results.length === 0 ||
          allRentals.length >= r.total ||
          r.results.length < 200
        ) {
          break;
        }

        currentPage++;
      }

      setTotal(apiTotal);

      const start = (page - 1) * 20;
      const end = start + 20;

      setItems(allRentals.slice(start, end));
    } catch {
      setItems([]);
      setTotal(0);
    }
  }

  loadRentals();
}, [page, locality]);
  return (
    <AppShell>
      <h1>Rentals</h1>
      <div className="toolbar">
        <input
          placeholder="Locality"
          value={locality}
          onChange={(e) => {
            setPage(1);
            setLocality(e.target.value);
          }}
        />
      </div>
      <div className="listing-grid">
        {items.map((x) => (
          <div className="listing-card" key={x.listing_id}>
            <strong>{x.title || x.apartment_name || "Rental"}</strong>
            <div className="price">
              ₹{Number(x.price || 0).toLocaleString("en-IN")} / month
            </div>
            <div className="meta">
              {x.bedroom} BHK · {x.carpet_area} sqft · {x.furnishing}
            </div>
            <div className="meta">
              Deposit ₹{Number(x.deposit || 0).toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>
      <div className="pagination">
        <button
          className="secondary"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          {page} / {Math.max(1, Math.ceil(total / 20))}
        </span>
        <button
          className="secondary"
          disabled={page * 20 >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </AppShell>
  );
}

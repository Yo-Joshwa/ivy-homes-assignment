"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "./AppShell";
import { fetchAll } from "../lib/api";
import { getSession } from "../lib/auth";
import { Rental } from "../lib/types";

export default function RentalsPage() {
  const [allRentals, setAllRentals] = useState<Rental[]>([]);
  const [locality, setLocality] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const PAGE_SIZE = 20;

  // Fetch rentals ONLY ONCE
  useEffect(() => {
    const session = getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    async function loadRentals() {
      try {
        setLoading(true);
        setError("");

        const rentals = await fetchAll<Rental>(
          "/v1/rentals",
          {},
          session?.token,
        );

        console.log("TOTAL RENTALS:", rentals.length);

        setAllRentals(rentals);
      } catch (err) {
        console.error("Failed to load rentals:", err);

        setError(err instanceof Error ? err.message : "Failed to load rentals");
      } finally {
        setLoading(false);
      }
    }

    loadRentals();
  }, []);

  const filteredRentals = useMemo(() => {
    const search = locality.trim().toLowerCase();

    if (!search) {
      return allRentals;
    }

    return allRentals.filter((rental) =>
      String(rental.locality || "")
        .trim()
        .toLowerCase()
        .includes(search),
    );
  }, [allRentals, locality]);

  const total = filteredRentals.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const validPage = Math.min(page, totalPages);

  const items = filteredRentals.slice(
    (validPage - 1) * PAGE_SIZE,
    validPage * PAGE_SIZE,
  );

  return (
    <AppShell>
      <h1>Rentals</h1>

      <div className="toolbar">
        <input
          placeholder="Search locality"
          value={locality}
          onChange={(e) => {
            setLocality(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading && <p className="meta">Loading rentals...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="meta">
            {total} rental{total === 1 ? "" : "s"}
            {locality.trim() ? ` found in "${locality.trim()}"` : ""}
          </div>

          {items.length > 0 ? (
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

                  <div className="meta">{x.locality}</div>

                  <div className="meta">
                    Deposit ₹{Number(x.deposit || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="meta">
              No rentals found
              {locality.trim() ? ` for "${locality.trim()}".` : "."}
            </p>
          )}

          <div className="pagination">
            <button
              className="secondary"
              disabled={validPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>

            <span>
              {validPage} / {totalPages}
            </span>

            <button
              className="secondary"
              disabled={validPage >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}

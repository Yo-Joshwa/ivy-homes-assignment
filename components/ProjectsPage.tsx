"use client";
import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import { apiClient } from "../lib/api";
import { getSession } from "../lib/auth";
import { Project } from "../lib/types";

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  useEffect(() => {
  const s = getSession();
  if (!s) return;

  async function loadProjects() {
    try {
      const allProjects: Project[] = [];
      let currentPage = 1;

      while (true) {
        const r = await apiClient.projects(
          {
            page: currentPage,
            limit: 100,
          },
          s.token
        );

        allProjects.push(...r.results);

        if (
          r.results.length === 0 ||
          allProjects.length >= r.total ||
          r.results.length < 100
        ) {
          break;
        }

        currentPage++;
      }

      setItems(allProjects);
    } catch {
      setItems([]);
    }
  }

  loadProjects();
}, []);
  return (
    <AppShell>
      <h1>Projects</h1>
      <div className="listing-grid">
        {items.map((x) => (
          <div className="listing-card" key={x.project_id}>
            <strong>{x.apartment_name || x.project_id}</strong>
            <div className="meta">
              {x.developer_name} · {x.locality}
            </div>
            <div className="price">
              ₹{Number(x.price_min || 0).toLocaleString("en-IN")} – ₹
              {Number(x.price_max || 0).toLocaleString("en-IN")}
            </div>
            <div className="meta">
              {x.min_area_sqft}–{x.max_area_sqft} sqft · {x.total_listings}{" "}
              reported listings
            </div>
            <div className="meta">
              {x.project_status || "—"} · {x.project_id}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

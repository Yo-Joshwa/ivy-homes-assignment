"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, getSession, Session } from "../lib/auth";
import { useRouter } from "next/navigation";
import { apiClient } from "../lib/api";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  useEffect(() => {
    const s = getSession();
    if (!s) router.replace("/login");
    else setSession(s);
  }, [router]);
  async function logout() {
    if (session) {
      try {
        await apiClient.logout(session.token);
      } catch {}
    }
    clearSession();
    router.replace("/login");
  }
  if (!session) return null;
  return (
    <div className="layout">
      <aside className="sidebar">
        <strong>IVY HOMES</strong>
        <div className="meta" style={{ color: "#9ca3af", marginTop: 8 }}>
          {session.user.email}
        </div>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/listings">Listings</Link>
          <Link href="/saved">Saved Listings</Link>
          <Link href="/rentals">Rentals</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/insights">Insights</Link>
        </nav>
        <button
          className="secondary"
          style={{ marginTop: 24 }}
          onClick={logout}
        >
          Logout
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

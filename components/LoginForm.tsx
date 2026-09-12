"use client";
import { FormEvent, useState } from "react";
import { apiClient } from "../lib/api";
import { saveSession } from "../lib/auth";
import { useRouter } from "next/navigation";

const USERS = ["demo1@ivy.homes","demo2@ivy.homes","demo3@ivy.homes"];

export default function LoginForm() {
  const [email,setEmail] = useState(USERS[0]);
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const result = await apiClient.login(email,password);
saveSession({
  token: result.access_token,
  expiresAt: Date.now() + result.expires_in * 1000,
  user: result.user,
});
      router.replace("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit}>
    <div className="field"><label>Email</label><select value={email} onChange={e=>setEmail(e.target.value)}>{USERS.map(u=><option key={u}>{u}</option>)}</select></div>
    <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
    {error && <p className="error">{error}</p>}
    <button className="primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
  </form>;
}
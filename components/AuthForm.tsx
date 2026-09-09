"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = mode === "signup"
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm your account. The link will bring you back to create your store.");
      setLoading(false);
      return;
    }

    router.push(mode === "signup" ? "/onboarding" : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 460, margin: "60px auto", padding: 28 }}>
      <div className="eyebrow">IZIRA SELLER</div>
      <h1 style={{ marginBottom: 8 }}>{mode === "signup" ? "Create your seller account" : "Welcome back"}</h1>
      <p className="muted">{mode === "signup" ? "Start your storefront in a few minutes." : "Sign in to manage your store and orders."}</p>
      <div className="field"><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></div>
      <div className="field"><label>Password</label><input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
      {message && <div className="card" style={{ padding: 12, marginBottom: 14 }}>{message}</div>}
      <button className="btn" disabled={loading} style={{ width: "100%" }}>{loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
      <p className="muted" style={{ textAlign: "center", marginTop: 18 }}>
        {mode === "signup" ? <>Already have an account? <a href="/login"><b>Sign in</b></a></> : <>New to IZIRA? <a href="/signup"><b>Create an account</b></a></>}
      </p>
    </form>
  );
}

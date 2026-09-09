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
      setMessage("Check your email to confirm your account. The link will bring you back to buka your KADAI.");
      setLoading(false);
      return;
    }

    router.push(mode === "signup" ? "/onboarding" : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 460, margin: "60px auto", padding: 28 }}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:30,fontWeight:900,letterSpacing:"-.04em",lineHeight:1}}>KADAI</div>
        <div className="muted" style={{fontSize:12,marginTop:4}}>by IZIRA</div>
      </div>
      <div className="eyebrow">{mode === "signup" ? "BUKA KADAI" : "WELCOME BACK"}</div>
      <h1 style={{ marginBottom: 8 }}>{mode === "signup" ? "Buka Kadai" : "Your KADAI is waiting"}</h1>
      <p className="muted">{mode === "signup" ? "Create your online kadai in minutes. No website skills needed." : "Sign in to check orders, products and today’s workload."}</p>
      <div className="field"><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></div>
      <div className="field"><label>Password</label><input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
      {message && <div className="card" style={{ padding: 12, marginBottom: 14 }}>{message}</div>}
      <button className="btn" disabled={loading} style={{ width: "100%" }}>{loading ? "Please wait…" : mode === "signup" ? "Buka Kadai" : "Sign in"}</button>
      <p className="muted" style={{ textAlign: "center", marginTop: 18 }}>
        {mode === "signup" ? <>Already have a KADAI? <a href="/login"><b>Sign in</b></a></> : <>New to KADAI? <a href="/signup"><b>Buka Kadai</b></a></>}
      </p>
    </form>
  );
}

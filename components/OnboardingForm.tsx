"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const reserved = new Set(["dashboard","login","signup","pricing","about","admin","api","onboarding","support","settings"]);

function normaliseSlug(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)}

export default function OnboardingForm(){
  const router=useRouter();
  const supabase=createClient();
  const [name,setName]=useState("");
  const [slug,setSlug]=useState("");
  const [description,setDescription]=useState("");
  const [whatsapp,setWhatsapp]=useState("");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const clean=useMemo(()=>normaliseSlug(slug||name),[slug,name]);

  async function submit(e:FormEvent){
    e.preventDefault(); setLoading(true); setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.push("/login");return}
    if(clean.length<3){setMessage("Store URL must be at least 3 characters.");setLoading(false);return}
    if(reserved.has(clean)){setMessage("That store URL is reserved. Try another one.");setLoading(false);return}
    const {data:existing}=await supabase.from("businesses").select("id").eq("slug",clean).maybeSingle();
    if(existing){setMessage("That store URL is already taken.");setLoading(false);return}
    const {error}=await supabase.from("businesses").insert({owner_id:user.id,name:name.trim(),slug:clean,description:description.trim()||null,whatsapp:whatsapp.trim()||null});
    if(error){setMessage(error.message);setLoading(false);return}
    router.push("/dashboard");router.refresh();
  }

  return <form onSubmit={submit} className="card" style={{maxWidth:620,margin:"50px auto",padding:28}}>
    <div className="eyebrow">STEP 1 OF 2</div><h1>Create your storefront</h1><p className="muted">This becomes your public ordering page.</p>
    <div className="field"><label>Business name</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Aisyah Bakery"/></div>
    <div className="field"><label>Your IZIRA link</label><div style={{display:"flex",alignItems:"center",gap:8}}><span className="muted">izira.xyz/</span><input required value={slug} onChange={e=>setSlug(normaliseSlug(e.target.value))} placeholder={normaliseSlug(name)||"aisyahbakery"}/></div><div className="muted" style={{fontSize:13,marginTop:6}}>Preview: izira.xyz/{clean||"yourstore"}</div></div>
    <div className="field"><label>Short description</label><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Home-baked treats · Preorder only"/></div>
    <div className="field"><label>WhatsApp number</label><input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="+673 ..."/></div>
    {message&&<div className="card" style={{padding:12,marginBottom:14}}>{message}</div>}
    <button className="btn" disabled={loading}>{loading?"Creating store…":"Create my store"}</button>
  </form>
}

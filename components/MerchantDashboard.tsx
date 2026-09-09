"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Business={id:string;name:string;slug:string;plan:string;description:string|null};
type Product={id:string;name:string;description:string|null;price:number|string;stock_limit:number|null;is_active:boolean};
type Order={id:string;order_number:number;customer_name:string;total:number|string;fulfilment:string;payment_status:string;order_status:string;created_at:string};

export default function MerchantDashboard(){
 const router=useRouter(); const supabase=createClient();
 const [business,setBusiness]=useState<Business|null>(null); const [products,setProducts]=useState<Product[]>([]); const [orders,setOrders]=useState<Order[]>([]);
 const [loading,setLoading]=useState(true); const [name,setName]=useState(""); const [description,setDescription]=useState(""); const [price,setPrice]=useState(""); const [stock,setStock]=useState(""); const [message,setMessage]=useState("");

 async function load(){
  const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace("/login");return}
  const {data:b}=await supabase.from("businesses").select("id,name,slug,plan,description").eq("owner_id",user.id).order("created_at").limit(1).maybeSingle();
  if(!b){router.replace("/onboarding");return}
  setBusiness(b as Business);
  const [{data:p},{data:o}]=await Promise.all([
   supabase.from("products").select("id,name,description,price,stock_limit,is_active").eq("business_id",b.id).order("created_at",{ascending:false}),
   supabase.from("orders").select("id,order_number,customer_name,total,fulfilment,payment_status,order_status,created_at").eq("business_id",b.id).order("created_at",{ascending:false}).limit(20)
  ]);
  setProducts((p||[]) as Product[]); setOrders((o||[]) as Order[]); setLoading(false);
 }
 useEffect(()=>{load()},[]);

 const today=useMemo(()=>{const d=new Date().toDateString();return orders.filter(o=>new Date(o.created_at).toDateString()===d)},[orders]);
 const salesToday=today.reduce((s,o)=>s+Number(o.total),0); const awaiting=orders.filter(o=>o.payment_status==="awaiting_payment"||o.payment_status==="receipt_uploaded").length;

 async function addProduct(e:FormEvent){e.preventDefault(); if(!business)return; setMessage("");
  const value=Number(price); if(!name.trim()||!Number.isFinite(value)||value<0){setMessage("Enter a valid product name and price.");return}
  const {error}=await supabase.from("products").insert({business_id:business.id,name:name.trim(),description:description.trim()||null,price:value,stock_limit:stock?Number(stock):null});
  if(error){setMessage(error.message);return} setName("");setDescription("");setPrice("");setStock("");await load();
 }
 async function toggleProduct(p:Product){await supabase.from("products").update({is_active:!p.is_active}).eq("id",p.id);await load()}
 async function signOut(){await supabase.auth.signOut();router.push("/login")}
 if(loading)return <main className="shell"><div className="card" style={{marginTop:60}}>Loading your business…</div></main>;
 if(!business)return null;
 return <div className="dashboard"><aside className="sidebar"><div className="brand" style={{marginBottom:30}}>IZIRA</div><a className="active">Overview</a><a href="#orders">Orders</a><a href="#products">Products</a><a>Calendar</a><a>Customers</a><a>Store</a><a>Settings</a><div style={{marginTop:30}}><Link href={`/${business.slug}`}>View storefront →</Link></div><button className="btn" style={{marginTop:18}} onClick={signOut}>Sign out</button></aside><main className="main"><div className="eyebrow">{business.name} · {business.plan}</div><h1 style={{fontSize:42,margin:"6px 0 26px"}}>Your business at a glance.</h1><div className="metric-grid"><div className="metric"><span className="muted">Orders today</span><b>{today.length}</b></div><div className="metric"><span className="muted">Sales today</span><b>BND {salesToday.toFixed(2)}</b></div><div className="metric"><span className="muted">Awaiting payment</span><b>{awaiting}</b></div><div className="metric"><span className="muted">Products</span><b>{products.length}</b></div></div>
 <section id="orders" className="section"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2>Recent orders</h2><span className="muted">Live from Supabase</span></div>{orders.length===0?<div className="card"><b>No orders yet.</b><p className="muted">Share izira.xyz/{business.slug} when your storefront is ready.</p></div>:<div className="table"><div className="tr head"><span>Order</span><span>Customer</span><span>Total</span><span>Method</span><span>Status</span></div>{orders.map(o=><div className="tr" key={o.id}><span><b>#{o.order_number}</b></span><span>{o.customer_name}</span><span>BND {Number(o.total).toFixed(2)}</span><span>{o.fulfilment}</span><span><span className="badge">{o.order_status.replaceAll("_"," ")}</span></span></div>)}</div>}</section>
 <section id="products" className="section"><h2>Products</h2><div className="grid3" style={{alignItems:"start"}}><form className="card" onSubmit={addProduct}><h3>Add product</h3><div className="field"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} required/></div><div className="field"><label>Description</label><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)}/></div><div className="field"><label>Price (BND)</label><input type="number" step="0.01" min="0" value={price} onChange={e=>setPrice(e.target.value)} required/></div><div className="field"><label>Stock / production limit</label><input type="number" min="0" value={stock} onChange={e=>setStock(e.target.value)} placeholder="Optional"/></div>{message&&<p>{message}</p>}<button className="btn">Add product</button></form><div style={{gridColumn:"span 2",display:"grid",gap:12}}>{products.length===0?<div className="card">No products yet.</div>:products.map(p=><div className="card" key={p.id} style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"center"}}><div><b>{p.name}</b><div className="muted">BND {Number(p.price).toFixed(2)} · {p.stock_limit==null?"No limit":`${p.stock_limit} max`} · {p.is_active?"Visible":"Hidden"}</div></div><button className="btn" onClick={()=>toggleProduct(p)}>{p.is_active?"Hide":"Show"}</button></div>)}</div></div></section>
 </main></div>
}

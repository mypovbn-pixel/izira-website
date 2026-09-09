"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { transportWhatsApp, whatsAppHref } from "@/lib/whatsappTemplates";

type Business={id:string;name:string;slug:string;whatsapp:string|null};
type Service={id:string;name:string;description:string|null;price:number|string;duration_minutes:number;buffer_minutes:number;service_kind:"runner"|"transport";pricing_mode:"fixed"|"quote";max_passengers:number|null;is_active:boolean};
type Job={id:string;service_id:string|null;customer_name:string;customer_phone:string;starts_at:string;ends_at:string;total:number|string;payment_status:string;appointment_status:string;booking_kind:"runner"|"transport";pickup_location:string|null;destination:string|null;passenger_count:number|null;item_description:string|null;trip_direction:string|null;return_at:string|null;series_id:string|null;recurring_until:string|null;recurrence_weekdays:number[]|null;quoted_amount:number|string|null};

const statusOptions=["pending","confirmed","completed","cancelled","no_show"];
const paymentOptions=["quote_pending","awaiting_payment","receipt_uploaded","paid","rejected"];

export default function TransportManager(){
 const router=useRouter();
 const supabase=createClient();
 const [business,setBusiness]=useState<Business|null>(null);
 const [services,setServices]=useState<Service[]>([]);
 const [jobs,setJobs]=useState<Job[]>([]);
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState("");
 const [kind,setKind]=useState<"runner"|"transport">("transport");
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [pricingMode,setPricingMode]=useState<"fixed"|"quote">("quote");
 const [price,setPrice]=useState("");
 const [duration,setDuration]=useState("60");
 const [buffer,setBuffer]=useState("15");
 const [maxPassengers,setMaxPassengers]=useState("4");
 const [quoteValues,setQuoteValues]=useState<Record<string,string>>({});

 async function load(){
  setLoading(true);
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return}
  const {data:b}=await supabase.from("businesses").select("id,name,slug,whatsapp").eq("owner_id",user.id).order("created_at").limit(1).maybeSingle();
  if(!b){router.replace("/onboarding");return}
  const biz=b as Business;setBusiness(biz);
  const [{data:s},{data:j}]=await Promise.all([
   supabase.from("services").select("id,name,description,price,duration_minutes,buffer_minutes,service_kind,pricing_mode,max_passengers,is_active").eq("business_id",biz.id).in("service_kind",["runner","transport"]).order("created_at",{ascending:false}),
   supabase.from("appointments").select("id,service_id,customer_name,customer_phone,starts_at,ends_at,total,payment_status,appointment_status,booking_kind,pickup_location,destination,passenger_count,item_description,trip_direction,return_at,series_id,recurring_until,recurrence_weekdays,quoted_amount").eq("business_id",biz.id).in("booking_kind",["runner","transport"]).order("starts_at",{ascending:true}).limit(250)
  ]);
  setServices((s||[]) as Service[]);setJobs((j||[]) as Job[]);setLoading(false);
 }
 useEffect(()=>{load()},[]);

 const upcoming=useMemo(()=>jobs.filter(j=>new Date(j.starts_at)>=new Date()&&!['cancelled','completed'].includes(j.appointment_status)),[jobs]);
 const today=useMemo(()=>{const d=new Date().toDateString();return upcoming.filter(j=>new Date(j.starts_at).toDateString()===d)},[upcoming]);
 const quotePending=upcoming.filter(j=>j.payment_status==="quote_pending");
 const recurringSeries=useMemo(()=>new Set(upcoming.filter(j=>j.series_id).map(j=>j.series_id)).size,[upcoming]);
 const next=upcoming[0];

 function serviceFor(job:Job){return services.find(s=>s.id===job.service_id)}
 function transportInput(job:Job){const service=serviceFor(job);return {businessName:business!.name,customerName:job.customer_name,serviceName:service?.name,startsAt:job.starts_at,pickup:job.pickup_location||"Pickup",destination:job.destination||"Destination",total:Number(job.total)>0?Number(job.total):undefined,kind:job.booking_kind}}

 async function addService(e:FormEvent){
  e.preventDefault();if(!business)return;
  const value=pricingMode==="quote"?0:Number(price);
  if(!name.trim()||!Number.isFinite(value)||value<0){setMessage("Enter a service name and valid fare.");return}
  const {error}=await supabase.from("services").insert({business_id:business.id,name:name.trim(),description:description.trim()||null,price:value,duration_minutes:Number(duration)||60,buffer_minutes:Number(buffer)||0,service_kind:kind,pricing_mode:pricingMode,max_passengers:kind==="transport"?Number(maxPassengers)||null:null});
  if(error){setMessage(error.message);return}
  setName("");setDescription("");setPrice("");setMessage(kind==="runner"?"Runner service added.":"Transport service added.");await load();
 }
 async function toggleService(service:Service){await supabase.from("services").update({is_active:!service.is_active}).eq("id",service.id);await load()}
 async function updateJob(job:Job,field:"appointment_status"|"payment_status",value:string){const updates:any={[field]:value};if(field==="appointment_status"&&value==="cancelled")updates.cancelled_at=new Date().toISOString();const {error}=await supabase.from("appointments").update(updates).eq("id",job.id);setMessage(error?error.message:"Trip updated.");await load()}
 async function setQuote(job:Job){const value=Number(quoteValues[job.id]);if(!Number.isFinite(value)||value<0){setMessage("Enter a valid BND fare.");return}const {error}=await supabase.from("appointments").update({total:value,quoted_amount:value,payment_status:"awaiting_payment"}).eq("id",job.id);if(error){setMessage(error.message);return}setQuoteValues(v=>({...v,[job.id]:""}));setMessage("Fare saved. You can send the quote on WhatsApp now.");await load()}

 if(loading)return <main className="shell"><div className="card" style={{marginTop:60}}>Opening runner & transport…</div></main>;
 if(!business)return null;

 return <main className="shell" style={{paddingTop:30,paddingBottom:80}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
   <div><div className="eyebrow">KADAI · {business.name}</div><h1 style={{margin:"5px 0"}}>Runner & Transport</h1><p className="muted" style={{margin:0}}>One-off trips, runner jobs and recurring school or staff transport.</p></div>
   <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Link className="btn secondary" href="/dashboard">← Dashboard</Link><Link className="btn" href={`/${business.slug}`}>View my KADAI</Link></div>
  </div>

  <div className="metric-grid" style={{margin:"26px 0"}}>
   <div className="metric"><span className="muted">Trips today</span><b>{today.length}</b></div>
   <div className="metric"><span className="muted">Next pickup</span><b style={{fontSize:18}}>{next?new Date(next.starts_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}</b></div>
   <div className="metric"><span className="muted">Need quote</span><b>{quotePending.length}</b></div>
   <div className="metric"><span className="muted">Recurring schedules</span><b>{recurringSeries}</b></div>
  </div>

  {message&&<div className="card" style={{marginBottom:18,display:"flex",justifyContent:"space-between"}}>{message}<button style={{border:0,background:"transparent"}} onClick={()=>setMessage("")}>×</button></div>}

  <section className="section" style={{paddingTop:24}}>
   <div className="eyebrow">SETUP</div><h2>Add runner / transport service</h2>
   <div className="grid3" style={{alignItems:"start"}}>
    <form className="card" onSubmit={addService}>
     <div className="field"><label>Service type</label><select value={kind} onChange={e=>setKind(e.target.value as "runner"|"transport")}><option value="transport">Transport / Brunei uber</option><option value="runner">Runner / delivery errand</option></select></div>
     <div className="field"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder={kind==="transport"?"School transport / Airport trip":"Document runner"} required/></div>
     <div className="field"><label>Description</label><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What is included? Areas served?"/></div>
     <div className="field"><label>Fare</label><select value={pricingMode} onChange={e=>setPricingMode(e.target.value as "fixed"|"quote")}><option value="quote">Quote each request</option><option value="fixed">Fixed fare</option></select></div>
     {pricingMode==="fixed"&&<div className="field"><label>Price (BND)</label><input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} required/></div>}
     <div className="field"><label>Estimated job time (minutes)</label><input type="number" min="5" value={duration} onChange={e=>setDuration(e.target.value)}/></div>
     <div className="field"><label>Buffer between jobs</label><input type="number" min="0" value={buffer} onChange={e=>setBuffer(e.target.value)}/></div>
     {kind==="transport"&&<div className="field"><label>Maximum passengers</label><input type="number" min="1" value={maxPassengers} onChange={e=>setMaxPassengers(e.target.value)}/></div>}
     <button className="btn">Add service</button>
    </form>
    <div style={{gridColumn:"span 2",display:"grid",gap:10}}>{services.length===0?<div className="card"><b>No runner or transport services yet.</b><p className="muted">Add one on the left. It will appear on your public KADAI storefront.</p></div>:services.map(s=><div className="card" key={s.id} style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap"}}><div><div className="eyebrow">{s.service_kind==="runner"?"RUNNER":"TRANSPORT"}</div><b>{s.name}</b><div className="muted">{s.pricing_mode==="quote"?"Fare by quote":`BND ${Number(s.price).toFixed(2)}`} · {s.duration_minutes} min · {s.buffer_minutes} min buffer{s.max_passengers?` · max ${s.max_passengers} passengers`:""}</div></div><button className="btn secondary" onClick={()=>toggleService(s)}>{s.is_active?"Hide":"Show"}</button></div>)}</div>
   </div>
  </section>

  <section className="section">
   <div className="eyebrow">TODAY & UPCOMING</div><h2>Trips and jobs</h2>
   <div style={{display:"grid",gap:10}}>{upcoming.length===0?<div className="card"><b>No upcoming runner or transport jobs.</b></div>:upcoming.map(job=>{const service=serviceFor(job);const input=transportInput(job);return <div className="card" key={job.id} style={{display:"grid",gridTemplateColumns:"1.35fr .9fr .9fr",gap:14,alignItems:"center"}}>
    <div><div className="eyebrow">{job.booking_kind==="runner"?"RUNNER":"TRANSPORT"}{job.series_id?" · RECURRING":""}</div><b>{job.customer_name} · {service?.name||"Service"}</b><div className="muted">{new Date(job.starts_at).toLocaleString()} · {job.pickup_location} → {job.destination}</div>{job.booking_kind==="transport"&&job.passenger_count&&<small className="muted">{job.passenger_count} passenger{job.passenger_count===1?"":"s"}{job.trip_direction==="return"?" · return trip":""}</small>}{job.booking_kind==="runner"&&job.item_description&&<small className="muted">{job.item_description}</small>}</div>
    <div style={{display:"grid",gap:8}}>{job.payment_status==="quote_pending"?<><div style={{display:"flex",gap:6}}><input style={{minWidth:0,width:"100%",padding:9,border:"1px solid #d9cbc0",borderRadius:10}} type="number" min="0" step="0.01" placeholder="BND fare" value={quoteValues[job.id]||""} onChange={e=>setQuoteValues(v=>({...v,[job.id]:e.target.value}))}/><button className="btn" style={{padding:"8px 12px"}} onClick={()=>setQuote(job)}>Save</button></div></>:<select value={job.payment_status} onChange={e=>updateJob(job,"payment_status",e.target.value)}>{paymentOptions.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select>}<select value={job.appointment_status} onChange={e=>updateJob(job,"appointment_status",e.target.value)}>{statusOptions.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></div>
    <div style={{display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap"}}>{Number(job.total)>0&&<a className="btn secondary" target="_blank" rel="noreferrer" href={whatsAppHref(job.customer_phone,transportWhatsApp.quote({...input,total:Number(job.total)}))}>Send fare</a>}<a className="btn secondary" target="_blank" rel="noreferrer" href={whatsAppHref(job.customer_phone,job.appointment_status==="pending"?transportWhatsApp.confirmed(input):transportWhatsApp.reminder(input))}>WhatsApp</a></div>
   </div>})}</div>
  </section>

  <section className="card" style={{marginTop:10}}><div className="eyebrow">HOW RECURRING WORKS</div><h3>School runs and monthly transport</h3><p className="muted">Customers can select recurring days and an end date from your storefront. KADAI creates the individual scheduled trips and checks each requested date against your hours, blocked time and existing bookings.</p></section>
 </main>
}

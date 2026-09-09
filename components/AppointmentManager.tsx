"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Business={id:string;name:string;slug:string;business_mode:"products"|"appointments"|"both";whatsapp:string|null};
type Service={id:string;name:string;description:string|null;price:number|string;duration_minutes:number;buffer_minutes:number;deposit_amount:number|string|null;is_active:boolean};
type Appointment={id:string;service_id:string|null;customer_name:string;customer_phone:string;starts_at:string;ends_at:string;total:number|string;payment_status:string;appointment_status:string;note:string|null};

const appointmentStates=["pending","confirmed","completed","cancelled","no_show"];
const paymentStates=["awaiting_payment","receipt_uploaded","paid","rejected"];

function phoneForWhatsApp(value:string){return value.replace(/[^0-9]/g,"")}
function waHref(phone:string,message:string){return `https://wa.me/${phoneForWhatsApp(phone)}?text=${encodeURIComponent(message)}`}

export default function AppointmentManager(){
 const router=useRouter(); const supabase=createClient();
 const [business,setBusiness]=useState<Business|null>(null); const [services,setServices]=useState<Service[]>([]); const [appointments,setAppointments]=useState<Appointment[]>([]); const [loading,setLoading]=useState(true); const [message,setMessage]=useState("");
 const [serviceName,setServiceName]=useState(""); const [serviceDescription,setServiceDescription]=useState(""); const [price,setPrice]=useState(""); const [duration,setDuration]=useState("60"); const [buffer,setBuffer]=useState("0"); const [deposit,setDeposit]=useState("");
 const [apptService,setApptService]=useState(""); const [customerName,setCustomerName]=useState(""); const [customerPhone,setCustomerPhone]=useState(""); const [startsAt,setStartsAt]=useState(""); const [note,setNote]=useState("");

 async function load(){
  const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace("/login");return}
  const {data:b}=await supabase.from("businesses").select("id,name,slug,business_mode,whatsapp").eq("owner_id",user.id).order("created_at").limit(1).maybeSingle();
  if(!b){router.replace("/onboarding");return}
  const biz=b as Business; setBusiness(biz);
  const [{data:s},{data:a}]=await Promise.all([
   supabase.from("services").select("id,name,description,price,duration_minutes,buffer_minutes,deposit_amount,is_active").eq("business_id",biz.id).order("created_at",{ascending:false}),
   supabase.from("appointments").select("id,service_id,customer_name,customer_phone,starts_at,ends_at,total,payment_status,appointment_status,note").eq("business_id",biz.id).order("starts_at",{ascending:true}).limit(150)
  ]);
  setServices((s||[]) as Service[]); setAppointments((a||[]) as Appointment[]); setLoading(false);
 }
 useEffect(()=>{load()},[]);

 const upcoming=useMemo(()=>appointments.filter(a=>new Date(a.starts_at)>=new Date()&&a.appointment_status!=="cancelled"),[appointments]);
 const today=useMemo(()=>{const d=new Date().toDateString();return appointments.filter(a=>new Date(a.starts_at).toDateString()===d&&a.appointment_status!=="cancelled")},[appointments]);
 const awaiting=appointments.filter(a=>a.payment_status==="awaiting_payment"||a.payment_status==="receipt_uploaded").length;
 const next=upcoming[0];

 async function addService(e:FormEvent){e.preventDefault(); if(!business)return; setMessage(""); const p=Number(price),d=Number(duration),buf=Number(buffer); if(!serviceName.trim()||!Number.isFinite(p)||p<0||!Number.isFinite(d)||d<=0){setMessage("Enter a valid service name, price and duration.");return} const {error}=await supabase.from("services").insert({business_id:business.id,name:serviceName.trim(),description:serviceDescription.trim()||null,price:p,duration_minutes:d,buffer_minutes:Number.isFinite(buf)&&buf>=0?buf:0,deposit_amount:deposit?Number(deposit):null}); if(error){setMessage(error.message);return} setServiceName("");setServiceDescription("");setPrice("");setDuration("60");setBuffer("0");setDeposit("");await load()}
 async function toggleService(s:Service){await supabase.from("services").update({is_active:!s.is_active}).eq("id",s.id);await load()}
 async function addAppointment(e:FormEvent){e.preventDefault(); if(!business)return; const service=services.find(s=>s.id===apptService); if(!service||!customerName.trim()||!customerPhone.trim()||!startsAt){setMessage("Choose a service and complete the booking details.");return} const start=new Date(startsAt); const end=new Date(start.getTime()+service.duration_minutes*60000); const {error}=await supabase.from("appointments").insert({business_id:business.id,service_id:service.id,customer_name:customerName.trim(),customer_phone:customerPhone.trim(),starts_at:start.toISOString(),ends_at:end.toISOString(),total:Number(service.price),note:note.trim()||null}); if(error){setMessage(error.message);return} setApptService("");setCustomerName("");setCustomerPhone("");setStartsAt("");setNote("");await load()}
 async function updateAppointment(id:string,field:"appointment_status"|"payment_status",value:string){await supabase.from("appointments").update({[field]:value}).eq("id",id);await load()}

 if(loading)return <main className="shell"><div className="card" style={{marginTop:60}}>Opening appointments…</div></main>;
 if(!business)return null;

 return <main className="shell" style={{paddingTop:32,paddingBottom:80}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:26,flexWrap:"wrap"}}><div><div className="eyebrow">KADAI · {business.name}</div><h1 style={{margin:"4px 0 4px"}}>Appointments</h1><p className="muted" style={{margin:0}}>Bookings, services and customer follow-up in one place.</p></div><div style={{display:"flex",gap:10}}><Link className="btn secondary" href="/dashboard">← Dashboard</Link><Link className="btn" href={`/${business.slug}`}>View my KADAI</Link></div></div>

  <div className="metric-grid" style={{marginBottom:28}}><div className="metric"><span className="muted">Appointments today</span><b>{today.length}</b></div><div className="metric"><span className="muted">Next appointment</span><b style={{fontSize:20}}>{next?new Date(next.starts_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}</b></div><div className="metric"><span className="muted">Need payment check</span><b>{awaiting}</b></div><div className="metric"><span className="muted">Upcoming</span><b>{upcoming.length}</b></div></div>

  {message&&<div className="card" style={{marginBottom:18}}>{message}</div>}

  <section className="section"><h2>Needs your attention</h2><div style={{display:"grid",gap:10}}>{appointments.filter(a=>a.payment_status==="receipt_uploaded"||a.appointment_status==="pending").slice(0,6).map(a=><div className="card" key={a.id} style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}><div><b>{a.customer_name}</b><div className="muted">{new Date(a.starts_at).toLocaleString()} · {a.payment_status.replaceAll("_"," ")}</div></div><a className="btn secondary" target="_blank" rel="noreferrer" href={waHref(a.customer_phone,`Hi ${a.customer_name}, this is ${business.name} regarding your KADAI booking on ${new Date(a.starts_at).toLocaleString()}.`)}>WhatsApp customer</a></div>)}{appointments.filter(a=>a.payment_status==="receipt_uploaded"||a.appointment_status==="pending").length===0&&<div className="card"><b>All caught up.</b><p className="muted" style={{marginBottom:0}}>Nothing needs your attention right now.</p></div>}</div></section>

  <section className="section"><h2>Services</h2><div className="grid3" style={{alignItems:"start"}}><form className="card" onSubmit={addService}><h3>Add service</h3><div className="field"><label>Service name</label><input value={serviceName} onChange={e=>setServiceName(e.target.value)} placeholder="Bridal makeup" required/></div><div className="field"><label>Description</label><textarea rows={3} value={serviceDescription} onChange={e=>setServiceDescription(e.target.value)}/></div><div className="field"><label>Price (BND)</label><input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} required/></div><div className="field"><label>Duration (minutes)</label><input type="number" min="5" value={duration} onChange={e=>setDuration(e.target.value)} required/></div><div className="field"><label>Buffer after appointment</label><input type="number" min="0" value={buffer} onChange={e=>setBuffer(e.target.value)}/></div><div className="field"><label>Deposit (optional)</label><input type="number" min="0" step="0.01" value={deposit} onChange={e=>setDeposit(e.target.value)}/></div><button className="btn">Add service</button></form><div style={{gridColumn:"span 2",display:"grid",gap:10}}>{services.length===0?<div className="card">No services yet.</div>:services.map(s=><div className="card" key={s.id} style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center"}}><div><b>{s.name}</b><div className="muted">BND {Number(s.price).toFixed(2)} · {s.duration_minutes} min{s.deposit_amount!=null?` · BND ${Number(s.deposit_amount).toFixed(2)} deposit`:""} · {s.is_active?"Visible":"Hidden"}</div></div><button className="btn secondary" onClick={()=>toggleService(s)}>{s.is_active?"Hide":"Show"}</button></div>)}</div></div></section>

  <section className="section"><h2>Add booking</h2><form className="card" onSubmit={addAppointment} style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14}}><div className="field"><label>Service</label><select value={apptService} onChange={e=>setApptService(e.target.value)} required><option value="">Choose service</option>{services.filter(s=>s.is_active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="field"><label>Date & time</label><input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} required/></div><div className="field"><label>Customer name</label><input value={customerName} onChange={e=>setCustomerName(e.target.value)} required/></div><div className="field"><label>WhatsApp number</label><input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="+673 ..." required/></div><div className="field" style={{gridColumn:"1 / -1"}}><label>Notes</label><textarea rows={2} value={note} onChange={e=>setNote(e.target.value)}/></div><div style={{gridColumn:"1 / -1"}}><button className="btn">Add appointment</button></div></form></section>

  <section className="section"><h2>Upcoming appointments</h2><div style={{display:"grid",gap:10}}>{upcoming.length===0?<div className="card">No upcoming appointments.</div>:upcoming.map(a=>{const service=services.find(s=>s.id===a.service_id);return <div className="card" key={a.id} style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr auto",gap:12,alignItems:"center"}}><div><b>{a.customer_name}</b><div className="muted">{service?.name||"Service"} · {new Date(a.starts_at).toLocaleString()} · BND {Number(a.total).toFixed(2)}</div></div><select value={a.payment_status} onChange={e=>updateAppointment(a.id,"payment_status",e.target.value)}>{paymentStates.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select><select value={a.appointment_status} onChange={e=>updateAppointment(a.id,"appointment_status",e.target.value)}>{appointmentStates.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select><a className="btn secondary" target="_blank" rel="noreferrer" href={waHref(a.customer_phone,`Hi ${a.customer_name}, this is ${business.name}. Your booking is ${a.appointment_status} for ${new Date(a.starts_at).toLocaleString()}.`)}>WhatsApp</a></div>})}</div></section>
 </main>
}

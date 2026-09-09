"use client";

import { useMemo, useState } from "react";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase-public";

type Service={id:string;name:string;description:string|null;price:number;duration_minutes:number;buffer_minutes:number;deposit_amount:number|null;is_active:boolean};
type Props={slug:string;businessName:string;businessWhatsApp:string|null;services:Service[]};

function digits(value:string){return value.replace(/\D/g,"")}
function waHref(phone:string,message:string){return `https://wa.me/${digits(phone)}?text=${encodeURIComponent(message)}`}

export default function ServiceBooking({slug,businessName,businessWhatsApp,services}:Props){
  const [serviceId,setServiceId]=useState(services[0]?.id||"");
  const [startsAt,setStartsAt]=useState("");
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [note,setNote]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<any>(null);

  const selected=useMemo(()=>services.find(s=>s.id===serviceId)||null,[services,serviceId]);

  async function book(){
    setError("");
    if(!selected||!startsAt||!name.trim()||!phone.trim()){setError("Please choose a service, date and time, and enter your contact details.");return}
    setLoading(true);
    try{
      const response=await fetch(`${supabaseUrl}/functions/v1/create-appointment`,{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":supabasePublishableKey},
        body:JSON.stringify({slug,service_id:selected.id,customer_name:name.trim(),customer_phone:phone.trim(),starts_at:new Date(startsAt).toISOString(),note:note.trim()||null})
      });
      const json=await response.json();
      if(!response.ok)throw new Error(json.error||"Unable to request appointment.");
      setResult(json);
    }catch(e:any){setError(e.message||"Unable to request appointment.")}
    finally{setLoading(false)}
  }

  if(!services.length)return <div className="card"><h2>Appointments are coming soon</h2><p className="muted">This business has not added bookable services yet.</p></div>;

  if(result){
    const appointment=result.appointment;
    const service=result.service;
    const payment=result.payment||{};
    const sellerPhone=result.business?.whatsapp||businessWhatsApp;
    const when=new Date(appointment.starts_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"});
    const message=`Hi, I just requested a booking with ${businessName}.\n\nService: ${service.name}\nDate & time: ${when}\nTotal: BND ${Number(service.price).toFixed(2)}${service.deposit_amount!=null?`\nDeposit: BND ${Number(service.deposit_amount).toFixed(2)}`:""}\nName: ${appointment.customer_name}`;
    return <div className="card booking-success">
      <div className="success-mark">✓</div>
      <div className="eyebrow">BOOKING REQUESTED</div>
      <h2 style={{fontSize:34,margin:"6px 0 10px"}}>Your appointment request is in.</h2>
      <p className="muted">{service.name} · {when}</p>
      <div className="booking-summary">
        <div><span>Total</span><b>BND {Number(service.price).toFixed(2)}</b></div>
        {service.deposit_amount!=null&&<div><span>Deposit</span><b>BND {Number(service.deposit_amount).toFixed(2)}</b></div>}
        <div><span>Status</span><b>Pending confirmation</b></div>
      </div>
      {service.deposit_amount!=null&&payment.bank_name&&payment.account_number&&<div className="card" style={{textAlign:"left",marginTop:16}}><div className="eyebrow">DEPOSIT PAYMENT</div><p><b>{payment.bank_name}</b><br/>{payment.account_name}<br/><span style={{fontSize:22,fontWeight:800}}>{payment.account_number}</span></p><p className="muted">Deposit due: <b>BND {Number(service.deposit_amount).toFixed(2)}</b>. Continue on WhatsApp to send your payment receipt to the seller.</p></div>}
      {sellerPhone&&<a className="btn" style={{display:"inline-block",marginTop:18}} href={waHref(sellerPhone,message)} target="_blank" rel="noreferrer">Continue on WhatsApp</a>}
      <button className="btn secondary" style={{marginTop:10,marginLeft:8}} onClick={()=>{setResult(null);setStartsAt("");setNote("")}}>Book another</button>
    </div>
  }

  return <section className="service-booking">
    <div className="service-grid">
      {services.map(service=><button type="button" key={service.id} className={`service-card ${service.id===serviceId?"selected":""}`} onClick={()=>setServiceId(service.id)}>
        <div><span className="eyebrow">SERVICE</span><h3>{service.name}</h3><p>{service.description||"Book this service directly."}</p></div>
        <div className="service-meta"><b>BND {service.price.toFixed(2)}</b><span>{service.duration_minutes} min</span>{service.deposit_amount!=null&&<span>BND {service.deposit_amount.toFixed(2)} deposit</span>}</div>
      </button>)}
    </div>
    <div className="card booking-form">
      <div className="eyebrow">BOOK APPOINTMENT</div>
      <h2>{selected?.name||"Choose a service"}</h2>
      {selected&&<p className="muted">BND {selected.price.toFixed(2)} · {selected.duration_minutes} minutes{selected.deposit_amount!=null?` · BND ${selected.deposit_amount.toFixed(2)} deposit`:""}</p>}
      <div className="field"><label>Date & time</label><input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} min={new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}/></div>
      <div className="field"><label>Your name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div>
      <div className="field"><label>WhatsApp number</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+673 ..."/></div>
      <div className="field"><label>Notes</label><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Anything the seller should know?"/></div>
      {error&&<p style={{color:"crimson",fontSize:14}}>{error}</p>}
      <button className="btn" disabled={loading||!selected} onClick={book}>{loading?"Sending request…":"Request appointment"}</button>
      <p className="muted" style={{fontSize:13,marginBottom:0}}>The seller will confirm your appointment. No customer account is required.</p>
    </div>
  </section>
}

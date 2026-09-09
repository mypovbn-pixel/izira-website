"use client";

import { useMemo, useState } from "react";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase-public";
import { appointmentWhatsApp, transportWhatsApp, whatsAppHref } from "@/lib/whatsappTemplates";
import styles from "./ServiceBooking.module.css";

type Service={
  id:string;
  name:string;
  description:string|null;
  price:number;
  duration_minutes:number;
  buffer_minutes:number;
  deposit_amount:number|null;
  is_active:boolean;
  service_kind:"appointment"|"runner"|"transport";
  pricing_mode:"fixed"|"quote";
  max_passengers:number|null;
};
type Props={slug:string;businessName:string;businessWhatsApp:string|null;services:Service[]};
const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function ServiceBooking({slug,businessName,businessWhatsApp,services}:Props){
  const [serviceId,setServiceId]=useState(services[0]?.id||"");
  const [startsAt,setStartsAt]=useState("");
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [note,setNote]=useState("");
  const [pickup,setPickup]=useState("");
  const [destination,setDestination]=useState("");
  const [passengers,setPassengers]=useState("1");
  const [passengerName,setPassengerName]=useState("");
  const [itemDescription,setItemDescription]=useState("");
  const [tripDirection,setTripDirection]=useState<"one_way"|"return">("one_way");
  const [returnAt,setReturnAt]=useState("");
  const [recurrenceType,setRecurrenceType]=useState<"one_off"|"recurring">("one_off");
  const [recurringUntil,setRecurringUntil]=useState("");
  const [recurrenceWeekdays,setRecurrenceWeekdays]=useState<number[]>([]);
  const [whatsappOptIn,setWhatsappOptIn]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<any>(null);
  const selected=useMemo(()=>services.find(s=>s.id===serviceId)||null,[services,serviceId]);
  const isTransport=selected?.service_kind==="transport";
  const isRunner=selected?.service_kind==="runner";
  const isRouteService=isTransport||isRunner;

  function chooseService(id:string){
    setServiceId(id);setError("");setResult(null);
    setPickup("");setDestination("");setPassengers("1");setPassengerName("");setItemDescription("");setTripDirection("one_way");setReturnAt("");setRecurrenceType("one_off");setRecurringUntil("");setRecurrenceWeekdays([]);setWhatsappOptIn(false);
  }
  function toggleWeekday(day:number){setRecurrenceWeekdays(v=>v.includes(day)?v.filter(x=>x!==day):[...v,day].sort())}

  async function book(){
    setError("");
    if(!selected||!startsAt||!name.trim()||!phone.trim()){setError("Please choose a service, date and time, and enter your contact details.");return}
    if(isRouteService&&(!pickup.trim()||!destination.trim())){setError("Please enter the pickup and destination.");return}
    if(isRunner&&!itemDescription.trim()){setError("Tell the runner what needs to be collected or delivered.");return}
    if(recurrenceType==="recurring"&&(!recurringUntil||!recurrenceWeekdays.length)){setError("Choose recurring days and an end date.");return}
    setLoading(true);
    try{
      const response=await fetch(`${supabaseUrl}/functions/v1/create-appointment`,{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":supabasePublishableKey},
        body:JSON.stringify({
          slug,service_id:selected.id,customer_name:name.trim(),customer_phone:phone.trim(),starts_at:new Date(startsAt).toISOString(),note:note.trim()||null,
          pickup_location:isRouteService?pickup.trim():null,
          destination:isRouteService?destination.trim():null,
          passenger_count:isTransport?Number(passengers||1):null,
          passenger_name:isTransport?passengerName.trim()||null:null,
          item_description:isRunner?itemDescription.trim():null,
          trip_direction:isRouteService?tripDirection:null,
          return_at:isRouteService&&tripDirection==="return"&&returnAt?new Date(returnAt).toISOString():null,
          recurrence_type:isRouteService?recurrenceType:"one_off",
          recurring_until:isRouteService&&recurrenceType==="recurring"?recurringUntil:null,
          recurrence_weekdays:isRouteService&&recurrenceType==="recurring"?recurrenceWeekdays:[],
          whatsapp_updates_opt_in:whatsappOptIn
        })
      });
      const json=await response.json();
      if(!response.ok)throw new Error(json.error||"Unable to send this booking request.");
      setResult(json);
    }catch(e:any){setError(e.message||"Unable to send this booking request.")}
    finally{setLoading(false)}
  }

  if(!services.length)return <div className="card"><h2>Bookings are coming soon</h2><p className="muted">This business has not added bookable services yet.</p></div>;

  if(result){
    const appointment=result.appointment;
    const service=result.service;
    const sellerPhone=result.business?.whatsapp||businessWhatsApp;
    const when=new Date(appointment.starts_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"});
    const count=Number(result.occurrence_count||1);
    const route=service.service_kind==="runner"||service.service_kind==="transport";
    const transportInput={businessName,customerName:appointment.customer_name,serviceName:service.name,startsAt:appointment.starts_at,pickup:appointment.pickup_location||pickup,destination:appointment.destination||destination,total:service.pricing_mode==="fixed"?Number(service.price):undefined,occurrences:count,kind:service.service_kind as "runner"|"transport"};
    const waMessage=route?transportWhatsApp.requested(transportInput):appointmentWhatsApp.requested({businessName,customerName:appointment.customer_name,serviceName:service.name,startsAt:appointment.starts_at,total:Number(service.price),deposit:service.deposit_amount});
    return <div className={`card ${styles.success}`}>
      <div className={styles.mark}>✓</div>
      <div className="eyebrow">{route?"REQUEST RECEIVED":"BOOKING REQUESTED"}</div>
      <h2 style={{fontSize:34,margin:"6px 0 10px"}}>{route?"Your trip request is in.":"Your appointment request is in."}</h2>
      <p className="muted">{service.name} · {when}{count>1?` · ${count} scheduled trips`:""}</p>
      <div className={styles.summary}>
        <div><span>{service.pricing_mode==="quote"?"Fare":"Total"}</span><b>{service.pricing_mode==="quote"?"Awaiting quote":`BND ${Number(service.price).toFixed(2)}`}</b></div>
        {service.deposit_amount!=null&&<div><span>Deposit</span><b>BND {Number(service.deposit_amount).toFixed(2)}</b></div>}
        <div><span>Status</span><b>Pending confirmation</b></div>
      </div>
      {route&&<div className="card" style={{textAlign:"left",marginTop:16}}><div className="eyebrow">ROUTE</div>{appointment.passenger_name&&<p style={{marginBottom:4}}><b>Passenger:</b> {appointment.passenger_name}</p>}<p style={{marginBottom:4}}><b>Pickup:</b> {appointment.pickup_location}</p><p style={{marginTop:0}}><b>Destination:</b> {appointment.destination}</p>{count>1&&<p className="muted">This recurring request created {count} scheduled trips. The seller will confirm the schedule with you.</p>}{result.whatsapp_updates_opt_in&&<p className="muted" style={{marginBottom:0}}>WhatsApp trip updates are enabled for this booking.</p>}</div>}
      {!route&&service.deposit_amount!=null&&result.payment?.bank_name&&result.payment?.account_number&&<div className="card" style={{textAlign:"left",marginTop:16}}><div className="eyebrow">DEPOSIT PAYMENT</div><p><b>{result.payment.bank_name}</b><br/>{result.payment.account_name}<br/><span style={{fontSize:22,fontWeight:800}}>{result.payment.account_number}</span></p><p className="muted">Deposit due: <b>BND {Number(service.deposit_amount).toFixed(2)}</b>. Continue on WhatsApp to send your payment receipt to the seller.</p></div>}
      {sellerPhone&&<a className="btn" style={{display:"inline-block",marginTop:18}} href={whatsAppHref(sellerPhone,waMessage)} target="_blank" rel="noreferrer">Continue on WhatsApp</a>}
      <button className="btn secondary" style={{marginTop:10,marginLeft:8}} onClick={()=>{setResult(null);setStartsAt("");setNote("");setWhatsappOptIn(false)}}>Book another</button>
    </div>
  }

  return <section className={styles.layout}>
    <div className={styles.services}>
      {services.map(service=><button type="button" key={service.id} className={`${styles.service} ${service.id===serviceId?styles.selected:""}`} onClick={()=>chooseService(service.id)}>
        <div><span className="eyebrow">{service.service_kind==="runner"?"RUNNER":service.service_kind==="transport"?"TRANSPORT":"SERVICE"}</span><h3>{service.name}</h3><p>{service.description||"Book this service directly."}</p></div>
        <div className={styles.meta}><b>{service.pricing_mode==="quote"?"Request quote":`BND ${service.price.toFixed(2)}`}</b><span>{service.duration_minutes} min</span>{service.max_passengers!=null&&<span>Up to {service.max_passengers} passengers</span>}{service.deposit_amount!=null&&<span>BND {service.deposit_amount.toFixed(2)} deposit</span>}</div>
      </button>)}
    </div>

    <div className={`card ${styles.form}`}>
      <div className="eyebrow">{isRunner?"RUNNER REQUEST":isTransport?"BOOK A TRIP":"BOOK APPOINTMENT"}</div>
      <h2>{selected?.name||"Choose a service"}</h2>
      {selected&&<p className="muted">{selected.pricing_mode==="quote"?"Fare by quote":`BND ${selected.price.toFixed(2)}`} · {selected.duration_minutes} minutes{selected.deposit_amount!=null?` · BND ${selected.deposit_amount.toFixed(2)} deposit`:""}</p>}

      {isRouteService&&<>
        <div className="field"><label>Pickup location</label><input value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="e.g. Rimba, home address or landmark"/></div>
        <div className="field"><label>Destination</label><input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="e.g. school, office, airport"/></div>
        {isTransport&&<><div className="field"><label>Passengers</label><input type="number" min="1" max={selected?.max_passengers||undefined} value={passengers} onChange={e=>setPassengers(e.target.value)}/></div><div className="field"><label>Passenger / child name (optional)</label><input value={passengerName} onChange={e=>setPassengerName(e.target.value)} placeholder="Useful for school-run updates"/></div></>}
        {isRunner&&<div className="field"><label>What needs to be collected / delivered?</label><textarea rows={3} value={itemDescription} onChange={e=>setItemDescription(e.target.value)} placeholder="Document, parcel, food pickup, errand details…"/></div>}
      </>}

      <div className="field"><label>{isRouteService?"First pickup date & time":"Date & time"}</label><input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} min={new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}/></div>

      {isRouteService&&<>
        <div className="field"><label>Trip</label><select value={tripDirection} onChange={e=>setTripDirection(e.target.value as "one_way"|"return")}><option value="one_way">One way</option><option value="return">Return trip</option></select></div>
        {tripDirection==="return"&&<div className="field"><label>Return pickup time (optional)</label><input type="datetime-local" value={returnAt} onChange={e=>setReturnAt(e.target.value)}/></div>}
        <div className="field"><label>How often?</label><select value={recurrenceType} onChange={e=>setRecurrenceType(e.target.value as "one_off"|"recurring")}><option value="one_off">One-off</option><option value="recurring">Recurring / school run</option></select></div>
        {recurrenceType==="recurring"&&<div className="card" style={{padding:14,marginBottom:12}}><b>Recurring days</b><div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"10px 0"}}>{weekdays.map((day,i)=><button type="button" key={day} className={recurrenceWeekdays.includes(i)?"btn":"btn secondary"} style={{padding:"7px 10px"}} onClick={()=>toggleWeekday(i)}>{day}</button>)}</div><div className="field"><label>Continue until</label><input type="date" value={recurringUntil} onChange={e=>setRecurringUntil(e.target.value)}/></div><p className="muted" style={{fontSize:12,marginBottom:0}}>Useful for monthly school transport, staff pickup and recurring runner jobs. KADAI checks every generated date for conflicts.</p></div>}
      </>}

      {!isRouteService&&<p className="muted" style={{fontSize:12,marginTop:-4}}>KADAI checks the seller’s appointment hours, blocked times and existing bookings before accepting your request.</p>}
      <div className="field"><label>Your name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div>
      <div className="field"><label>WhatsApp number</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+673 ..."/></div>
      <label style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:13,lineHeight:1.45,margin:"4px 0 14px"}}><input type="checkbox" checked={whatsappOptIn} onChange={e=>setWhatsappOptIn(e.target.checked)} style={{marginTop:3}}/><span>{isTransport?"Send me WhatsApp trip updates such as pickup and drop-off confirmations.":isRunner?"Send me WhatsApp runner updates such as collected and delivered.":"Send me WhatsApp updates about this booking."} <span className="muted">You can opt out later.</span></span></label>
      <div className="field"><label>Notes</label><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder={isRouteService?"Gate instructions, luggage, special timing…":"Anything the seller should know?"}/></div>
      {error&&<p style={{color:"crimson",fontSize:14}}>{error}</p>}
      <button className="btn" disabled={loading||!selected} onClick={book}>{loading?"Checking availability…":isRunner?"Request runner":isTransport?"Request trip":"Request appointment"}</button>
      <p className="muted" style={{fontSize:13,marginBottom:0}}>The seller will confirm the request. No customer account is required.</p>
    </div>
  </section>
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Job={id:string;customer_name:string;starts_at:string;booking_kind:"runner"|"transport";pickup_location:string|null;destination:string|null;passenger_name:string|null;journey_status:string|null;appointment_status:string};

export default function TransportNotifier(){
 const supabase=createClient();
 const [jobs,setJobs]=useState<Job[]>([]);
 const [connected,setConnected]=useState(false);
 const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState<string|null>(null);

 async function load(){
  setLoading(true);
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setLoading(false);return}
  const {data:b}=await supabase.from('businesses').select('id').eq('owner_id',user.id).order('created_at').limit(1).maybeSingle();
  if(!b){setLoading(false);return}
  const [{data:j},{data:c}]=await Promise.all([
   supabase.from('appointments').select('id,customer_name,starts_at,booking_kind,pickup_location,destination,passenger_name,journey_status,appointment_status').eq('business_id',b.id).in('booking_kind',['runner','transport']).neq('appointment_status','cancelled').gte('starts_at',new Date(Date.now()-6*60*60*1000).toISOString()).order('starts_at',{ascending:true}).limit(20),
   supabase.from('whatsapp_connections').select('status').eq('business_id',b.id).maybeSingle()
  ]);
  setJobs((j||[]) as Job[]);setConnected(c?.status==='connected');setLoading(false);
 }
 useEffect(()=>{load()},[]);
 const active=useMemo(()=>jobs.filter(j=>j.journey_status!=='dropped_off'&&j.appointment_status!=='completed').slice(0,8),[jobs]);

 async function send(job:Job){
  const picked=job.journey_status==='picked_up';
  const eventKey=job.booking_kind==='transport'?(picked?'transport_dropped_off':'transport_picked_up'):(picked?'runner_delivered':'runner_collected');
  setBusy(job.id);setNotice('');
  const {data,error}=await supabase.functions.invoke('send-whatsapp-event',{body:{appointment_id:job.id,event_key:eventKey,manual:true}});
  setBusy(null);
  if(error){setNotice(error.message);return}
  const result=data as any;
  if(result?.whatsapp_sent)setNotice(picked?(job.booking_kind==='transport'?'Drop-off saved and WhatsApp sent.':'Delivery saved and WhatsApp sent.'):(job.booking_kind==='transport'?'Pickup saved and WhatsApp sent.':'Collection saved and WhatsApp sent.'));
  else if(result?.status_updated){
   const reasons:Record<string,string>={whatsapp_not_connected:'WhatsApp Business is not connected yet.',no_transactional_opt_in:'Customer did not opt in to transactional WhatsApp updates.',automation_disabled:'This automation is disabled.',meta_send_failed:'Meta could not send the message.'};
   setNotice(`Status saved. ${reasons[result?.reason]||'WhatsApp was not sent.'}`);
  } else setNotice(result?.error||'Unable to update this trip.');
  await load();
 }

 if(loading||!active.length)return null;
 return <div className="shell" style={{paddingTop:24,paddingBottom:0}}>
  <section className="card" style={{border:'1px solid #dfc8bc'}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><div><div className="eyebrow">QUICK TRIP UPDATES</div><h2 style={{margin:'4px 0'}}>Pickup & drop-off</h2><p className="muted" style={{margin:0}}>One tap updates the trip status and, when connected + opted in, sends the parent/customer an official WhatsApp update.</p></div><Link className="btn secondary" href="/dashboard/whatsapp">{connected?'WhatsApp connected':'Set up WhatsApp'}</Link></div>
   {notice&&<div style={{marginTop:14,padding:10,borderRadius:12,background:'#f5ebe5'}}>{notice}</div>}
   <div style={{display:'grid',gap:9,marginTop:16}}>{active.map(job=>{const picked=job.journey_status==='picked_up';const label=job.booking_kind==='transport'?(picked?'Dropped off + notify':'Picked up + notify'):(picked?'Delivered + notify':'Collected + notify');return <div key={job.id} style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',padding:'12px 0',borderTop:'1px solid #eee1d8',flexWrap:'wrap'}}><div><b>{job.passenger_name||job.customer_name}</b><div className="muted">{job.booking_kind==='transport'?'Transport':'Runner'} · {new Date(job.starts_at).toLocaleString()} · {job.pickup_location||'Pickup'} → {job.destination||'Destination'}</div></div><button className="btn" onClick={()=>send(job)} disabled={busy===job.id}>{busy===job.id?'Sending…':label}</button></div>})}</div>
  </section>
 </div>
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { supabaseUrl } from "@/lib/supabase-public";

type Business={id:string;name:string;plan:string};
type Connection={id:string;status:string;waba_id:string|null;phone_number_id:string|null;display_phone_number:string|null;connected_at:string|null;last_error:string|null};
type Automation={id:string;event_key:string;enabled:boolean;template_name:string|null;language_code:string};
type Message={id:string;event_key:string|null;recipient:string;status:string;template_name:string|null;created_at:string;error_message:string|null};

const eventLabels:Record<string,string>={
 order_confirmed:"Order confirmed",
 order_ready:"Order ready",
 appointment_confirmed:"Appointment confirmed",
 appointment_reminder:"Appointment reminder",
 transport_picked_up:"Transport picked up",
 transport_dropped_off:"Transport dropped off",
 runner_collected:"Runner collected",
 runner_delivered:"Runner delivered",
};
const events=Object.keys(eventLabels);

export default function WhatsAppSettings(){
 const router=useRouter();
 const supabase=createClient();
 const [business,setBusiness]=useState<Business|null>(null);
 const [connection,setConnection]=useState<Connection|null>(null);
 const [automations,setAutomations]=useState<Automation[]>([]);
 const [messages,setMessages]=useState<Message[]>([]);
 const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState("");
 const [wabaId,setWabaId]=useState("");
 const [phoneNumberId,setPhoneNumberId]=useState("");
 const [accessToken,setAccessToken]=useState("");
 const pro=business?['pro','business'].includes(business.plan):false;

 async function load(){
  setLoading(true);
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace('/login');return}
  const {data:b}=await supabase.from('businesses').select('id,name,plan').eq('owner_id',user.id).order('created_at').limit(1).maybeSingle();
  if(!b){router.replace('/onboarding');return}
  const biz=b as Business;setBusiness(biz);
  const [{data:c},{data:a},{data:m}]=await Promise.all([
   supabase.from('whatsapp_connections').select('id,status,waba_id,phone_number_id,display_phone_number,connected_at,last_error').eq('business_id',biz.id).maybeSingle(),
   supabase.from('whatsapp_automations').select('id,event_key,enabled,template_name,language_code').eq('business_id',biz.id).order('event_key'),
   supabase.from('whatsapp_messages').select('id,event_key,recipient,status,template_name,created_at,error_message').eq('business_id',biz.id).order('created_at',{ascending:false}).limit(12)
  ]);
  setConnection(c as Connection|null);setAutomations((a||[]) as Automation[]);setMessages((m||[]) as Message[]);
  if(c){setWabaId(c.waba_id||'');setPhoneNumberId(c.phone_number_id||'')}
  setLoading(false);
 }
 useEffect(()=>{load()},[]);

 const automationMap=useMemo(()=>new Map(automations.map(a=>[a.event_key,a])),[automations]);

 async function connect(e:FormEvent){
  e.preventDefault();setNotice('');
  if(!pro){setNotice('Official WhatsApp automation is included with KADAI Pro.');return}
  if(!wabaId.trim()||!phoneNumberId.trim()||!accessToken.trim()){setNotice('Enter your Meta WhatsApp Business Account ID, phone number ID and access token.');return}
  const {data,error}=await supabase.functions.invoke('connect-whatsapp',{body:{waba_id:wabaId.trim(),phone_number_id:phoneNumberId.trim(),access_token:accessToken.trim()}});
  if(error){setNotice(error.message);return}
  if((data as any)?.error){setNotice((data as any).error);return}
  setAccessToken('');setNotice(`Connected${(data as any)?.display_phone_number?` · ${(data as any).display_phone_number}`:''}.`);await load();
 }

 async function saveAutomation(eventKey:string,changes:Partial<Automation>){
  if(!business)return;
  const current=automationMap.get(eventKey);
  const row={business_id:business.id,event_key:eventKey,enabled:changes.enabled??current?.enabled??false,template_name:changes.template_name??current?.template_name??'kadai_transaction_update',language_code:changes.language_code??current?.language_code??'en'};
  const {error}=await supabase.from('whatsapp_automations').upsert(row,{onConflict:'business_id,event_key'});
  setNotice(error?error.message:'WhatsApp automation saved.');if(!error)await load();
 }

 if(loading)return <main className="shell"><div className="card" style={{marginTop:60}}>Opening WhatsApp settings…</div></main>;
 if(!business)return null;

 return <main className="shell" style={{paddingTop:30,paddingBottom:80}}>
  <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',flexWrap:'wrap',marginBottom:24}}>
   <div><div className="eyebrow">KADAI · {business.name}</div><h1 style={{margin:'4px 0'}}>WhatsApp Business</h1><p className="muted" style={{margin:0}}>Connect Meta WhatsApp Business Platform for official transactional updates.</p></div>
   <Link className="btn secondary" href="/dashboard">← Dashboard</Link>
  </div>

  {notice&&<div className="card" style={{marginBottom:18,display:'flex',justifyContent:'space-between',gap:12}}>{notice}<button onClick={()=>setNotice('')} style={{border:0,background:'transparent'}}>×</button></div>}

  {!pro&&<div className="card" style={{marginBottom:22}}><div className="eyebrow">PRO FEATURE</div><h2>Official WhatsApp automation</h2><p className="muted">Free and Starter keep manual WhatsApp buttons and prefilled messages. Meta Cloud API automation — including automatic school-run pickup/drop-off updates — is reserved for Pro.</p><Link className="btn" href="/dashboard/plan">View Pro</Link></div>}

  <section className="section" style={{paddingTop:8}}>
   <div className="grid3" style={{alignItems:'start'}}>
    <form className="card" onSubmit={connect}>
     <div className="eyebrow">CONNECTION</div><h2 style={{fontSize:28}}>Meta Cloud API</h2>
     <div className="field"><label>WhatsApp Business Account ID</label><input value={wabaId} onChange={e=>setWabaId(e.target.value)} placeholder="WABA ID" disabled={!pro}/></div>
     <div className="field"><label>Phone number ID</label><input value={phoneNumberId} onChange={e=>setPhoneNumberId(e.target.value)} placeholder="Phone number ID" disabled={!pro}/></div>
     <div className="field"><label>Access token</label><input type="password" value={accessToken} onChange={e=>setAccessToken(e.target.value)} placeholder={connection?'Enter a new token to reconnect':'Meta access token'} disabled={!pro}/></div>
     <button className="btn" disabled={!pro}>{connection?.status==='connected'?'Reconnect WhatsApp':'Connect WhatsApp'}</button>
     <p className="muted" style={{fontSize:12}}>The access token is sent directly to the secure Supabase Edge Function and stored in Supabase Vault. KADAI does not display it again.</p>
    </form>

    <div className="card" style={{gridColumn:'span 2'}}>
     <div className="eyebrow">STATUS</div><h2 style={{fontSize:28}}>{connection?.status==='connected'?'Connected':'Not connected'}</h2>
     {connection?.display_phone_number&&<p><b>{connection.display_phone_number}</b></p>}
     {connection?.connected_at&&<p className="muted">Connected {new Date(connection.connected_at).toLocaleString()}</p>}
     {connection?.last_error&&<p style={{color:'crimson'}}>{connection.last_error}</p>}
     <hr style={{border:0,borderTop:'1px solid #eadfd6',margin:'22px 0'}}/>
     <div className="eyebrow">META WEBHOOK</div><p className="muted">Use this callback URL in your Meta app after the webhook verification secret and Meta App Secret are configured in Supabase:</p>
     <code style={{display:'block',padding:12,borderRadius:12,background:'#f6eee8',overflowWrap:'anywhere'}}>{supabaseUrl}/functions/v1/whatsapp-webhook</code>
    </div>
   </div>
  </section>

  <section className="section">
   <div className="eyebrow">UTILITY TEMPLATE</div><h2>One approved template, many KADAI updates</h2>
   <div className="card"><p style={{marginTop:0}}>Recommended Meta utility template name: <b>kadai_transaction_update</b></p><p className="muted">Suggested body:</p><blockquote style={{margin:'14px 0',padding:'14px 18px',borderLeft:'3px solid #A6533D',background:'#fbf6f2'}}>Hi {'{{1}}'}, update from {'{{2}}'}: {'{{3}}'} {'{{4}}'}</blockquote><p className="muted" style={{marginBottom:0}}>KADAI supplies customer name, business name, the status update, and the trip/order/appointment details. The template still needs approval in the merchant’s Meta WhatsApp Manager before automated delivery can work.</p></div>
  </section>

  <section className="section">
   <div className="eyebrow">AUTOMATIONS</div><h2>Choose what KADAI sends</h2>
   <div style={{display:'grid',gap:10}}>{events.map(key=>{const a=automationMap.get(key);return <div className="card" key={key} style={{display:'grid',gridTemplateColumns:'1.3fr .9fr .45fr',gap:12,alignItems:'center'}}><div><b>{eventLabels[key]}</b><div className="muted">{key==='transport_dropped_off'?'Especially useful for school runs — parents get reassurance as soon as drop-off is marked.':'Transactional WhatsApp update'}</div></div><input value={a?.template_name||'kadai_transaction_update'} onChange={e=>saveAutomation(key,{template_name:e.target.value})} disabled={!pro}/><label style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}><input type="checkbox" checked={a?.enabled||false} onChange={e=>saveAutomation(key,{enabled:e.target.checked})} disabled={!pro}/> Auto</label></div>})}</div>
  </section>

  <section className="section"><div className="eyebrow">DELIVERY LOG</div><h2>Recent WhatsApp messages</h2><div style={{display:'grid',gap:8}}>{messages.length===0?<div className="card">No automated WhatsApp messages yet.</div>:messages.map(m=><div className="card" key={m.id} style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><div><b>{m.event_key?eventLabels[m.event_key]||m.event_key:'WhatsApp message'}</b><div className="muted">{m.recipient} · {new Date(m.created_at).toLocaleString()}</div></div><div><b>{m.status}</b>{m.error_message&&<div style={{color:'crimson',fontSize:12}}>{m.error_message}</div>}</div></div>)}</div></section>
 </main>
}

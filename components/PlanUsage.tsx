"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plan = "free"|"starter"|"pro"|"business";
type Business={id:string;name:string;slug:string;plan:Plan;custom_domain:string|null;hide_izira_branding:boolean};

const planMeta:Record<Plan,{label:string;price:string;limit:number|null;features:string[]}>= {
 free:{label:"Free",price:"BND 0",limit:30,features:["30 orders/month","Unlimited products","Basic storefront","Pickup + delivery","Receipt upload","IZIRA branding"]},
 starter:{label:"Starter",price:"BND 8/month",limit:150,features:["150 orders/month","Preorder campaigns","Availability & capacity slots","Variants/add-ons (next)","Customer list","Sales dashboard"]},
 pro:{label:"Pro",price:"BND 18/month",limit:null,features:["Unlimited orders","Custom domain entitlement","Remove IZIRA branding","Advanced preorder controls","Exports & deeper analytics (next)","Up to 3 staff later"]},
 business:{label:"Business",price:"Not launched",limit:null,features:["Multiple stores","More staff","Advanced automation","Priority support"]}
};

function bruneiMonthBounds(){
 const now=new Date();
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Brunei",year:"numeric",month:"2-digit"}).formatToParts(now);
 const year=Number(parts.find(p=>p.type==="year")?.value);
 const month=Number(parts.find(p=>p.type==="month")?.value);
 const nextMonth=month===12?1:month+1;
 const nextYear=month===12?year+1:year;
 return {
  start:new Date(`${year}-${String(month).padStart(2,"0")}-01T00:00:00+08:00`).toISOString(),
  end:new Date(`${nextYear}-${String(nextMonth).padStart(2,"0")}-01T00:00:00+08:00`).toISOString()
 };
}

export default function PlanUsage(){
 const router=useRouter();
 const supabase=createClient();
 const [business,setBusiness]=useState<Business|null>(null);
 const [orders,setOrders]=useState(0);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{(async()=>{
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}
  const {data:b}=await supabase.from("businesses").select("id,name,slug,plan,custom_domain,hide_izira_branding").eq("owner_id",user.id).order("created_at").limit(1).maybeSingle();
  if(!b){router.replace("/onboarding");return;}
  const biz=b as Business; setBusiness(biz);
  const {start,end}=bruneiMonthBounds();
  const {count}=await supabase.from("orders").select("id",{count:"exact",head:true}).eq("business_id",biz.id).gte("created_at",start).lt("created_at",end).neq("order_status","cancelled");
  setOrders(count||0);setLoading(false);
 })()},[]);

 const meta=business?planMeta[business.plan]:null;
 const percent=useMemo(()=>meta?.limit?Math.min(100,(orders/meta.limit)*100):0,[orders,meta]);
 if(loading)return <main className="shell"><div className="card" style={{marginTop:60}}>Loading plan usage…</div></main>;
 if(!business||!meta)return null;

 return <main className="shell" style={{paddingTop:34,paddingBottom:70}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"center",flexWrap:"wrap"}}>
   <div><div className="eyebrow">{business.name}</div><h1 style={{fontSize:46,margin:"6px 0 10px"}}>Plan & usage</h1><p className="muted">Your limits reset each Brunei calendar month.</p></div>
   <Link href="/dashboard" className="btn secondary">← Dashboard</Link>
  </div>

  <section className="section" style={{paddingTop:30}}>
   <div className="card" style={{padding:28}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"start",flexWrap:"wrap"}}>
     <div><div className="eyebrow">CURRENT PLAN</div><h2 style={{margin:"6px 0"}}>{meta.label}</h2><div className="muted">{meta.price}</div></div>
     <div style={{textAlign:"right"}}><b style={{fontSize:34}}>{orders}{meta.limit?` / ${meta.limit}`:""}</b><div className="muted">orders this month</div></div>
    </div>
    {meta.limit&&<><div style={{height:12,background:"#eee3da",borderRadius:999,overflow:"hidden",marginTop:22}}><div style={{height:"100%",width:`${percent}%`,background:"#a8512d"}}/></div><p className="muted">{Math.max(0,meta.limit-orders)} orders remaining this month.</p></>}
    {!meta.limit&&<p className="muted" style={{marginTop:20}}>Unlimited monthly orders on this plan.</p>}
   </div>
  </section>

  <section className="section" style={{paddingTop:10}}>
   <h2>Plans</h2><div className="grid3">
    {(["free","starter","pro"] as Plan[]).map(plan=>{const p=planMeta[plan];const current=business.plan===plan;return <div className="card" key={plan} style={{display:"flex",flexDirection:"column",gap:14}}><div><div className="eyebrow">{current?"CURRENT":"PLAN"}</div><h2 style={{fontSize:30,margin:"6px 0"}}>{p.label}</h2><b>{p.price}</b></div><div style={{display:"grid",gap:8,flex:1}}>{p.features.map(f=><div key={f}>✓ {f}</div>)}</div>{current?<span className="btn secondary" style={{textAlign:"center",cursor:"default"}}>Current plan</span>:<a className="btn" style={{textAlign:"center"}} href={`mailto:hello@izira.xyz?subject=${encodeURIComponent(`IZIRA ${p.label} upgrade request`)}&body=${encodeURIComponent(`Business: ${business.name}\nStore: izira.xyz/${business.slug}\nCurrent plan: ${meta.label}\nRequested plan: ${p.label}`)}`}>Request upgrade</a>}</div>})}
   </div>
  </section>

  <section className="section" style={{paddingTop:10}}>
   <h2>Entitlements</h2><div className="grid3">
    <div className="card"><b>Preorders & capacity</b><p className="muted">{business.plan==="free"?"Locked on Free. Available on Starter and Pro.":"Enabled for your plan."}</p></div>
    <div className="card"><b>Custom domain</b><p className="muted">{["pro","business"].includes(business.plan)?business.custom_domain||"Entitled. Domain connection workflow will be enabled at hosting stage.":"Pro feature."}</p></div>
    <div className="card"><b>Remove IZIRA branding</b><p className="muted">{["pro","business"].includes(business.plan)?business.hide_izira_branding?"Branding hidden.":"Available on your plan.":"Pro feature."}</p></div>
   </div>
  </section>
 </main>
}

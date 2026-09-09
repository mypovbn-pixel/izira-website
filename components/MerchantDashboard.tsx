"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Business={id:string;name:string;slug:string;plan:string;business_mode?:"products"|"appointments"|"both";description:string|null;whatsapp:string|null;bank_name:string|null;account_name:string|null;account_number:string|null;pickup_address:string|null;pickup_enabled:boolean;delivery_enabled:boolean};
type Product={id:string;name:string;description:string|null;price:number|string;stock_limit:number|null;is_active:boolean};
type Order={id:string;order_number:number;customer_name:string;customer_phone:string;total:number|string;fulfilment:string;payment_status:string;order_status:string;created_at:string;collection_at?:string|null};
type Campaign={id:string;name:string;opens_at:string|null;closes_at:string|null;collection_start:string|null;collection_end:string|null;order_limit:number|null;is_active:boolean};
type Slot={id:string;slot_date:string;label:string;fulfilment:string;capacity:number;is_active:boolean};

const paymentStates=["awaiting_payment","receipt_uploaded","paid","rejected"];
const orderStates=["new","confirmed","preparing","ready","completed","cancelled"];
const clay="#b96545";

function pretty(value:string){return value.replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase())}
function wa(phone:string,message:string){const p=phone.replace(/\D/g,"");return `https://wa.me/${p}?text=${encodeURIComponent(message)}`}

export default function MerchantDashboard(){
 const router=useRouter(); const supabase=createClient();
 const [business,setBusiness]=useState<Business|null>(null); const [products,setProducts]=useState<Product[]>([]); const [orders,setOrders]=useState<Order[]>([]); const [campaigns,setCampaigns]=useState<Campaign[]>([]); const [slots,setSlots]=useState<Slot[]>([]); const [loading,setLoading]=useState(true); const [message,setMessage]=useState("");
 const [name,setName]=useState(""); const [description,setDescription]=useState(""); const [price,setPrice]=useState(""); const [stock,setStock]=useState("");
 const [campaignName,setCampaignName]=useState(""); const [campaignClose,setCampaignClose]=useState(""); const [collectionStart,setCollectionStart]=useState(""); const [collectionEnd,setCollectionEnd]=useState(""); const [campaignLimit,setCampaignLimit]=useState("");
 const [slotDate,setSlotDate]=useState(""); const [slotLabel,setSlotLabel]=useState(""); const [slotMethod,setSlotMethod]=useState("pickup"); const [slotCapacity,setSlotCapacity]=useState("");
 const [bankName,setBankName]=useState(""); const [accountName,setAccountName]=useState(""); const [accountNumber,setAccountNumber]=useState(""); const [pickupAddress,setPickupAddress]=useState(""); const [pickupEnabled,setPickupEnabled]=useState(true); const [deliveryEnabled,setDeliveryEnabled]=useState(true);

 async function load(){
  setLoading(true); const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace("/login");return}
  const {data:b}=await supabase.from("businesses").select("id,name,slug,plan,business_mode,description,whatsapp,bank_name,account_name,account_number,pickup_address,pickup_enabled,delivery_enabled").eq("owner_id",user.id).order("created_at").limit(1).maybeSingle();
  if(!b){router.replace("/onboarding");return}
  const biz=b as Business; setBusiness(biz); setBankName(biz.bank_name||""); setAccountName(biz.account_name||""); setAccountNumber(biz.account_number||""); setPickupAddress(biz.pickup_address||""); setPickupEnabled(biz.pickup_enabled); setDeliveryEnabled(biz.delivery_enabled);
  const [{data:p},{data:o},{data:c},{data:s}]=await Promise.all([
   supabase.from("products").select("id,name,description,price,stock_limit,is_active").eq("business_id",biz.id).order("created_at",{ascending:false}),
   supabase.from("orders").select("id,order_number,customer_name,customer_phone,total,fulfilment,payment_status,order_status,created_at,collection_at").eq("business_id",biz.id).order("created_at",{ascending:false}).limit(100),
   supabase.from("preorder_campaigns").select("id,name,opens_at,closes_at,collection_start,collection_end,order_limit,is_active").eq("business_id",biz.id).order("created_at",{ascending:false}),
   supabase.from("availability_slots").select("id,slot_date,label,fulfilment,capacity,is_active").eq("business_id",biz.id).order("slot_date",{ascending:true})
  ]);
  setProducts((p||[]) as Product[]); setOrders((o||[]) as Order[]); setCampaigns((c||[]) as Campaign[]); setSlots((s||[]) as Slot[]); setLoading(false);
 }
 useEffect(()=>{load()},[]);

 const todayKey=new Date().toDateString();
 const today=useMemo(()=>orders.filter(o=>new Date(o.created_at).toDateString()===todayKey),[orders,todayKey]);
 const salesToday=today.filter(o=>o.order_status!=="cancelled").reduce((s,o)=>s+Number(o.total),0);
 const receipts=orders.filter(o=>o.payment_status==="receipt_uploaded");
 const unpaid=orders.filter(o=>o.payment_status==="awaiting_payment");
 const preparing=orders.filter(o=>["confirmed","preparing"].includes(o.order_status));
 const ready=orders.filter(o=>o.order_status==="ready");
 const customers=useMemo(()=>{const m=new Map<string,{name:string;phone:string;orders:number;spent:number;last:string}>();orders.filter(o=>o.order_status!=="cancelled").forEach(o=>{const prev=m.get(o.customer_phone)||{name:o.customer_name,phone:o.customer_phone,orders:0,spent:0,last:o.created_at};prev.orders++;prev.spent+=Number(o.total);if(new Date(o.created_at)>new Date(prev.last))prev.last=o.created_at;m.set(o.customer_phone,prev)});return [...m.values()].sort((a,b)=>b.spent-a.spent)},[orders]);
 const confirmedValue=orders.filter(o=>["paid"].includes(o.payment_status)&&o.order_status!=="cancelled").reduce((s,o)=>s+Number(o.total),0);
 const pipelineValue=orders.filter(o=>o.payment_status!=="paid"&&o.order_status!=="cancelled").reduce((s,o)=>s+Number(o.total),0);
 const activeCampaigns=campaigns.filter(c=>c.is_active);
 const activeSlots=slots.filter(s=>s.is_active);

 async function addProduct(e:FormEvent){e.preventDefault();if(!business)return;const value=Number(price);if(!name.trim()||!Number.isFinite(value)){setMessage("Enter a valid product name and price.");return}const {error}=await supabase.from("products").insert({business_id:business.id,name:name.trim(),description:description.trim()||null,price:value,stock_limit:stock?Number(stock):null});setMessage(error?error.message:"Product added.");if(!error){setName("");setDescription("");setPrice("");setStock("");await load()}}
 async function toggleProduct(p:Product){await supabase.from("products").update({is_active:!p.is_active}).eq("id",p.id);await load()}
 async function updateOrder(id:string,field:"order_status"|"payment_status",value:string){await supabase.from("orders").update({[field]:value}).eq("id",id);await load()}
 async function addCampaign(e:FormEvent){e.preventDefault();if(!business)return;if(business.plan==="free"&&activeCampaigns.length>=1){setMessage("Free includes 1 active preorder campaign. Pause the current one or upgrade for unlimited campaigns.");return}const {error}=await supabase.from("preorder_campaigns").insert({business_id:business.id,name:campaignName.trim(),closes_at:campaignClose?new Date(campaignClose).toISOString():null,collection_start:collectionStart||null,collection_end:collectionEnd||null,order_limit:campaignLimit?Number(campaignLimit):null,is_active:true});setMessage(error?error.message:"Preorder opened.");if(!error){setCampaignName("");setCampaignClose("");setCollectionStart("");setCollectionEnd("");setCampaignLimit("");await load()}}
 async function toggleCampaign(c:Campaign){if(!business)return;if(business.plan==="free"&&!c.is_active&&activeCampaigns.length>=1){setMessage("Free includes 1 active preorder campaign.");return}await supabase.from("preorder_campaigns").update({is_active:!c.is_active}).eq("id",c.id);await load()}
 async function addSlot(e:FormEvent){e.preventDefault();if(!business)return;const cap=Number(slotCapacity);if(!slotDate||!slotLabel.trim()||!Number.isFinite(cap)||cap<1){setMessage("Add a valid date, label and capacity.");return}const {error}=await supabase.from("availability_slots").insert({business_id:business.id,slot_date:slotDate,label:slotLabel.trim(),fulfilment:slotMethod,capacity:cap});setMessage(error?error.message:"Capacity slot added.");if(!error){setSlotDate("");setSlotLabel("");setSlotCapacity("");await load()}}
 async function toggleSlot(s:Slot){await supabase.from("availability_slots").update({is_active:!s.is_active}).eq("id",s.id);await load()}
 async function saveSettings(e:FormEvent){e.preventDefault();if(!business)return;const {error}=await supabase.from("businesses").update({bank_name:bankName.trim()||null,account_name:accountName.trim()||null,account_number:accountNumber.trim()||null,pickup_address:pickupAddress.trim()||null,pickup_enabled:pickupEnabled,delivery_enabled:deliveryEnabled}).eq("id",business.id);setMessage(error?error.message:"Store settings saved.");await load()}
 async function signOut(){await supabase.auth.signOut();router.push("/login")}
 if(loading)return <main className="kadai-loading">Opening your KADAI…</main>; if(!business)return null;
 const mode=business.business_mode||"products";
 return <div className="kadai-dashboard">
  <aside className="kadai-sidebar">
   <div><div className="kadai-brand">KADAI</div><div className="kadai-by">by IZIRA</div></div>
   <nav className="kadai-nav">
    <a href="#today" className="active">Today</a><a href="#orders">Orders</a>{mode!=="appointments"&&<a href="#products">Products</a>}{mode!=="products"&&<Link href="/dashboard/appointments">Appointments</Link>}<a href="#calendar">Calendar</a><a href="#customers">Customers</a><a href="#money">Money</a><a href="#store">Store</a>
   </nav>
   <div className="kadai-side-bottom"><Link href={`/${business.slug}`}>View my KADAI ↗</Link><Link href="/dashboard/plan">Plan & usage</Link><button onClick={signOut}>Sign out</button></div>
  </aside>
  <main className="kadai-main" id="today">
   <header className="kadai-topbar"><div><div className="kadai-eyebrow">{business.name} · {business.plan.toUpperCase()}</div><h1>What needs your attention?</h1><p>Everything important for today, in one place.</p></div><div className="kadai-top-actions"><Link className="kadai-btn ghost" href={`/${business.slug}`}>View store</Link>{mode!=="products"&&<Link className="kadai-btn" href="/dashboard/appointments">Appointments</Link>}</div></header>
   {message&&<div className="kadai-notice">{message}<button onClick={()=>setMessage("")}>×</button></div>}
   <section className="kadai-metrics">
    <div className="kadai-metric"><span>Orders today</span><strong>{today.length}</strong><small>BND {salesToday.toFixed(2)} value</small></div>
    <div className="kadai-metric"><span>Receipts to check</span><strong>{receipts.length}</strong><small>{receipts.length?"Needs your review":"All clear"}</small></div>
    <div className="kadai-metric"><span>Preparing</span><strong>{preparing.length}</strong><small>{ready.length} ready for pickup</small></div>
    <div className="kadai-metric"><span>Customers</span><strong>{customers.length}</strong><small>{orders.length} orders recorded</small></div>
   </section>
   <section className="kadai-grid two">
    <div className="kadai-panel"><div className="panel-head"><div><span className="kadai-eyebrow">NEEDS ATTENTION</span><h2>Do these next</h2></div><span className="count-pill">{receipts.length+unpaid.length+ready.length}</span></div>
     <div className="attention-list">
      {receipts.slice(0,3).map(o=><div className="attention-item" key={o.id}><span className="attention-dot"></span><div><b>Check receipt · Order #{o.order_number}</b><small>{o.customer_name} · BND {Number(o.total).toFixed(2)}</small></div><a href={wa(o.customer_phone,`Hi ${o.customer_name}, this is ${business.name} regarding your KADAI order #${o.order_number}.`)} target="_blank">WhatsApp</a></div>)}
      {unpaid.slice(0,2).map(o=><div className="attention-item" key={o.id}><span className="attention-dot soft"></span><div><b>Awaiting payment · #{o.order_number}</b><small>{o.customer_name}</small></div><a href={wa(o.customer_phone,`Hi ${o.customer_name}, just a reminder for your KADAI order #${o.order_number}. Your total is BND ${Number(o.total).toFixed(2)}.`)} target="_blank">Remind</a></div>)}
      {ready.slice(0,2).map(o=><div className="attention-item" key={o.id}><span className="attention-dot ok"></span><div><b>Ready · #{o.order_number}</b><small>{o.customer_name}</small></div><a href={wa(o.customer_phone,`Hi ${o.customer_name} 👋 Your order #${o.order_number} from ${business.name} is ready.`)} target="_blank">Message</a></div>)}
      {receipts.length+unpaid.length+ready.length===0&&<div className="empty-state"><b>You’re all caught up.</b><span>No urgent actions right now.</span></div>}
     </div>
    </div>
    <div className="kadai-panel"><div className="panel-head"><div><span className="kadai-eyebrow">CAPACITY</span><h2>Upcoming slots</h2></div><a href="#calendar">Manage</a></div>
     <div className="slot-stack">{activeSlots.slice(0,5).map(s=><div className="slot-card" key={s.id}><div><b>{new Date(s.slot_date+"T00:00:00").toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}</b><small>{s.label} · {pretty(s.fulfilment)}</small></div><div className="capacity"><strong>{s.capacity}</strong><span>slots</span></div></div>)}{!activeSlots.length&&<div className="empty-state"><b>No capacity set yet.</b><span>Add your first date or time slot below.</span></div>}</div>
    </div>
   </section>

   <section id="orders" className="kadai-section"><div className="section-title"><div><span className="kadai-eyebrow">ORDERS</span><h2>Recent orders</h2></div><Link href="/dashboard/orders">Open full order view →</Link></div>
    <div className="kadai-table">{orders.slice(0,12).map(o=><div className="order-row" key={o.id}><div><b>#{o.order_number} · {o.customer_name}</b><small>{o.customer_phone} · {pretty(o.fulfilment)} · BND {Number(o.total).toFixed(2)}</small></div><select value={o.payment_status} onChange={e=>updateOrder(o.id,"payment_status",e.target.value)}>{paymentStates.map(x=><option key={x} value={x}>{pretty(x)}</option>)}</select><select value={o.order_status} onChange={e=>updateOrder(o.id,"order_status",e.target.value)}>{orderStates.map(x=><option key={x} value={x}>{pretty(x)}</option>)}</select><a className="wa-link" target="_blank" href={wa(o.customer_phone,`Hi ${o.customer_name}, this is ${business.name} regarding KADAI order #${o.order_number}.`)}>WhatsApp</a></div>)}{!orders.length&&<div className="empty-state roomy"><b>No orders yet.</b><span>Share izira.xyz/{business.slug} when you’re ready.</span></div>}</div>
   </section>

   {mode!=="appointments"&&<section id="products" className="kadai-section"><div className="section-title"><div><span className="kadai-eyebrow">CATALOG</span><h2>Products</h2></div></div><div className="kadai-grid two"><form className="kadai-panel" onSubmit={addProduct}><h3>Add product</h3><div className="kadai-field"><label>Name</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Sea Salt Cookies"/></div><div className="kadai-field"><label>Description</label><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short and useful"/></div><div className="kadai-grid two compact"><div className="kadai-field"><label>Price (BND)</label><input type="number" step="0.01" min="0" required value={price} onChange={e=>setPrice(e.target.value)}/></div><div className="kadai-field"><label>Max quantity</label><input type="number" min="0" value={stock} onChange={e=>setStock(e.target.value)} placeholder="Optional"/></div></div><button className="kadai-btn">Add product</button></form><div className="catalog-list">{products.map(p=><div className="catalog-item" key={p.id}><div><b>{p.name}</b><small>BND {Number(p.price).toFixed(2)} · {p.stock_limit==null?"No limit":`${p.stock_limit} max`}</small></div><button className="kadai-btn ghost" onClick={()=>toggleProduct(p)}>{p.is_active?"Hide":"Show"}</button></div>)}{!products.length&&<div className="empty-state roomy"><b>No products yet.</b><span>Add your first item.</span></div>}</div></div></section>}

   <section id="calendar" className="kadai-section"><div className="section-title"><div><span className="kadai-eyebrow">PREORDERS & CAPACITY</span><h2>Plan what you can handle</h2></div><span className="section-note">Free includes basic capacity + 1 active preorder.</span></div>
    <div className="kadai-grid two"><form className="kadai-panel" onSubmit={addCampaign}><h3>Open preorder</h3><div className="kadai-field"><label>Name</label><input required value={campaignName} onChange={e=>setCampaignName(e.target.value)} placeholder="Hari Raya Cookies 2027"/></div><div className="kadai-field"><label>Orders close</label><input type="datetime-local" value={campaignClose} onChange={e=>setCampaignClose(e.target.value)}/></div><div className="kadai-grid two compact"><div className="kadai-field"><label>Collection start</label><input type="date" value={collectionStart} onChange={e=>setCollectionStart(e.target.value)}/></div><div className="kadai-field"><label>Collection end</label><input type="date" value={collectionEnd} onChange={e=>setCollectionEnd(e.target.value)}/></div></div><div className="kadai-field"><label>Maximum orders</label><input type="number" min="1" value={campaignLimit} onChange={e=>setCampaignLimit(e.target.value)} placeholder="Optional"/></div><button className="kadai-btn">Open preorder</button><div className="mini-list">{campaigns.map(c=><div className="mini-row" key={c.id}><div><b>{c.name}</b><small>{c.is_active?"Open":"Paused"}{c.order_limit?` · ${c.order_limit} max`:""}</small></div><button type="button" onClick={()=>toggleCampaign(c)}>{c.is_active?"Pause":"Open"}</button></div>)}</div></form>
     <form className="kadai-panel" onSubmit={addSlot}><h3>Add capacity slot</h3><div className="kadai-field"><label>Date</label><input type="date" required value={slotDate} onChange={e=>setSlotDate(e.target.value)}/></div><div className="kadai-field"><label>Time / label</label><input required value={slotLabel} onChange={e=>setSlotLabel(e.target.value)} placeholder="4–6 PM"/></div><div className="kadai-grid two compact"><div className="kadai-field"><label>Type</label><select value={slotMethod} onChange={e=>setSlotMethod(e.target.value)}><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></div><div className="kadai-field"><label>Capacity</label><input type="number" min="1" required value={slotCapacity} onChange={e=>setSlotCapacity(e.target.value)}/></div></div><button className="kadai-btn">Add slot</button><div className="mini-list">{slots.map(s=><div className="mini-row" key={s.id}><div><b>{s.slot_date} · {s.label}</b><small>{s.capacity} slots · {pretty(s.fulfilment)}</small></div><button type="button" onClick={()=>toggleSlot(s)}>{s.is_active?"Pause":"Open"}</button></div>)}</div></form>
    </div>
   </section>

   <section id="customers" className="kadai-section"><div className="section-title"><div><span className="kadai-eyebrow">CUSTOMERS</span><h2>People who buy from you</h2></div></div><div className="customer-grid">{customers.slice(0,8).map(c=><div className="customer-card" key={c.phone}><div className="avatar">{c.name.slice(0,1).toUpperCase()}</div><div><b>{c.name}</b><small>{c.orders} order{c.orders===1?"":"s"} · BND {c.spent.toFixed(2)}</small><span>Last order {new Date(c.last).toLocaleDateString()}</span></div><a href={wa(c.phone,`Hi ${c.name}, this is ${business.name} 👋`)} target="_blank">WhatsApp</a></div>)}{!customers.length&&<div className="empty-state roomy"><b>No customer history yet.</b><span>It will build automatically from orders.</span></div>}</div></section>

   <section id="money" className="kadai-section"><div className="section-title"><div><span className="kadai-eyebrow">MONEY</span><h2>Simple business snapshot</h2></div></div><div className="kadai-metrics three"><div className="kadai-metric"><span>Paid / confirmed</span><strong>BND {confirmedValue.toFixed(2)}</strong><small>Non-cancelled orders</small></div><div className="kadai-metric"><span>Awaiting payment</span><strong>BND {pipelineValue.toFixed(2)}</strong><small>{unpaid.length+receipts.length} orders in pipeline</small></div><div className="kadai-metric"><span>Active preorders</span><strong>{activeCampaigns.length}</strong><small>{business.plan==="free"?"1 included on Free":"Unlimited on your plan"}</small></div></div></section>

   <section id="store" className="kadai-section"><div className="section-title"><div><span className="kadai-eyebrow">STORE</span><h2>How customers buy from you</h2></div></div><form className="kadai-panel" onSubmit={saveSettings}><div className="kadai-grid two"><div><h3>Bank transfer</h3><div className="kadai-field"><label>Bank</label><input value={bankName} onChange={e=>setBankName(e.target.value)}/></div><div className="kadai-field"><label>Account name</label><input value={accountName} onChange={e=>setAccountName(e.target.value)}/></div><div className="kadai-field"><label>Account number</label><input value={accountNumber} onChange={e=>setAccountNumber(e.target.value)}/></div></div><div><h3>Fulfilment</h3><div className="kadai-field"><label>Pickup address</label><textarea rows={3} value={pickupAddress} onChange={e=>setPickupAddress(e.target.value)}/></div><label className="toggle-row"><input type="checkbox" checked={pickupEnabled} onChange={e=>setPickupEnabled(e.target.checked)}/> Allow pickup</label><label className="toggle-row"><input type="checkbox" checked={deliveryEnabled} onChange={e=>setDeliveryEnabled(e.target.checked)}/> Allow delivery</label></div></div><button className="kadai-btn" style={{marginTop:18}}>Save store settings</button></form></section>
  </main>
 </div>
}

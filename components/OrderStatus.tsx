"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase-public";

type Props={slug:string;token:string};

type StatusData={
 business:{name:string;slug:string;pickup_address:string|null};
 order:{order_number:number;customer_name:string;total:number|string;fulfilment:string;collection_at:string|null;delivery_address:string|null;payment_status:string;order_status:string;created_at:string};
 items:{product_name:string;unit_price:number|string;quantity:number}[];
 receipt_uploaded:boolean;
};

const steps=["new","confirmed","preparing","ready","completed"];

export default function OrderStatus({slug,token}:Props){
 const [data,setData]=useState<StatusData|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");

 async function load(){
  setLoading(true);setError("");
  try{
   const res=await fetch(`${supabaseUrl}/functions/v1/get-order-status`,{method:"POST",headers:{"Content-Type":"application/json","apikey":supabasePublishableKey},body:JSON.stringify({slug,token})});
   const json=await res.json();
   if(!res.ok) throw new Error(json.error||"Unable to load order");
   setData(json);
  }catch(e:any){setError(e.message||"Unable to load order")}finally{setLoading(false)}
 }
 useEffect(()=>{load()},[slug,token]);

 if(loading)return <main className="shell"><div className="card" style={{marginTop:60}}>Loading order…</div></main>;
 if(error||!data)return <main className="shell"><div className="card" style={{marginTop:60}}><h1>Order not found</h1><p className="muted">{error||"This private order link is invalid."}</p><Link className="btn" href={`/${slug}`}>Back to store</Link></div></main>;
 const cancelled=data.order.order_status==="cancelled";
 const currentIndex=steps.indexOf(data.order.order_status);
 return <main className="shell" style={{maxWidth:760}}>
   <div style={{padding:"42px 0 20px"}}><div className="eyebrow">{data.business.name}</div><h1 style={{fontSize:44,margin:"8px 0"}}>Order #{data.order.order_number}</h1><p className="muted">Private order status for {data.order.customer_name}</p></div>
   <section className="card" style={{marginBottom:18}}>
     <div className="eyebrow">ORDER STATUS</div>
     {cancelled?<h2 style={{marginBottom:6}}>Cancelled</h2>:<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginTop:18}}>{steps.map((s,i)=><div key={s} style={{padding:12,borderRadius:14,background:i<=currentIndex?"#a8512d":"#eee3d8",color:i<=currentIndex?"white":"#62564e",textAlign:"center",fontWeight:800,fontSize:12,textTransform:"capitalize"}}>{s}</div>)}</div>}
     <p className="muted" style={{marginTop:18}}>Refresh this page anytime to see updates from the seller.</p>
     <button className="btn secondary" onClick={load}>Refresh status</button>
   </section>
   <section className="card" style={{marginBottom:18}}><div className="eyebrow">PAYMENT</div><h2 style={{textTransform:"capitalize"}}>{data.order.payment_status.replaceAll("_"," ")}</h2><p className="muted">{data.receipt_uploaded?"Your receipt has been submitted to the seller.":"No receipt is currently attached to this order."}</p></section>
   <section className="card" style={{marginBottom:18}}><div className="eyebrow">ORDER SUMMARY</div>{data.items.map((i,idx)=><div key={idx} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #eee3da"}}><span>{i.quantity} × {i.product_name}</span><b>BND {(Number(i.unit_price)*i.quantity).toFixed(2)}</b></div>)}<div style={{display:"flex",justifyContent:"space-between",paddingTop:16,fontSize:20}}><b>Total</b><b>BND {Number(data.order.total).toFixed(2)}</b></div></section>
   <section className="card" style={{marginBottom:18}}><div className="eyebrow">FULFILMENT</div><h3 style={{textTransform:"capitalize"}}>{data.order.fulfilment}</h3>{data.order.collection_at&&<p className="muted">Collection date: {new Date(data.order.collection_at).toLocaleDateString()}</p>}{data.order.fulfilment==="pickup"&&data.business.pickup_address&&<p>{data.business.pickup_address}</p>}{data.order.fulfilment==="delivery"&&data.order.delivery_address&&<p>{data.order.delivery_address}</p>}</section>
   <Link className="btn secondary" href={`/${data.business.slug}`}>Back to store</Link>
 </main>;
}

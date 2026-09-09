"use client";
import { useMemo, useState } from "react";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase-public";

type Product={id:string;name:string;description:string|null;price:number;stock_limit:number|null;is_active:boolean};
type Slot={id:string;slot_date:string;label:string;fulfilment:"pickup"|"delivery";capacity:number;is_active:boolean};
type Props={slug:string;products:Product[];slots:Slot[];pickupEnabled:boolean;deliveryEnabled:boolean;pickupAddress:string|null};

export default function Storefront({slug,products,slots,pickupEnabled,deliveryEnabled,pickupAddress}:Props){
 const defaultMethod: "pickup"|"delivery" = pickupEnabled ? "pickup" : "delivery";
 const [cart,setCart]=useState<Record<string,number>>({});
 const [name,setName]=useState("");
 const [phone,setPhone]=useState("");
 const [fulfilment,setFulfilment]=useState<"pickup"|"delivery">(defaultMethod);
 const [slotId,setSlotId]=useState("");
 const [deliveryAddress,setDeliveryAddress]=useState("");
 const [note,setNote]=useState("");
 const [submitted,setSubmitted]=useState<any>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 const total=useMemo(()=>products.reduce((s,p)=>s+(cart[p.id]||0)*p.price,0)+(fulfilment==="delivery"&&Object.values(cart).some(Boolean)?3:0),[cart,products,fulfilment]);
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 const visibleSlots=slots.filter(s=>s.fulfilment===fulfilment);
 const change=(id:string,n:number)=>setCart(c=>{const product=products.find(p=>p.id===id);const max=product?.stock_limit??50;return {...c,[id]:Math.min(max,Math.max(0,(c[id]||0)+n))}});

 async function placeOrder(){
   setError("");
   if(!name.trim()||!phone.trim()){setError("Please enter your name and phone number.");return;}
   if(visibleSlots.length>0&&!slotId){setError("Please choose a collection slot.");return;}
   if(fulfilment==="delivery"&&!deliveryAddress.trim()){setError("Please enter a delivery address.");return;}
   const items=Object.entries(cart).filter(([,q])=>q>0).map(([product_id,quantity])=>({product_id,quantity}));
   if(!items.length)return;
   setLoading(true);
   try{
     const res=await fetch(`${supabaseUrl}/functions/v1/create-order`,{
       method:"POST",
       headers:{"Content-Type":"application/json","apikey":supabasePublishableKey},
       body:JSON.stringify({slug,customer_name:name,customer_phone:phone,fulfilment,slot_id:slotId||null,delivery_address:fulfilment==="delivery"?deliveryAddress:null,note,items})
     });
     const json=await res.json();
     if(!res.ok) throw new Error(json.error||"Unable to create order");
     setSubmitted(json);
   }catch(e:any){setError(e.message||"Unable to create order");}
   finally{setLoading(false);}
 }

 if(submitted){const order=submitted.order;const payment=submitted.payment||{};return <div className="card" style={{maxWidth:620,margin:"60px auto",textAlign:"center"}}><div style={{fontSize:52}}>✓</div><h1>Order received</h1><p>Your order number is <b>#{order.order_number}</b>.</p><p className="muted">Total: BND {Number(order.total).toFixed(2)} · Awaiting payment confirmation.</p>{payment.bank_name&&payment.account_number?<div className="card" style={{margin:"22px 0",textAlign:"left"}}><div className="eyebrow">BANK TRANSFER</div><p><b>{payment.bank_name}</b><br/>{payment.account_name}<br/><span style={{fontSize:22,fontWeight:800}}>{payment.account_number}</span></p><p className="muted">Transfer the exact amount and keep your receipt. Receipt upload is the next checkout feature being connected.</p></div>:<p className="muted">The seller will send payment instructions directly.</p>}{fulfilment==="pickup"&&submitted.pickup_address&&<div className="card" style={{textAlign:"left"}}><b>Pickup</b><p className="muted">{submitted.pickup_address}</p></div>}<button className="btn" style={{marginTop:18}} onClick={()=>{setSubmitted(null);setCart({});setSlotId("")}}>Back to store</button></div>}

 if(!pickupEnabled&&!deliveryEnabled)return <div className="card"><h2>Ordering is temporarily closed</h2><p className="muted">This seller has paused pickup and delivery.</p></div>;

 return <div className="store-layout"><div className="products">{products.map(p=><article className="product" key={p.id}><div className="product-img">{p.name.toLowerCase().includes("cookie")?"🍪":p.name.toLowerCase().includes("tiramisu")?"☕":p.name.toLowerCase().includes("batik")?"🍰":"🍫"}</div><div className="product-body"><h3 style={{margin:"0 0 7px"}}>{p.name}</h3><p className="muted" style={{minHeight:44}}>{p.description}</p><div className="price">BND {p.price.toFixed(2)}</div>{p.stock_limit!==null&&<div className="muted" style={{fontSize:13,marginTop:6}}>Maximum {p.stock_limit} per order</div>}<button className="btn" style={{marginTop:14}} onClick={()=>change(p.id,1)}>Add to order</button></div></article>)}</div><aside className="cart"><h2 style={{marginTop:0}}>Your order <span className="muted" style={{fontSize:14}}>({count})</span></h2>{count===0?<p className="muted">Add something delicious to get started.</p>:products.filter(p=>cart[p.id]).map(p=><div className="cart-row" key={p.id}><div><b>{p.name}</b><div className="muted">BND {(p.price*cart[p.id]).toFixed(2)}</div></div><div className="qty"><button onClick={()=>change(p.id,-1)}>−</button><b>{cart[p.id]}</b><button onClick={()=>change(p.id,1)}>+</button></div></div>)}<div style={{display:"flex",justifyContent:"space-between",padding:"16px 0",fontSize:20}}><b>Total</b><b>BND {total.toFixed(2)}</b></div>{count>0&&<div className="checkout"><div className="field"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div><div className="field"><label>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+673 ..."/></div><div className="field"><label>Fulfilment</label><select value={fulfilment} onChange={e=>{setFulfilment(e.target.value as "pickup"|"delivery");setSlotId("")}}>{pickupEnabled&&<option value="pickup">Pickup</option>}{deliveryEnabled&&<option value="delivery">Delivery (+ BND 3)</option>}</select></div>{visibleSlots.length>0&&<div className="field"><label>Available slot</label><select value={slotId} onChange={e=>setSlotId(e.target.value)}><option value="">Choose a slot</option>{visibleSlots.map(s=><option key={s.id} value={s.id}>{s.slot_date} · {s.label}</option>)}</select></div>}{fulfilment==="pickup"&&pickupAddress&&<div className="card" style={{padding:12}}><b>Pickup</b><div className="muted">{pickupAddress}</div></div>}{fulfilment==="delivery"&&<div className="field"><label>Delivery address</label><textarea rows={3} value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} placeholder="Delivery address"/></div>}<div className="field"><label>Special request</label><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note"/></div>{error&&<p style={{color:"crimson",fontSize:14}}>{error}</p>}<button className="btn" disabled={loading} onClick={placeOrder}>{loading?"Placing order…":`Place order · BND ${total.toFixed(2)}`}</button></div>}</aside></div>
}

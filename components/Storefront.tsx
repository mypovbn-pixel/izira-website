"use client";
import { useMemo, useState } from "react";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase-public";

type Product={id:string;name:string;description:string|null;price:number;stock_limit:number|null;is_active:boolean};
type Props={slug:string;products:Product[]};

export default function Storefront({slug,products}:Props){
 const [cart,setCart]=useState<Record<string,number>>({});
 const [name,setName]=useState("");
 const [phone,setPhone]=useState("");
 const [fulfilment,setFulfilment]=useState<"pickup"|"delivery">("pickup");
 const [deliveryAddress,setDeliveryAddress]=useState("");
 const [note,setNote]=useState("");
 const [submitted,setSubmitted]=useState<any>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 const total=useMemo(()=>products.reduce((s,p)=>s+(cart[p.id]||0)*p.price,0)+(fulfilment==="delivery"&&Object.values(cart).some(Boolean)?3:0),[cart,products,fulfilment]);
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 const change=(id:string,n:number)=>setCart(c=>({...c,[id]:Math.max(0,(c[id]||0)+n)}));

 async function placeOrder(){
   setError("");
   if(!name.trim()||!phone.trim()){setError("Please enter your name and phone number.");return;}
   if(fulfilment==="delivery"&&!deliveryAddress.trim()){setError("Please enter a delivery address.");return;}
   const items=Object.entries(cart).filter(([,q])=>q>0).map(([product_id,quantity])=>({product_id,quantity}));
   if(!items.length)return;
   setLoading(true);
   try{
     const res=await fetch(`${supabaseUrl}/functions/v1/create-order`,{
       method:"POST",
       headers:{"Content-Type":"application/json","apikey":supabasePublishableKey},
       body:JSON.stringify({slug,customer_name:name,customer_phone:phone,fulfilment,delivery_address:fulfilment==="delivery"?deliveryAddress:null,note,items})
     });
     const json=await res.json();
     if(!res.ok) throw new Error(json.error||"Unable to create order");
     setSubmitted(json.order);
   }catch(e:any){setError(e.message||"Unable to create order");}
   finally{setLoading(false);}
 }

 if(submitted) return <div className="card" style={{maxWidth:600,margin:"80px auto",textAlign:"center"}}><div style={{fontSize:52}}>✓</div><h1>Order received</h1><p>Your order number is <b>#{submitted.order_number}</b>.</p><p className="muted">Total: BND {Number(submitted.total).toFixed(2)} · Payment status: awaiting payment.</p><button className="btn" onClick={()=>{setSubmitted(null);setCart({});}}>Back to store</button></div>;

 return <div className="store-layout"><div className="products">{products.map(p=><article className="product" key={p.id}><div className="product-img">{p.name.toLowerCase().includes("cookie")?"🍪":p.name.toLowerCase().includes("tiramisu")?"☕":p.name.toLowerCase().includes("batik")?"🍰":"🍫"}</div><div className="product-body"><h3 style={{margin:"0 0 7px"}}>{p.name}</h3><p className="muted" style={{minHeight:44}}>{p.description}</p><div className="price">BND {p.price.toFixed(2)}</div>{p.stock_limit!==null&&<div className="muted" style={{fontSize:13,marginTop:6}}>Limited to {p.stock_limit} per production batch</div>}<button className="btn" style={{marginTop:14}} onClick={()=>change(p.id,1)}>Add to order</button></div></article>)}</div><aside className="cart"><h2 style={{marginTop:0}}>Your order <span className="muted" style={{fontSize:14}}>({count})</span></h2>{count===0?<p className="muted">Add something delicious to get started.</p>:products.filter(p=>cart[p.id]).map(p=><div className="cart-row" key={p.id}><div><b>{p.name}</b><div className="muted">BND {(p.price*cart[p.id]).toFixed(2)}</div></div><div className="qty"><button onClick={()=>change(p.id,-1)}>−</button><b>{cart[p.id]}</b><button onClick={()=>change(p.id,1)}>+</button></div></div>)}<div style={{display:"flex",justifyContent:"space-between",padding:"16px 0",fontSize:20}}><b>Total</b><b>BND {total.toFixed(2)}</b></div>{count>0&&<div className="checkout"><div className="field"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div><div className="field"><label>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+673 ..."/></div><div className="field"><label>Fulfilment</label><select value={fulfilment} onChange={e=>setFulfilment(e.target.value as "pickup"|"delivery")}><option value="pickup">Pickup</option><option value="delivery">Delivery (+ BND 3)</option></select></div>{fulfilment==="delivery"&&<div className="field"><label>Delivery address</label><textarea rows={3} value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} placeholder="Delivery address"/></div>}<div className="field"><label>Special request</label><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note"/></div>{error&&<p style={{color:"crimson",fontSize:14}}>{error}</p>}<button className="btn" disabled={loading} onClick={placeOrder}>{loading?"Placing order…":`Place order · BND ${total.toFixed(2)}`}</button></div>}</aside></div>
}

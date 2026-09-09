"use client";
import { useMemo, useState } from "react";

type Product={id:string;name:string;description:string;price:number;emoji:string};
const products:Product[]=[
  {id:"brownies",name:"Nutella Brownies",description:"Fudgy brownies with hazelnut spread. Box of 9.",price:12,emoji:"🍫"},
  {id:"batik",name:"Kek Batik Indulgence",description:"Rich chocolate biscuit cake. 6-inch tray.",price:15,emoji:"🍰"},
  {id:"cookies",name:"Sea Salt Cookies",description:"Six chunky chocolate-chip cookies.",price:10,emoji:"🍪"},
  {id:"tiramisu",name:"Tiramisu Tub",description:"Creamy coffee dessert, family-size tub.",price:18,emoji:"☕"}
];

export default function Storefront(){
 const [cart,setCart]=useState<Record<string,number>>({});
 const [submitted,setSubmitted]=useState(false);
 const total=useMemo(()=>products.reduce((s,p)=>s+(cart[p.id]||0)*p.price,0),[cart]);
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 const change=(id:string,n:number)=>setCart(c=>({...c,[id]:Math.max(0,(c[id]||0)+n)}));
 if(submitted) return <div className="card" style={{maxWidth:600,margin:"80px auto",textAlign:"center"}}><div style={{fontSize:52}}>✓</div><h1>Order received</h1><p className="muted">Demo order #IZ-1042 has been created. In the connected version, payment instructions and receipt upload appear here.</p><button className="btn" onClick={()=>setSubmitted(false)}>Back to store</button></div>;
 return <div className="store-layout"><div className="products">{products.map(p=><article className="product" key={p.id}><div className="product-img">{p.emoji}</div><div className="product-body"><h3 style={{margin:"0 0 7px"}}>{p.name}</h3><p className="muted" style={{minHeight:44}}>{p.description}</p><div className="price">BND {p.price.toFixed(2)}</div><button className="btn" style={{marginTop:14}} onClick={()=>change(p.id,1)}>Add to order</button></div></article>)}</div><aside className="cart"><h2 style={{marginTop:0}}>Your order <span className="muted" style={{fontSize:14}}>({count})</span></h2>{count===0?<p className="muted">Add something delicious to get started.</p>:products.filter(p=>cart[p.id]).map(p=><div className="cart-row" key={p.id}><div><b>{p.name}</b><div className="muted">BND {(p.price*cart[p.id]).toFixed(2)}</div></div><div className="qty"><button onClick={()=>change(p.id,-1)}>−</button><b>{cart[p.id]}</b><button onClick={()=>change(p.id,1)}>+</button></div></div>)}<div style={{display:"flex",justifyContent:"space-between",padding:"16px 0",fontSize:20}}><b>Total</b><b>BND {total.toFixed(2)}</b></div>{count>0&&<div className="checkout"><div className="field"><label>Name</label><input placeholder="Your name"/></div><div className="field"><label>Phone</label><input placeholder="+673 ..."/></div><div className="field"><label>Fulfilment</label><select><option>Pickup</option><option>Delivery</option></select></div><div className="field"><label>Collection date</label><select><option>Friday, 11 Sep · 4–6 PM</option><option>Saturday, 12 Sep · 2–5 PM</option></select></div><div className="field"><label>Special request</label><textarea rows={3} placeholder="Optional note"/></div><button className="btn" onClick={()=>setSubmitted(true)}>Place order · BND {total.toFixed(2)}</button></div>}</aside></div>
}

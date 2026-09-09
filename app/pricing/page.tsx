import Link from "next/link";

const plans=[
 {name:"Free",price:"BND 0",sub:"Start selling without a subscription.",features:["30 orders/month","Unlimited products","Basic storefront","Pickup + delivery","Bank transfer instructions","Receipt upload","IZIRA branding visible"],cta:"Start free",href:"/signup"},
 {name:"Starter",price:"BND 8/month",sub:"For active home businesses running regular drops.",features:["150 orders/month","Everything in Free","Preorder campaigns","Availability & capacity slots","Customer history","Sales dashboard","More storefront controls"],cta:"Start with Free",href:"/signup",note:"Upgrade manually when ready"},
 {name:"Pro",price:"BND 18/month",sub:"For established sellers who need fewer limits.",features:["Unlimited orders","Everything in Starter","Custom domain entitlement","Remove IZIRA branding","Advanced preorder controls","Exports & deeper analytics coming next","Up to 3 staff later"],cta:"Start with Free",href:"/signup",note:"Upgrade manually when ready"}
];

export default function PricingPage(){
 return <main className="shell" style={{paddingBottom:70}}>
  <nav className="nav"><Link href="/" className="brand">IZIRA</Link><div className="navlinks"><Link href="/login">Sign in</Link><Link href="/signup" className="pill">Start selling</Link></div></nav>
  <section style={{textAlign:"center",padding:"48px 0 36px"}}><div className="eyebrow">SIMPLE PRICING</div><h1 style={{fontSize:"clamp(42px,7vw,72px)",letterSpacing:"-.05em",margin:"12px 0"}}>Keep 100% of your sales.</h1><p className="muted" style={{fontSize:19,maxWidth:650,margin:"0 auto"}}>No commission on orders. Start free and move up only when your business needs more capacity.</p></section>
  <section className="grid3" style={{alignItems:"stretch"}}>{plans.map((p,i)=><article className="card" key={p.name} style={{padding:28,display:"flex",flexDirection:"column",gap:18,border:i===1?"2px solid #a8512d":undefined}}><div>{i===1&&<div className="eyebrow">RECOMMENDED STARTER</div>}<h2 style={{fontSize:34,margin:"5px 0"}}>{p.name}</h2><div style={{fontSize:24,fontWeight:800}}>{p.price}</div><p className="muted">{p.sub}</p></div><div style={{display:"grid",gap:9,flex:1}}>{p.features.map(f=><div key={f}>✓ {f}</div>)}</div><Link className="btn" style={{textAlign:"center"}} href={p.href}>{p.cta}</Link>{p.note&&<div className="muted" style={{textAlign:"center",fontSize:13}}>{p.note}</div>}</article>)}</section>
  <section className="section" style={{textAlign:"center"}}><h2>Annual option</h2><p className="muted">Starter BND 80/year · Pro BND 180/year. Subscription upgrades remain manual during V1; no payment gateway is required.</p></section>
 </main>
}

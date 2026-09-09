import Link from "next/link";

export default function Home() {
  return <main className="shell">
    <nav className="nav"><div className="brand">IZIRA</div><div className="navlinks"><a href="#features">Features</a><a href="#pricing">Pricing</a><Link className="pill" href="/dashboard">Merchant demo</Link></div></nav>
    <section className="hero">
      <div><div className="eyebrow">Built for small businesses in Brunei</div><h1>Turn DMs into proper orders.</h1><p>A simple storefront, preorder manager and order dashboard for home bakers, food sellers, florists, makers and other micro businesses.</p><div style={{display:"flex",gap:12,marginTop:26}}><Link className="btn" href="/aisyahbakery">View sample store</Link><Link className="btn secondary" href="/dashboard">View dashboard</Link></div></div>
      <div className="hero-card"><div className="eyebrow" style={{color:"#efb892"}}>Today · Aisyah Bakery</div><h2 style={{fontSize:34,margin:"10px 0 4px"}}>Orders without the chaos.</h2><p style={{color:"#d7cec7"}}>Customers choose products, slots and fulfilment. You see one clean production list.</p><div className="statgrid"><div className="stat"><span>Orders</span><b>18</b></div><div className="stat"><span>Sales</span><b>BND 286</b></div><div className="stat"><span>Awaiting payment</span><b>4</b></div><div className="stat"><span>Pickup slots left</span><b>6</b></div></div></div>
    </section>
    <section id="features" className="section"><div className="eyebrow">V1 foundation</div><h2>Made for how home businesses actually sell.</h2><p className="muted">Not a heavy ecommerce suite. Just the things a small seller needs.</p><div className="grid3" style={{marginTop:24}}>{[
      ["Preorders & limits","Set order cut-offs, production caps and collection dates."],
      ["Simple checkout","Pickup or delivery, bank transfer instructions and receipt upload."],
      ["Order control","See new, paid, preparing and ready orders in one place."],
      ["Product options","Sizes, flavours, add-ons and special requests."],
      ["Your own link","Start with izira.xyz/yourstore. Custom domains can come on Pro."],
      ["No sales commission","Simple subscription pricing. Keep 100% of each sale."]
    ].map(([t,d])=><div className="card" key={t}><h3>{t}</h3><p className="muted">{d}</p></div>)}</div></section>
    <section id="pricing" className="section"><div className="eyebrow">Proposed launch pricing</div><h2>Start small. Upgrade when your orders grow.</h2><div className="grid3" style={{marginTop:24}}><div className="card"><h3>Free</h3><h2>BND 0</h2><p className="muted">30 orders/month · IZIRA link · basic storefront</p></div><div className="card" style={{border:"2px solid #a8512d"}}><h3>Starter</h3><h2>BND 8</h2><p className="muted">150 orders/month · preorder campaigns · slots & production limits</p></div><div className="card"><h3>Pro</h3><h2>BND 18</h2><p className="muted">Unlimited orders · custom domain · automation · staff access</p></div></div></section>
  </main>
}

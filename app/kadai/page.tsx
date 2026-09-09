import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KADAI by IZIRA",
  description: "Buka kadai online. Senang saja. Create your online store, share your link, take orders and manage everything from one place.",
};

const features = [
  ["Your own storefront", "Give customers one clean link instead of making them search posts, DMs and screenshots."],
  ["Products & options", "Add prices, sizes, flavours, colours, add-ons and availability without building a website."],
  ["Pickup & delivery", "Let customers choose how they want to receive their order and leave notes in one structured flow."],
  ["Receipt upload", "Show your bank-transfer instructions and let customers submit payment proof with the order."],
  ["Preorders", "Open a campaign, set the closing date and manage collection dates without tracking everything manually."],
  ["Simple order dashboard", "See what is new, paid, preparing, ready and completed without digging through chat threads."],
];

const businesses = ["Home bakers","Food sellers","Florists","Clothing sellers","Resellers","Crafters","Gift businesses","Handmade brands","Instagram sellers","WhatsApp sellers"];

export default function KadaiLanding(){
  return <main className="shell" style={{paddingBottom:80}}>
    <nav className="nav">
      <Link href="/kadai" style={{textDecoration:"none"}}><div style={{fontSize:28,fontWeight:900,letterSpacing:"-.04em",lineHeight:1}}>KADAI</div><div className="muted" style={{fontSize:11,marginTop:3}}>by IZIRA</div></Link>
      <div className="navlinks"><a href="#how">How it works</a><a href="#features">Features</a><a href="#pricing">Pricing</a><Link className="pill" href="/signup">Buka Kadai</Link></div>
    </nav>

    <section className="hero" style={{alignItems:"center"}}>
      <div>
        <div className="eyebrow">KADAI · by IZIRA</div>
        <h1 style={{maxWidth:720}}>Buka kadai online. Senang saja.</h1>
        <p style={{fontSize:20,maxWidth:680}}>Create your own online store, share your link, take orders and manage everything from one place.</p>
        <p className="muted">No complicated setup. No website-building skills needed.</p>
        <div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap"}}><Link className="btn" href="/signup">Buka Kadai</Link><Link className="btn secondary" href="/aisyahbakery">See a Sample Store</Link></div>
      </div>
      <div className="hero-card" style={{padding:22}}>
        <div className="eyebrow" style={{color:"#efb892"}}>LIVE STOREFRONT EXAMPLE</div>
        <div style={{background:"#fff",color:"#231d19",borderRadius:24,padding:20,marginTop:14}}>
          <div style={{fontSize:13,color:"#866f61"}}>izira.xyz/aisyahbakery</div>
          <h2 style={{fontSize:30,margin:"6px 0 4px"}}>Aisyah Bakery</h2>
          <p style={{color:"#75665c"}}>Fresh bakes · Gadong · Preorder only</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18}}>
            {[['Nutella Brownies','BND 12'],['Kek Batik','BND 15'],['Sea Salt Cookies','BND 10'],['Tiramisu Tub','BND 18']].map(([name,price])=><div key={name} style={{border:"1px solid #eadfd6",borderRadius:16,padding:14}}><b>{name}</b><div style={{marginTop:6,color:"#a8512d",fontWeight:800}}>{price}</div></div>)}
          </div>
          <div style={{textAlign:"center",fontSize:12,color:"#8b7b70",marginTop:18}}>Powered by KADAI</div>
        </div>
      </div>
    </section>

    <section className="section" style={{textAlign:"center",maxWidth:820,margin:"0 auto"}}>
      <div className="eyebrow">YOUR BUSINESS DESERVES ITS OWN SPACE</div>
      <h2>Still taking orders through DMs, screenshots and long WhatsApp conversations?</h2>
      <p className="muted" style={{fontSize:18}}>KADAI gives your customers one simple place to see what you sell, choose what they want and place their order.</p>
      <p style={{fontSize:20,fontWeight:800}}>You handle the business. KADAI handles the kadai.</p>
    </section>

    <section id="how" className="section">
      <div className="eyebrow">HOW KADAI WORKS</div><h2>Buka kadai. Share link. Start selling.</h2>
      <div className="grid3" style={{marginTop:24}}>{[
        ["1","Create your KADAI"],["2","Add your products"],["3","Set how you sell"],["4","Share your link"],["5","Receive orders"]
      ].map(([n,t])=><div className="card" key={n}><div className="eyebrow">STEP {n}</div><h3>{t}</h3></div>)}</div>
    </section>

    <section className="section">
      <div className="card" style={{padding:"32px",border:"2px solid #a8512d"}}>
        <div className="eyebrow">NO MORE “MASIH ADA SLOT?”</div>
        <h2 style={{fontSize:"clamp(34px,5vw,54px)",margin:"10px 0"}}>Sell only what you can actually handle.</h2>
        <p className="muted" style={{fontSize:18,maxWidth:780}}>Home businesses have real production limits. KADAI lets you set capacity by date or slot and automatically stops new orders when you are full.</p>
        <div className="grid3" style={{marginTop:24}}>
          <div className="card"><b>Saturday</b><div style={{fontSize:28,fontWeight:900,marginTop:8}}>12 / 20</div><div className="muted">slots taken</div></div>
          <div className="card"><b>Sunday</b><div style={{fontSize:28,fontWeight:900,marginTop:8}}>20 / 20</div><div style={{fontWeight:900,color:"#a8512d"}}>FULL</div></div>
          <div className="card"><b>Monday</b><div style={{fontSize:28,fontWeight:900,marginTop:8}}>8 / 15</div><div className="muted">slots taken</div></div>
        </div>
      </div>
    </section>

    <section id="features" className="section">
      <div className="eyebrow">BUILT FOR SMALL SELLERS</div><h2>Simple tools for how microbusinesses actually work.</h2>
      <div className="grid3" style={{marginTop:24}}>{features.map(([t,d])=><div className="card" key={t}><h3>{t}</h3><p className="muted">{d}</p></div>)}</div>
    </section>

    <section className="section">
      <div className="eyebrow">WHO IS KADAI FOR?</div><h2>Not just bakeries.</h2><p className="muted">Aisyah Bakery is our demo because capacity is easy to understand, but KADAI is built for many kinds of small businesses.</p>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}>{businesses.map(x=><span key={x} className="pill" style={{display:"inline-block"}}>{x}</span>)}</div>
    </section>

    <section id="pricing" className="section">
      <div className="eyebrow">SIMPLE PRICING</div><h2>Start small. Upgrade when your orders grow.</h2>
      <div className="grid3" style={{marginTop:24}}>
        <div className="card"><h3>Free</h3><h2>BND 0</h2><p className="muted">30 orders/month · basic storefront · pickup/delivery · receipt upload · Powered by KADAI</p></div>
        <div className="card" style={{border:"2px solid #a8512d"}}><h3>Starter</h3><h2>BND 8/month</h2><p className="muted">150 orders/month · preorders · capacity slots · customer history · sales dashboard</p></div>
        <div className="card"><h3>Pro</h3><h2>BND 18/month</h2><p className="muted">Unlimited orders · custom-domain entitlement · remove KADAI attribution · advanced tools</p></div>
      </div>
      <div style={{marginTop:20}}><Link href="/pricing" className="btn secondary">See full pricing</Link></div>
    </section>

    <section className="section">
      <div className="eyebrow">FAQ</div><h2>Before you buka your KADAI.</h2>
      <div style={{display:"grid",gap:12,marginTop:20}}>{[
        ["Do I need a website?","No. KADAI gives you a ready-to-use online storefront and a simple link to share."],
        ["Do my customers need an account?","No account is required just to browse and place a normal order."],
        ["Can I use bank transfer?","Yes. You can show payment instructions and customers can upload their receipt."],
        ["Can I stop taking orders when I am full?","Yes. Starter and Pro support preorder and capacity controls so KADAI can stop new orders when a date or slot is full."],
        ["Can I use my own domain later?","Pro includes a custom-domain entitlement so this can be supported when the hosting workflow is enabled."]
      ].map(([q,a])=><div className="card" key={q}><h3>{q}</h3><p className="muted">{a}</p></div>)}</div>
    </section>

    <section className="section" style={{textAlign:"center"}}>
      <h2 style={{fontSize:"clamp(38px,6vw,64px)"}}>Buka Kadai. Start selling.</h2><p className="muted" style={{fontSize:18}}>Your business, online — without the complicated stuff.</p><Link className="btn" href="/signup">Buka Kadai</Link>
    </section>

    <footer style={{padding:"32px 0",borderTop:"1px solid #eadfd6",display:"flex",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
      <div><div style={{fontSize:24,fontWeight:900}}>KADAI</div><div className="muted" style={{fontSize:12}}>by IZIRA</div></div>
      <div className="muted">A product by IZIRA · Brunei</div>
    </footer>
  </main>
}

import { notFound } from "next/navigation";
import Storefront from "@/components/Storefront";

const reserved=new Set(["dashboard","login","signup","pricing","about","admin","api"]);
export default async function StorePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 if(reserved.has(slug.toLowerCase())) notFound();
 if(slug.toLowerCase()!=="aisyahbakery") notFound();
 return <main className="shell"><div className="store-head"><div className="logo">AB</div><div><div className="eyebrow">izira.xyz/{slug}</div><h1 style={{margin:"4px 0"}}>Aisyah Bakery</h1><div className="muted">Home-baked treats · Gadong · Preorder only</div></div></div><div className="card" style={{marginBottom:20,padding:16}}><b>Next collection:</b> Friday & Saturday · <span className="muted">6 pickup slots remaining this week</span></div><Storefront/><footer style={{textAlign:"center",padding:"50px 0 20px"}} className="muted">Powered by <b>IZIRA</b></footer></main>
}

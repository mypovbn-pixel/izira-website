import { notFound } from "next/navigation";
import Storefront from "@/components/Storefront";
import { supabasePublic } from "@/lib/supabase-public";

const reserved=new Set(["dashboard","login","signup","pricing","about","admin","api"]);

export default async function StorePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const normalized=slug.toLowerCase();
  if(reserved.has(normalized)) notFound();

  const {data:business,error:businessError}=await supabasePublic
    .from("businesses")
    .select("id,name,slug,description,whatsapp,plan,is_active")
    .eq("slug",normalized)
    .eq("is_active",true)
    .single();

  if(businessError||!business) notFound();

  const {data:products,error:productsError}=await supabasePublic
    .from("products")
    .select("id,name,description,price,stock_limit,is_active")
    .eq("business_id",business.id)
    .eq("is_active",true)
    .order("created_at",{ascending:true});

  if(productsError) throw productsError;

  return <main className="shell">
    <div className="store-head">
      <div className="logo">{business.name.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}</div>
      <div>
        <div className="eyebrow">izira.xyz/{business.slug}</div>
        <h1 style={{margin:"4px 0"}}>{business.name}</h1>
        <div className="muted">{business.description||"Order directly from this business"}</div>
      </div>
    </div>
    <div className="card" style={{marginBottom:20,padding:16}}>
      <b>Ordering is open.</b> <span className="muted">Choose your items, pickup or delivery, then submit your order.</span>
    </div>
    <Storefront slug={business.slug} products={(products||[]).map((p:any)=>({...p,price:Number(p.price)}))}/>
    <footer style={{textAlign:"center",padding:"50px 0 20px"}} className="muted">Powered by <b>IZIRA</b></footer>
  </main>
}

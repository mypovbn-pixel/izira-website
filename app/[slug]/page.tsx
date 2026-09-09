import { notFound } from "next/navigation";
import Storefront from "@/components/Storefront";
import { supabasePublic } from "@/lib/supabase-public";

const reserved=new Set(["dashboard","login","signup","pricing","about","admin","api","onboarding","auth"]);

export default async function StorePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const normalized=slug.toLowerCase();
  if(reserved.has(normalized)) notFound();

  const {data:business,error:businessError}=await supabasePublic
    .from("businesses")
    .select("id,name,slug,description,whatsapp,plan,is_active,bank_name,account_name,account_number,pickup_address,pickup_enabled,delivery_enabled,hide_izira_branding")
    .eq("slug",normalized)
    .eq("is_active",true)
    .single();

  if(businessError||!business) notFound();

  const advanced=business.plan!=="free";
  const [{data:products,error:productsError},{data:slots},{data:campaigns}]=await Promise.all([
    supabasePublic.from("products").select("id,name,description,price,stock_limit,is_active").eq("business_id",business.id).eq("is_active",true).order("created_at",{ascending:true}),
    advanced?supabasePublic.from("availability_slots").select("id,slot_date,label,fulfilment,capacity,is_active").eq("business_id",business.id).eq("is_active",true).gte("slot_date",new Date().toISOString().slice(0,10)).order("slot_date",{ascending:true}):Promise.resolve({data:[]}),
    advanced?supabasePublic.from("preorder_campaigns").select("id,name,closes_at,collection_start,collection_end,order_limit,is_active").eq("business_id",business.id).eq("is_active",true).order("created_at",{ascending:false}).limit(1):Promise.resolve({data:[]})
  ]);

  if(productsError) throw productsError;
  const campaign=campaigns?.[0]||null;
  const canHideBranding=["pro","business"].includes(business.plan)&&business.hide_izira_branding;

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
      {campaign?<><b>{campaign.name}</b><span className="muted"> · {campaign.collection_start&&campaign.collection_end?`Collection ${campaign.collection_start}–${campaign.collection_end}`:"Preorder now"}</span></>:<><b>Ordering is open.</b> <span className="muted">Choose your items and an available collection method.</span></>}
    </div>
    <Storefront
      slug={business.slug}
      products={(products||[]).map((p:any)=>({...p,price:Number(p.price)}))}
      slots={(slots||[]) as any}
      pickupEnabled={business.pickup_enabled}
      deliveryEnabled={business.delivery_enabled}
      pickupAddress={business.pickup_address}
    />
    {!canHideBranding&&<footer style={{textAlign:"center",padding:"50px 0 20px"}} className="muted">Powered by <b>IZIRA</b></footer>}
  </main>
}

import { notFound } from "next/navigation";
import Storefront from "@/components/Storefront";
import ServiceBooking from "@/components/ServiceBooking";
import { supabasePublic } from "@/lib/supabase-public";

const reserved=new Set(["kadai","dashboard","login","signup","pricing","about","admin","api","onboarding","auth","support","settings","orders","products","customers","checkout","terms","privacy"]);

export default async function StorePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const normalized=slug.toLowerCase();
  if(reserved.has(normalized)) notFound();

  const {data:business,error:businessError}=await supabasePublic
    .from("businesses")
    .select("id,name,slug,description,whatsapp,plan,business_mode,is_active,bank_name,account_name,account_number,pickup_address,pickup_enabled,delivery_enabled,hide_izira_branding")
    .eq("slug",normalized)
    .eq("is_active",true)
    .single();

  if(businessError||!business) notFound();

  const mode=business.business_mode||"products";
  const wantsProducts=mode==="products"||mode==="both";
  const wantsAppointments=mode==="appointments"||mode==="both";
  const [{data:products,error:productsError},{data:slots},{data:campaigns},{data:services,error:servicesError}]=await Promise.all([
    wantsProducts?supabasePublic.from("products").select("id,name,description,price,stock_limit,is_active").eq("business_id",business.id).eq("is_active",true).order("created_at",{ascending:true}):Promise.resolve({data:[],error:null}),
    wantsProducts?supabasePublic.from("availability_slots").select("id,slot_date,label,fulfilment,capacity,is_active").eq("business_id",business.id).eq("is_active",true).gte("slot_date",new Date().toISOString().slice(0,10)).order("slot_date",{ascending:true}):Promise.resolve({data:[]}),
    wantsProducts?supabasePublic.from("preorder_campaigns").select("id,name,closes_at,collection_start,collection_end,order_limit,is_active").eq("business_id",business.id).eq("is_active",true).order("created_at",{ascending:false}).limit(1):Promise.resolve({data:[]}),
    wantsAppointments?supabasePublic.from("services").select("id,name,description,price,duration_minutes,buffer_minutes,deposit_amount,is_active").eq("business_id",business.id).eq("is_active",true).order("created_at",{ascending:true}):Promise.resolve({data:[],error:null})
  ]);

  if(productsError) throw productsError;
  if(servicesError) throw servicesError;
  const campaign=campaigns?.[0]||null;
  const canHideBranding=["pro","business"].includes(business.plan)&&business.hide_izira_branding;

  return <main className="shell">
    <div className="store-head">
      <div className="logo">{business.name.split(/\s+/).slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}</div>
      <div>
        <div className="eyebrow">izira.xyz/{business.slug}</div>
        <h1 style={{margin:"4px 0"}}>{business.name}</h1>
        <div className="muted">{business.description||"Shop or book directly with this business"}</div>
      </div>
    </div>

    {mode==="both"&&<div className="store-mode-tabs"><a href="#shop">Shop</a><a href="#book">Book an appointment</a></div>}

    {wantsProducts&&<section id="shop">
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
        sellerWhatsApp={business.whatsapp}
        businessName={business.name}
      />
    </section>}

    {wantsAppointments&&<section id="book" className="section">
      <div style={{marginBottom:20}}><div className="eyebrow">APPOINTMENTS</div><h2 style={{fontSize:36,margin:"6px 0"}}>Book a service</h2><p className="muted">Choose a service and request a time. The seller will confirm your appointment.</p></div>
      <ServiceBooking
        slug={business.slug}
        businessName={business.name}
        businessWhatsApp={business.whatsapp}
        services={(services||[]).map((s:any)=>({...s,price:Number(s.price),deposit_amount:s.deposit_amount==null?null:Number(s.deposit_amount)}))}
      />
    </section>}

    {business.whatsapp&&<div style={{textAlign:"center",padding:"24px 0"}}><a className="btn secondary" href={`https://wa.me/${String(business.whatsapp).replace(/\D/g,"")}`} target="_blank" rel="noreferrer">Contact {business.name} on WhatsApp</a></div>}
    {!canHideBranding&&<footer style={{textAlign:"center",padding:"50px 0 20px"}} className="muted">Powered by <b>KADAI</b></footer>}
  </main>
}

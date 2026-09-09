import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, content-type, apikey',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return json({error:'Method not allowed'},405)
  try{
    const authHeader=req.headers.get('authorization')||''
    const token=authHeader.replace(/^Bearer\s+/i,'')
    if(!token)return json({error:'Unauthorized'},401)

    const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}')
    const serviceKey=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if(!serviceKey)throw new Error('Server key unavailable')
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,serviceKey)
    const {data:userData,error:userError}=await supabase.auth.getUser(token)
    if(userError||!userData.user)return json({error:'Unauthorized'},401)

    const body=await req.json()
    const wabaId=String(body?.waba_id||'').trim()
    const phoneNumberId=String(body?.phone_number_id||'').trim()
    const accessToken=String(body?.access_token||'').trim()
    if(!wabaId||!phoneNumberId||!accessToken)return json({error:'WhatsApp Business Account ID, phone number ID and access token are required.'},400)

    const {data:business,error:businessError}=await supabase.from('businesses').select('id,name').eq('owner_id',userData.user.id).order('created_at').limit(1).maybeSingle()
    if(businessError||!business)return json({error:'Business not found.'},404)

    const graphVersion=Deno.env.get('META_GRAPH_VERSION')||'v23.0'
    const verifyResponse=await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`,{
      headers:{Authorization:`Bearer ${accessToken}`}
    })
    const verifyJson=await verifyResponse.json()
    if(!verifyResponse.ok)return json({error:'Meta rejected these WhatsApp credentials.',details:verifyJson?.error?.message||null},400)

    const {data:connectionId,error:secretError}=await supabase.rpc('store_whatsapp_connection_secret',{
      p_business_id:business.id,
      p_access_token:accessToken,
      p_waba_id:wabaId,
      p_phone_number_id:phoneNumberId,
      p_display_phone_number:verifyJson?.display_phone_number||null
    })
    if(secretError||!connectionId)throw secretError||new Error('Unable to store WhatsApp connection')

    const defaults=['order_confirmed','order_ready','appointment_confirmed','appointment_reminder','transport_picked_up','transport_dropped_off','runner_collected','runner_delivered'].map(event_key=>({
      business_id:business.id,event_key,enabled:false,template_name:'kadai_transaction_update',language_code:'en'
    }))
    await supabase.from('whatsapp_automations').upsert(defaults,{onConflict:'business_id,event_key',ignoreDuplicates:true})

    return json({connected:true,connection_id:connectionId,display_phone_number:verifyJson?.display_phone_number||null,verified_name:verifyJson?.verified_name||null})
  }catch(error){
    console.error(error)
    return json({error:'Unable to connect WhatsApp Business.'},500)
  }
})

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, content-type, apikey',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})
const digits=(value:string)=>String(value||'').replace(/\D/g,'')
const when=(value:string)=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Brunei',dateStyle:'medium',timeStyle:'short'}).format(new Date(value))

const allowedEvents=new Set(['order_confirmed','order_ready','appointment_confirmed','appointment_reminder','transport_picked_up','transport_dropped_off','runner_collected','runner_delivered'])

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
    const eventKey=String(body?.event_key||'')
    const manual=body?.manual!==false
    if(!allowedEvents.has(eventKey))return json({error:'Unsupported WhatsApp event.'},400)

    const {data:business,error:businessError}=await supabase.from('businesses').select('id,name').eq('owner_id',userData.user.id).order('created_at').limit(1).maybeSingle()
    if(businessError||!business)return json({error:'Business not found.'},404)

    let recipient=''
    let customerName='Customer'
    let updateText=''
    let detailText=''
    let statusUpdated=false

    if(eventKey.startsWith('transport_')||eventKey.startsWith('runner_')||eventKey.startsWith('appointment_')){
      const appointmentId=String(body?.appointment_id||'')
      if(!appointmentId)return json({error:'appointment_id is required.'},400)
      const {data:a,error:aError}=await supabase.from('appointments')
        .select('id,business_id,service_id,customer_name,customer_phone,starts_at,booking_kind,pickup_location,destination,passenger_name,journey_status')
        .eq('id',appointmentId).eq('business_id',business.id).single()
      if(aError||!a)return json({error:'Booking not found.'},404)
      recipient=digits(a.customer_phone)
      customerName=a.customer_name
      const passenger=String(a.passenger_name||'Passenger').trim()
      const destination=String(a.destination||'the destination').trim()
      const pickup=String(a.pickup_location||'the pickup location').trim()

      if(eventKey==='transport_picked_up'){
        updateText=`${passenger} has been picked up and is on the way.`
        detailText=`Destination: ${destination}. Pickup time: ${when(a.starts_at)}.`
        await supabase.from('appointments').update({journey_status:'picked_up'}).eq('id',a.id)
        statusUpdated=true
      } else if(eventKey==='transport_dropped_off'){
        updateText=`${passenger} has safely arrived.`
        detailText=`Dropped off at ${destination}.`
        await supabase.from('appointments').update({journey_status:'dropped_off'}).eq('id',a.id)
        statusUpdated=true
      } else if(eventKey==='runner_collected'){
        updateText='Your item has been collected.'
        detailText=`Collected from ${pickup}. Destination: ${destination}.`
        await supabase.from('appointments').update({journey_status:'picked_up'}).eq('id',a.id)
        statusUpdated=true
      } else if(eventKey==='runner_delivered'){
        updateText='Your item has been delivered.'
        detailText=`Delivered to ${destination}.`
        await supabase.from('appointments').update({journey_status:'dropped_off'}).eq('id',a.id)
        statusUpdated=true
      } else if(eventKey==='appointment_confirmed'){
        updateText='Your appointment is confirmed.'
        detailText=`Date & time: ${when(a.starts_at)}.`
      } else if(eventKey==='appointment_reminder'){
        updateText='Reminder for your upcoming appointment.'
        detailText=`Date & time: ${when(a.starts_at)}.`
      }
    } else {
      const orderId=String(body?.order_id||'')
      if(!orderId)return json({error:'order_id is required.'},400)
      const {data:o,error:oError}=await supabase.from('orders').select('id,business_id,order_number,customer_name,customer_phone,collection_at').eq('id',orderId).eq('business_id',business.id).single()
      if(oError||!o)return json({error:'Order not found.'},404)
      recipient=digits(o.customer_phone)
      customerName=o.customer_name
      if(eventKey==='order_confirmed'){
        updateText=`Order #${o.order_number} is confirmed.`
        detailText=o.collection_at?`Collection: ${when(o.collection_at)}.`:'We will update you when it is ready.'
      } else if(eventKey==='order_ready'){
        updateText=`Order #${o.order_number} is ready.`
        detailText=o.collection_at?`Collection: ${when(o.collection_at)}.`:'Please contact the seller for collection details.'
      }
    }

    if(!recipient)return json({error:'Customer WhatsApp number is missing.'},400)

    const {data:automation}=await supabase.from('whatsapp_automations').select('enabled,template_name,language_code').eq('business_id',business.id).eq('event_key',eventKey).maybeSingle()
    if(!manual&&!automation?.enabled)return json({status_updated:statusUpdated,whatsapp_sent:false,reason:'automation_disabled'})

    const {data:connection}=await supabase.from('whatsapp_connections').select('id,status,phone_number_id').eq('business_id',business.id).maybeSingle()
    if(!connection||connection.status!=='connected'||!connection.phone_number_id)return json({status_updated:statusUpdated,whatsapp_sent:false,reason:'whatsapp_not_connected'})

    const {data:optIn}=await supabase.from('whatsapp_opt_ins').select('id').eq('business_id',business.id).eq('customer_phone',recipient).eq('purpose','transactional').is('revoked_at',null).maybeSingle()
    if(!optIn)return json({status_updated:statusUpdated,whatsapp_sent:false,reason:'no_transactional_opt_in'})

    const templateName=automation?.template_name||'kadai_transaction_update'
    const languageCode=automation?.language_code||'en'
    const parameters=[customerName,business.name,updateText,detailText].map(text=>({type:'text',text:String(text).slice(0,1024)}))
    const payload={
      messaging_product:'whatsapp',
      to:recipient,
      type:'template',
      template:{name:templateName,language:{code:languageCode},components:[{type:'body',parameters}]}
    }

    const {data:messageRow,error:messageError}=await supabase.from('whatsapp_messages').insert({
      business_id:business.id,connection_id:connection.id,event_key:eventKey,recipient,message_type:'template',template_name:templateName,language_code:languageCode,payload,status:'sending'
    }).select('id').single()
    if(messageError||!messageRow)throw messageError||new Error('Unable to create message log')

    const {data:accessToken,error:tokenError}=await supabase.rpc('get_whatsapp_connection_token',{p_connection_id:connection.id})
    if(tokenError||!accessToken)throw tokenError||new Error('WhatsApp access token unavailable')

    const graphVersion=Deno.env.get('META_GRAPH_VERSION')||'v23.0'
    const metaResponse=await fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(connection.phone_number_id)}/messages`,{
      method:'POST',
      headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    })
    const metaJson=await metaResponse.json()
    if(!metaResponse.ok){
      await supabase.from('whatsapp_messages').update({status:'failed',error_message:metaJson?.error?.message||'Meta send failed',failed_at:new Date().toISOString()}).eq('id',messageRow.id)
      return json({status_updated:statusUpdated,whatsapp_sent:false,reason:'meta_send_failed',details:metaJson?.error?.message||null},502)
    }

    const metaMessageId=metaJson?.messages?.[0]?.id||null
    await supabase.from('whatsapp_messages').update({status:'sent',meta_message_id:metaMessageId,sent_at:new Date().toISOString()}).eq('id',messageRow.id)
    return json({status_updated:statusUpdated,whatsapp_sent:true,message_id:messageRow.id,meta_message_id:metaMessageId})
  }catch(error){
    console.error(error)
    return json({error:'Unable to send WhatsApp update.'},500)
  }
})

import { createClient } from 'npm:@supabase/supabase-js@2'

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}})

async function verifySignature(raw:string,signatureHeader:string|null,secret:string){
  if(!signatureHeader?.startsWith('sha256='))return false
  const expected=signatureHeader.slice(7)
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(raw))
  const actual=Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('')
  if(actual.length!==expected.length)return false
  let diff=0
  for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i)
  return diff===0
}

Deno.serve(async(req:Request)=>{
  const url=new URL(req.url)
  if(req.method==='GET'){
    const mode=url.searchParams.get('hub.mode')
    const token=url.searchParams.get('hub.verify_token')
    const challenge=url.searchParams.get('hub.challenge')
    const verifyToken=Deno.env.get('WHATSAPP_VERIFY_TOKEN')
    if(mode==='subscribe'&&verifyToken&&token===verifyToken&&challenge)return new Response(challenge,{status:200})
    return new Response('Forbidden',{status:403})
  }
  if(req.method!=='POST')return new Response('Method not allowed',{status:405})

  try{
    const raw=await req.text()
    const appSecret=Deno.env.get('META_APP_SECRET')
    if(!appSecret)return json({error:'META_APP_SECRET is not configured.'},503)
    const valid=await verifySignature(raw,req.headers.get('x-hub-signature-256'),appSecret)
    if(!valid)return json({error:'Invalid signature.'},401)

    const payload=JSON.parse(raw)
    const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}')
    const serviceKey=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if(!serviceKey)throw new Error('Server key unavailable')
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,serviceKey)

    for(const entry of payload?.entry||[]){
      for(const change of entry?.changes||[]){
        const value=change?.value||{}
        const phoneNumberId=String(value?.metadata?.phone_number_id||'')
        const {data:connection}=phoneNumberId?await supabase.from('whatsapp_connections').select('id,business_id').eq('phone_number_id',phoneNumberId).maybeSingle():{data:null}

        for(const status of value?.statuses||[]){
          const metaId=String(status?.id||'')
          const state=String(status?.status||'')
          if(!metaId||!['sent','delivered','read','failed'].includes(state))continue
          const updates:any={status:state}
          const stamp=status?.timestamp?new Date(Number(status.timestamp)*1000).toISOString():new Date().toISOString()
          if(state==='sent')updates.sent_at=stamp
          if(state==='delivered')updates.delivered_at=stamp
          if(state==='read')updates.read_at=stamp
          if(state==='failed'){
            updates.failed_at=stamp
            updates.error_message=status?.errors?.[0]?.title||status?.errors?.[0]?.message||'WhatsApp delivery failed'
          }
          await supabase.from('whatsapp_messages').update(updates).eq('meta_message_id',metaId)
        }

        if(connection){
          for(const message of value?.messages||[]){
            const metaId=String(message?.id||'')
            if(!metaId)continue
            const messageType=String(message?.type||'unknown')
            let body:string|null=null
            if(messageType==='text')body=message?.text?.body||null
            else if(messageType==='button')body=message?.button?.text||null
            else if(messageType==='interactive')body=message?.interactive?.button_reply?.title||message?.interactive?.list_reply?.title||null
            await supabase.from('whatsapp_inbound_messages').upsert({
              business_id:connection.business_id,
              connection_id:connection.id,
              meta_message_id:metaId,
              sender:String(message?.from||''),
              message_type:messageType,
              body,
              payload:message,
              received_at:message?.timestamp?new Date(Number(message.timestamp)*1000).toISOString():new Date().toISOString()
            },{onConflict:'meta_message_id'})
          }
        }
      }
    }
    return json({received:true})
  }catch(error){
    console.error(error)
    return json({error:'Webhook processing failed.'},500)
  }
})

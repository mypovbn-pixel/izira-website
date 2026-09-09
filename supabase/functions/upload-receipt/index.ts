import { createClient } from 'npm:@supabase/supabase-js@2'

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'content-type, apikey',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
  if(req.method!=='POST') return json({error:'Method not allowed'},405)
  try{
    const {order_id,customer_phone,file_name,mime_type,data_base64}=await req.json()
    if(!order_id||!customer_phone||!file_name||!mime_type||!data_base64) return json({error:'Missing receipt details'},400)
    if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(mime_type)) return json({error:'Unsupported receipt type'},400)
    const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}')
    const secretKey=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if(!secretKey) throw new Error('Server key unavailable')
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,secretKey)
    const {data:order,error:orderError}=await supabase.from('orders').select('id,business_id,customer_phone,payment_status').eq('id',order_id).single()
    if(orderError||!order||order.customer_phone!==String(customer_phone).trim()) return json({error:'Order verification failed'},403)
    const clean=String(data_base64).replace(/^data:[^;]+;base64,/,'')
    const bytes=Uint8Array.from(atob(clean),c=>c.charCodeAt(0))
    if(bytes.byteLength>5*1024*1024) return json({error:'Receipt must be 5 MB or smaller'},413)
    const ext=(String(file_name).split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').toLowerCase()
    const path=`${order.business_id}/${order.id}/${crypto.randomUUID()}.${ext}`
    const {error:uploadError}=await supabase.storage.from('payment-receipts').upload(path,bytes,{contentType:mime_type,upsert:false})
    if(uploadError) throw uploadError
    const {error:receiptError}=await supabase.from('payment_receipts').insert({business_id:order.business_id,order_id:order.id,storage_path:path})
    if(receiptError){await supabase.storage.from('payment-receipts').remove([path]);throw receiptError}
    await supabase.from('orders').update({payment_status:'receipt_uploaded'}).eq('id',order.id)
    return json({ok:true,payment_status:'receipt_uploaded'})
  }catch(error){console.error(error);return json({error:'Unable to upload receipt'},500)}
})

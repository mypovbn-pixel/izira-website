import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'content-type, apikey',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return json({error:'Method not allowed'},405)
  try{
    const body=await req.json()
    const {slug,service_id,customer_name,customer_phone,starts_at,note}=body??{}
    if(!slug||!service_id||!customer_name||!customer_phone||!starts_at)return json({error:'Complete the booking details.'},400)

    const start=new Date(starts_at)
    if(Number.isNaN(start.getTime())||start.getTime()<Date.now()-60000)return json({error:'Choose a future date and time.'},400)

    const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}')
    const secretKey=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if(!secretKey)throw new Error('Server key unavailable')
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,secretKey)

    const {data:business,error:businessError}=await supabase.from('businesses')
      .select('id,name,slug,is_active,business_mode,whatsapp,bank_name,account_name,account_number')
      .eq('slug',String(slug).toLowerCase()).eq('is_active',true).single()
    if(businessError||!business)return json({error:'Business not found.'},404)
    if(!['appointments','both'].includes(business.business_mode))return json({error:'Appointments are not enabled for this business.'},400)

    const {data:service,error:serviceError}=await supabase.from('services')
      .select('id,name,price,duration_minutes,buffer_minutes,deposit_amount,is_active')
      .eq('id',service_id).eq('business_id',business.id).eq('is_active',true).single()
    if(serviceError||!service)return json({error:'That service is unavailable.'},400)

    const end=new Date(start.getTime()+Number(service.duration_minutes)*60000)
    const blockEnd=new Date(end.getTime()+Number(service.buffer_minutes||0)*60000)
    const {data:conflicts,error:conflictError}=await supabase.from('appointments')
      .select('id,starts_at,ends_at,appointment_status')
      .eq('business_id',business.id)
      .neq('appointment_status','cancelled')
      .lt('starts_at',blockEnd.toISOString())
      .gt('ends_at',start.toISOString())
      .limit(1)
    if(conflictError)throw conflictError
    if(conflicts&&conflicts.length)return json({error:'That time is no longer available. Please choose another.'},409)

    const total=Number(service.price)
    const deposit=service.deposit_amount==null?null:Number(service.deposit_amount)
    const {data:appointment,error:appointmentError}=await supabase.from('appointments').insert({
      business_id:business.id,
      service_id:service.id,
      customer_name:String(customer_name).trim().slice(0,120),
      customer_phone:String(customer_phone).trim().slice(0,40),
      starts_at:start.toISOString(),
      ends_at:end.toISOString(),
      total,
      note:note?String(note).trim().slice(0,1000):null,
      appointment_status:'pending',
      payment_status:'awaiting_payment'
    }).select('id,customer_name,customer_phone,starts_at,ends_at,total,payment_status,appointment_status').single()
    if(appointmentError||!appointment)throw appointmentError||new Error('Booking creation failed')

    return json({
      appointment,
      service:{id:service.id,name:service.name,duration_minutes:service.duration_minutes,price:total,deposit_amount:deposit},
      business:{name:business.name,whatsapp:business.whatsapp},
      payment:{bank_name:business.bank_name,account_name:business.account_name,account_number:business.account_number,deposit_amount:deposit}
    })
  }catch(error){
    console.error(error)
    return json({error:'Unable to create appointment.'},500)
  }
})

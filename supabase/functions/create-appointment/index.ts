import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'content-type, apikey, authorization',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})
const weekdayMap:Record<string,number>={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}
function bruneiParts(date:Date){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Brunei',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date)
  const weekday=weekdayMap[parts.find(p=>p.type==='weekday')?.value||'Sun']
  const hour=Number(parts.find(p=>p.type==='hour')?.value||0)
  const minute=Number(parts.find(p=>p.type==='minute')?.value||0)
  return {weekday,minutes:hour*60+minute}
}
function timeToMinutes(value:string){const [h,m]=String(value).split(':').map(Number);return h*60+m}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return json({error:'Method not allowed'},405)
  try{
    const body=await req.json()
    const {slug,service_id,customer_name,customer_phone,starts_at,note}=body??{}
    if(!slug||!service_id||!customer_name||!customer_phone||!starts_at)return json({error:'Complete the booking details.'},400)

    const start=new Date(starts_at)
    if(Number.isNaN(start.getTime())||start.getTime()<Date.now()+5*60000)return json({error:'Choose a time at least 5 minutes from now.'},400)

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

    const {data:availability,error:availabilityError}=await supabase.from('appointment_availability')
      .select('weekday,start_time,end_time').eq('business_id',business.id).eq('is_active',true)
    if(availabilityError)throw availabilityError
    if(availability&&availability.length){
      const startLocal=bruneiParts(start), endLocal=bruneiParts(end)
      if(startLocal.weekday!==endLocal.weekday)return json({error:'This service must fit within one available business day.'},409)
      const fits=availability.some((a:any)=>a.weekday===startLocal.weekday&&startLocal.minutes>=timeToMinutes(a.start_time)&&endLocal.minutes<=timeToMinutes(a.end_time))
      if(!fits)return json({error:'That time is outside this business’s appointment hours.'},409)
    }

    const {data:blocks,error:blockError}=await supabase.from('appointment_blocks')
      .select('id').eq('business_id',business.id).lt('starts_at',blockEnd.toISOString()).gt('ends_at',start.toISOString()).limit(1)
    if(blockError)throw blockError
    if(blocks&&blocks.length)return json({error:'That time is blocked by the seller. Please choose another.'},409)

    const lookback=new Date(start.getTime()-24*60*60000)
    const {data:candidates,error:conflictError}=await supabase.from('appointments')
      .select('id,service_id,starts_at,ends_at,appointment_status')
      .eq('business_id',business.id).neq('appointment_status','cancelled')
      .lt('starts_at',blockEnd.toISOString()).gt('ends_at',lookback.toISOString())
    if(conflictError)throw conflictError
    if(candidates&&candidates.length){
      const serviceIds=[...new Set(candidates.map((c:any)=>c.service_id).filter(Boolean))]
      const {data:buffers}=serviceIds.length?await supabase.from('services').select('id,buffer_minutes').in('id',serviceIds):{data:[] as any[]}
      const bufferMap=new Map((buffers||[]).map((s:any)=>[s.id,Number(s.buffer_minutes||0)]))
      const overlap=candidates.some((c:any)=>{
        const existingStart=new Date(c.starts_at)
        const existingEnd=new Date(new Date(c.ends_at).getTime()+(bufferMap.get(c.service_id)||0)*60000)
        return existingStart<blockEnd&&existingEnd>start
      })
      if(overlap)return json({error:'That time is no longer available. Please choose another.'},409)
    }

    const total=Number(service.price)
    const deposit=service.deposit_amount==null?null:Number(service.deposit_amount)
    const {data:appointment,error:appointmentError}=await supabase.from('appointments').insert({
      business_id:business.id,service_id:service.id,
      customer_name:String(customer_name).trim().slice(0,120),customer_phone:String(customer_phone).trim().slice(0,40),
      starts_at:start.toISOString(),ends_at:end.toISOString(),total,
      note:note?String(note).trim().slice(0,1000):null,appointment_status:'pending',payment_status:'awaiting_payment'
    }).select('id,customer_name,customer_phone,starts_at,ends_at,total,payment_status,appointment_status').single()
    if(appointmentError||!appointment)throw appointmentError||new Error('Booking creation failed')

    return json({appointment,service:{id:service.id,name:service.name,duration_minutes:service.duration_minutes,price:total,deposit_amount:deposit},business:{name:business.name,whatsapp:business.whatsapp},payment:{bank_name:business.bank_name,account_name:business.account_name,account_number:business.account_number,deposit_amount:deposit}})
  }catch(error){console.error(error);return json({error:'Unable to create appointment.'},500)}
})
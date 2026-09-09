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
  return {weekday:weekdayMap[parts.find(p=>p.type==='weekday')?.value||'Sun'],minutes:Number(parts.find(p=>p.type==='hour')?.value||0)*60+Number(parts.find(p=>p.type==='minute')?.value||0)}
}
function timeToMinutes(value:string){const [h,m]=String(value).split(':').map(Number);return h*60+m}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return json({error:'Method not allowed'},405)
  try{
    const {appointment_id,starts_at}=await req.json()
    if(!appointment_id||!starts_at)return json({error:'Appointment and new time are required.'},400)
    const start=new Date(starts_at)
    if(Number.isNaN(start.getTime())||start.getTime()<Date.now()+5*60000)return json({error:'Choose a future date and time.'},400)

    const authHeader=req.headers.get('authorization')||''
    const token=authHeader.replace(/^Bearer\s+/i,'')
    if(!token)return json({error:'Unauthorized'},401)

    const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}')
    const secretKey=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,secretKey)
    const {data:userData,error:userError}=await supabase.auth.getUser(token)
    if(userError||!userData.user)return json({error:'Unauthorized'},401)

    const {data:appointment,error:appointmentError}=await supabase.from('appointments')
      .select('id,business_id,service_id,appointment_status,reschedule_count').eq('id',appointment_id).single()
    if(appointmentError||!appointment)return json({error:'Appointment not found.'},404)
    if(appointment.appointment_status==='cancelled')return json({error:'Cancelled appointments cannot be rescheduled.'},409)

    const {data:business}=await supabase.from('businesses').select('id,owner_id').eq('id',appointment.business_id).single()
    if(!business||business.owner_id!==userData.user.id)return json({error:'Forbidden'},403)

    const {data:service}=await supabase.from('services').select('id,duration_minutes,buffer_minutes').eq('id',appointment.service_id).eq('business_id',business.id).single()
    if(!service)return json({error:'Service not found.'},400)
    const end=new Date(start.getTime()+Number(service.duration_minutes)*60000)
    const blockEnd=new Date(end.getTime()+Number(service.buffer_minutes||0)*60000)

    const {data:availability,error:availabilityError}=await supabase.from('appointment_availability').select('weekday,start_time,end_time').eq('business_id',business.id).eq('is_active',true)
    if(availabilityError)throw availabilityError
    if(availability&&availability.length){
      const s=bruneiParts(start),e=bruneiParts(end)
      const fits=s.weekday===e.weekday&&availability.some((a:any)=>a.weekday===s.weekday&&s.minutes>=timeToMinutes(a.start_time)&&e.minutes<=timeToMinutes(a.end_time))
      if(!fits)return json({error:'That time is outside your appointment hours.'},409)
    }

    const {data:blocks}=await supabase.from('appointment_blocks').select('id').eq('business_id',business.id).lt('starts_at',blockEnd.toISOString()).gt('ends_at',start.toISOString()).limit(1)
    if(blocks&&blocks.length)return json({error:'That time is blocked.'},409)

    const lookback=new Date(start.getTime()-24*60*60000)
    const {data:candidates,error:conflictError}=await supabase.from('appointments')
      .select('id,service_id,starts_at,ends_at').eq('business_id',business.id).neq('id',appointment.id).neq('appointment_status','cancelled')
      .lt('starts_at',blockEnd.toISOString()).gt('ends_at',lookback.toISOString())
    if(conflictError)throw conflictError
    if(candidates&&candidates.length){
      const ids=[...new Set(candidates.map((c:any)=>c.service_id).filter(Boolean))]
      const {data:buffers}=ids.length?await supabase.from('services').select('id,buffer_minutes').in('id',ids):{data:[] as any[]}
      const map=new Map((buffers||[]).map((s:any)=>[s.id,Number(s.buffer_minutes||0)]))
      if(candidates.some((c:any)=>new Date(c.starts_at)<blockEnd&&new Date(new Date(c.ends_at).getTime()+(map.get(c.service_id)||0)*60000)>start))return json({error:'That time conflicts with another appointment.'},409)
    }

    const {data:updated,error:updateError}=await supabase.from('appointments').update({starts_at:start.toISOString(),ends_at:end.toISOString(),rescheduled_at:new Date().toISOString(),reschedule_count:Number(appointment.reschedule_count||0)+1}).eq('id',appointment.id).select('id,starts_at,ends_at,rescheduled_at,reschedule_count').single()
    if(updateError||!updated)throw updateError||new Error('Reschedule failed')
    return json({appointment:updated})
  }catch(error){console.error(error);return json({error:'Unable to reschedule appointment.'},500)}
})
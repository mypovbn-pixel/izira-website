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
function clean(value:unknown,max:number){return value==null?null:String(value).trim().slice(0,max)||null}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return json({error:'Method not allowed'},405)
  try{
    const body=await req.json()
    const {slug,service_id,customer_name,customer_phone,starts_at,note,pickup_location,destination,passenger_count,item_description,trip_direction,return_at,recurrence_type,recurring_until,recurrence_weekdays}=body??{}
    if(!slug||!service_id||!customer_name||!customer_phone||!starts_at)return json({error:'Complete the booking details.'},400)

    const firstStart=new Date(starts_at)
    if(Number.isNaN(firstStart.getTime())||firstStart.getTime()<Date.now()+5*60000)return json({error:'Choose a time at least 5 minutes from now.'},400)

    const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}')
    const secretKey=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if(!secretKey)throw new Error('Server key unavailable')
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,secretKey)

    const {data:business,error:businessError}=await supabase.from('businesses')
      .select('id,name,slug,is_active,business_mode,whatsapp,bank_name,account_name,account_number')
      .eq('slug',String(slug).toLowerCase()).eq('is_active',true).single()
    if(businessError||!business)return json({error:'Business not found.'},404)
    if(!['appointments','both'].includes(business.business_mode))return json({error:'Services are not enabled for this business.'},400)

    const {data:service,error:serviceError}=await supabase.from('services')
      .select('id,name,price,duration_minutes,buffer_minutes,deposit_amount,is_active,service_kind,pricing_mode,max_passengers')
      .eq('id',service_id).eq('business_id',business.id).eq('is_active',true).single()
    if(serviceError||!service)return json({error:'That service is unavailable.'},400)

    const kind=String(service.service_kind||'appointment')
    if(['runner','transport'].includes(kind)){
      if(!String(pickup_location||'').trim()||!String(destination||'').trim())return json({error:'Pickup and destination are required.'},400)
      if(kind==='transport'){
        const passengers=Number(passenger_count||1)
        if(!Number.isInteger(passengers)||passengers<1)return json({error:'Enter a valid passenger count.'},400)
        if(service.max_passengers&&passengers>Number(service.max_passengers))return json({error:`This service allows up to ${service.max_passengers} passengers.`},400)
      }
      if(kind==='runner'&&!String(item_description||'').trim())return json({error:'Tell the runner what needs to be collected or delivered.'},400)
    }

    const requestedRecurring=recurrence_type==='recurring'&&['runner','transport'].includes(kind)
    let starts:Date[]=[firstStart]
    let weekdays:number[]=[]
    let untilDate:string|null=null
    if(requestedRecurring){
      weekdays=Array.isArray(recurrence_weekdays)?[...new Set(recurrence_weekdays.map(Number).filter((d:number)=>Number.isInteger(d)&&d>=0&&d<=6))]:[]
      if(!weekdays.length)return json({error:'Choose at least one recurring day.'},400)
      if(!recurring_until)return json({error:'Choose when the recurring booking ends.'},400)
      const until=new Date(`${String(recurring_until).slice(0,10)}T23:59:59+08:00`)
      if(Number.isNaN(until.getTime())||until<=firstStart)return json({error:'Recurring end date must be after the first trip.'},400)
      if(until.getTime()-firstStart.getTime()>62*86400000)return json({error:'Recurring bookings can cover up to 62 days at a time.'},400)
      untilDate=String(recurring_until).slice(0,10)
      starts=[]
      for(let d=new Date(firstStart);d<=until;d=new Date(d.getTime()+86400000)){
        if(weekdays.includes(bruneiParts(d).weekday))starts.push(new Date(d))
        if(starts.length>50)return json({error:'Too many recurring trips. Please shorten the date range.'},400)
      }
      if(!starts.length)return json({error:'No recurring trips match those days.'},400)
    }

    const {data:availability,error:availabilityError}=await supabase.from('appointment_availability')
      .select('weekday,start_time,end_time').eq('business_id',business.id).eq('is_active',true)
    if(availabilityError)throw availabilityError

    async function validateSlot(start:Date){
      const end=new Date(start.getTime()+Number(service.duration_minutes)*60000)
      const blockEnd=new Date(end.getTime()+Number(service.buffer_minutes||0)*60000)
      if(availability&&availability.length){
        const s=bruneiParts(start),e=bruneiParts(end)
        const fits=s.weekday===e.weekday&&availability.some((a:any)=>a.weekday===s.weekday&&s.minutes>=timeToMinutes(a.start_time)&&e.minutes<=timeToMinutes(a.end_time))
        if(!fits)return 'That time is outside this business’s service hours.'
      }
      const {data:blocks,error:blockError}=await supabase.from('appointment_blocks')
        .select('id').eq('business_id',business.id).lt('starts_at',blockEnd.toISOString()).gt('ends_at',start.toISOString()).limit(1)
      if(blockError)throw blockError
      if(blocks&&blocks.length)return 'That time is blocked by the seller.'

      const lookback=new Date(start.getTime()-24*60*60000)
      const {data:candidates,error:conflictError}=await supabase.from('appointments')
        .select('id,service_id,starts_at,ends_at,appointment_status').eq('business_id',business.id).neq('appointment_status','cancelled')
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
        if(overlap)return 'That time is no longer available.'
      }
      return null
    }

    for(const start of starts){
      const slotError=await validateSlot(start)
      if(slotError)return json({error:`${slotError} ${requestedRecurring?'One of the recurring dates conflicts.':''}`.trim()},409)
    }

    const seriesId=requestedRecurring?crypto.randomUUID():null
    const price=Number(service.price)
    const deposit=service.deposit_amount==null?null:Number(service.deposit_amount)
    const quoteMode=service.pricing_mode==='quote'
    const returnDate=return_at?new Date(return_at):null
    if(returnDate&&Number.isNaN(returnDate.getTime()))return json({error:'Return time is invalid.'},400)

    const rows=starts.map(start=>({
      business_id:business.id,
      service_id:service.id,
      customer_name:String(customer_name).trim().slice(0,120),
      customer_phone:String(customer_phone).trim().slice(0,40),
      starts_at:start.toISOString(),
      ends_at:new Date(start.getTime()+Number(service.duration_minutes)*60000).toISOString(),
      total:quoteMode?0:price,
      note:clean(note,1000),
      appointment_status:'pending',
      payment_status:quoteMode?'quote_pending':'awaiting_payment',
      booking_kind:kind,
      pickup_location:clean(pickup_location,500),
      destination:clean(destination,500),
      passenger_count:kind==='transport'?Number(passenger_count||1):null,
      item_description:kind==='runner'?clean(item_description,1000):null,
      trip_direction:['one_way','return'].includes(trip_direction)?trip_direction:null,
      return_at:returnDate?returnDate.toISOString():null,
      series_id:seriesId,
      recurring_until:requestedRecurring?untilDate:null,
      recurrence_weekdays:requestedRecurring?weekdays:null
    }))

    const {data:appointments,error:appointmentError}=await supabase.from('appointments').insert(rows)
      .select('id,customer_name,customer_phone,starts_at,ends_at,total,payment_status,appointment_status,booking_kind,pickup_location,destination,passenger_count,item_description,trip_direction,return_at,series_id,recurring_until,recurrence_weekdays')
    if(appointmentError||!appointments?.length)throw appointmentError||new Error('Booking creation failed')

    return json({
      appointment:appointments[0],appointments,
      occurrence_count:appointments.length,
      service:{id:service.id,name:service.name,duration_minutes:service.duration_minutes,price,deposit_amount:deposit,service_kind:kind,pricing_mode:service.pricing_mode},
      business:{name:business.name,whatsapp:business.whatsapp},
      payment:{bank_name:business.bank_name,account_name:business.account_name,account_number:business.account_number,deposit_amount:deposit}
    })
  }catch(error){console.error(error);return json({error:'Unable to create booking.'},500)}
})
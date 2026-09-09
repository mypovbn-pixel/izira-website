import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' },405)

  try {
    const body = await req.json()
    const { slug, customer_name, customer_phone, fulfilment, slot_id, delivery_address, note, items } = body ?? {}
    if (!slug || !customer_name || !customer_phone || !['pickup','delivery'].includes(fulfilment) || !Array.isArray(items) || items.length === 0) return json({ error: 'Invalid order details' },400)

    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
    const secretKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) throw new Error('Server key unavailable')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, secretKey)

    const { data: business, error: businessError } = await supabase.from('businesses')
      .select('id,is_active,pickup_enabled,delivery_enabled,bank_name,account_name,account_number,pickup_address')
      .eq('slug', String(slug).toLowerCase()).eq('is_active', true).single()
    if (businessError || !business) return json({ error: 'Store not found' },404)
    if (fulfilment === 'pickup' && !business.pickup_enabled) return json({ error: 'Pickup is currently unavailable' },400)
    if (fulfilment === 'delivery' && !business.delivery_enabled) return json({ error: 'Delivery is currently unavailable' },400)
    if (fulfilment === 'delivery' && !String(delivery_address || '').trim()) return json({ error: 'Delivery address is required' },400)

    let collectionAt:null|string=null
    if (slot_id) {
      const { data: slot, error: slotError } = await supabase.from('availability_slots')
        .select('id,slot_date,label,fulfilment,capacity,is_active').eq('id',slot_id).eq('business_id',business.id).single()
      if (slotError || !slot || !slot.is_active || slot.fulfilment !== fulfilment) return json({ error: 'Selected collection slot is unavailable' },400)
      const dayStart = `${slot.slot_date}T00:00:00+08:00`
      const nextDay = new Date(new Date(dayStart).getTime()+86400000).toISOString()
      const { count } = await supabase.from('orders').select('id',{count:'exact',head:true}).eq('business_id',business.id).eq('fulfilment',fulfilment).gte('collection_at',dayStart).lt('collection_at',nextDay).neq('order_status','cancelled')
      if ((count || 0) >= slot.capacity) return json({ error: 'That slot has just sold out. Please choose another.' },409)
      collectionAt = `${slot.slot_date}T12:00:00+08:00`
    }

    const normalized = items.map((i: any) => ({ product_id: String(i.product_id || ''), quantity: Number(i.quantity || 0) })).filter((i: any) => i.product_id && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 50)
    if (normalized.length !== items.length) return json({ error: 'Invalid items' },400)

    const ids = [...new Set(normalized.map((i: any) => i.product_id))]
    const { data: products, error: productError } = await supabase.from('products').select('id,name,price,is_active,business_id,stock_limit').in('id', ids).eq('business_id', business.id).eq('is_active', true)
    if (productError || !products || products.length !== ids.length) return json({ error: 'One or more products are unavailable' },400)

    const byId = new Map(products.map((p: any) => [p.id, p]))
    for (const item of normalized) {
      const p:any=byId.get(item.product_id)
      if (p.stock_limit !== null && item.quantity > Number(p.stock_limit)) return json({ error: `${p.name} is limited to ${p.stock_limit} per order` },400)
    }

    const orderItems = normalized.map((i: any) => { const p: any = byId.get(i.product_id); return { product_id: p.id, product_name: p.name, unit_price: Number(p.price), quantity: i.quantity, options: {} } })
    const subtotal = orderItems.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0)
    const deliveryFee = fulfilment === 'delivery' ? 3 : 0
    const total = subtotal + deliveryFee

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      business_id: business.id,
      customer_name: String(customer_name).trim().slice(0,120),
      customer_phone: String(customer_phone).trim().slice(0,40),
      fulfilment,
      collection_at: collectionAt,
      delivery_address: fulfilment === 'delivery' ? String(delivery_address).trim().slice(0,500) : null,
      note: note ? String(note).trim().slice(0,1000) : null,
      subtotal, delivery_fee: deliveryFee, total
    }).select('id,order_number,total,payment_status,order_status').single()
    if (orderError || !order) throw orderError || new Error('Order creation failed')

    const { error: itemError } = await supabase.from('order_items').insert(orderItems.map((i: any) => ({ ...i, order_id: order.id })))
    if (itemError) { await supabase.from('orders').delete().eq('id', order.id); throw itemError }

    return json({ order, payment:{ bank_name:business.bank_name, account_name:business.account_name, account_number:business.account_number }, pickup_address: business.pickup_address })
  } catch (error) {
    console.error(error)
    return json({ error: 'Unable to create order' },500)
  }
})

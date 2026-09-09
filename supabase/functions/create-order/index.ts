import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const body = await req.json()
    const { slug, customer_name, customer_phone, fulfilment, collection_at, delivery_address, note, items } = body ?? {}
    if (!slug || !customer_name || !customer_phone || !['pickup','delivery'].includes(fulfilment) || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid order details' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
    const secretKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) throw new Error('Server key unavailable')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, secretKey)

    const { data: business, error: businessError } = await supabase.from('businesses').select('id,is_active').eq('slug', String(slug).toLowerCase()).eq('is_active', true).single()
    if (businessError || !business) return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const normalized = items.map((i: any) => ({ product_id: String(i.product_id || ''), quantity: Number(i.quantity || 0) })).filter((i: any) => i.product_id && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 50)
    if (normalized.length !== items.length) return new Response(JSON.stringify({ error: 'Invalid items' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const ids = [...new Set(normalized.map((i: any) => i.product_id))]
    const { data: products, error: productError } = await supabase.from('products').select('id,name,price,is_active,business_id').in('id', ids).eq('business_id', business.id).eq('is_active', true)
    if (productError || !products || products.length !== ids.length) return new Response(JSON.stringify({ error: 'One or more products are unavailable' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const byId = new Map(products.map((p: any) => [p.id, p]))
    const orderItems = normalized.map((i: any) => { const p: any = byId.get(i.product_id); return { product_id: p.id, product_name: p.name, unit_price: Number(p.price), quantity: i.quantity, options: {} } })
    const subtotal = orderItems.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0)
    const deliveryFee = fulfilment === 'delivery' ? 3 : 0
    const total = subtotal + deliveryFee

    const { data: order, error: orderError } = await supabase.from('orders').insert({ business_id: business.id, customer_name: String(customer_name).trim().slice(0,120), customer_phone: String(customer_phone).trim().slice(0,40), fulfilment, collection_at: collection_at || null, delivery_address: fulfilment === 'delivery' ? String(delivery_address || '').trim().slice(0,500) : null, note: note ? String(note).trim().slice(0,1000) : null, subtotal, delivery_fee: deliveryFee, total }).select('id,order_number,total,payment_status,order_status').single()
    if (orderError || !order) throw orderError || new Error('Order creation failed')

    const { error: itemError } = await supabase.from('order_items').insert(orderItems.map((i: any) => ({ ...i, order_id: order.id })))
    if (itemError) { await supabase.from('orders').delete().eq('id', order.id); throw itemError }

    return new Response(JSON.stringify({ order }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Unable to create order' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

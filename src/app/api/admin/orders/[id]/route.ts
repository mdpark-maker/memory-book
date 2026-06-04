import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OrderStatus } from '@/types'

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'mdpark12@gmail.com',
].filter(Boolean)

const VALID_STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

// Map order status → photobook status
const PHOTOBOOK_STATUS_MAP: Partial<Record<OrderStatus, string>> = {
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
}

interface RouteContext {
  params: Promise<{ id: string }>
}

async function validateAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  if (!ADMIN_EMAILS.includes(user.email)) return null
  return user
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()

  const admin = await validateAdmin(supabase)
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({ order })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()

  const admin = await validateAdmin(supabase)
  if (!admin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const body = await request.json()
  const { status, tracking_number } = body

  // Validate inputs
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: '유효하지 않은 상태값입니다.' }, { status: 400 })
  }

  // Fetch current order
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, photobook_id')
    .eq('id', id)
    .single()

  if (fetchError || !currentOrder) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {}

  if (status) {
    updates.status = status
    // Set timestamps
    if (status === 'shipped') updates.shipped_at = now
    if (status === 'delivered') updates.delivered_at = now
  }

  if (tracking_number !== undefined) {
    updates.tracking_number = tracking_number || null
  }

  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError || !order) {
    console.error('Order update error:', updateError)
    return NextResponse.json({ error: '주문 업데이트에 실패했습니다.' }, { status: 500 })
  }

  // Update photobook status if applicable
  if (status && currentOrder.photobook_id && PHOTOBOOK_STATUS_MAP[status as OrderStatus]) {
    const { error: pbError } = await supabase
      .from('photobooks')
      .update({ status: PHOTOBOOK_STATUS_MAP[status as OrderStatus] })
      .eq('id', currentOrder.photobook_id)

    if (pbError) {
      console.error('Photobook status update error:', pbError)
    }
  }

  return NextResponse.json({ order })
}

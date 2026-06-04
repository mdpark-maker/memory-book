import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pg_token = searchParams.get('pg_token')
  const orderId = searchParams.get('orderId')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!pg_token || !orderId) {
    return NextResponse.redirect(`${appUrl}/orders?error=missing_params`)
  }

  try {
    const supabase = await createClient()

    // Fetch order from DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, kakao_tid, user_id, photobook_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order fetch error:', orderError)
      return NextResponse.redirect(`${appUrl}/orders?error=order_not_found`)
    }

    if (!order.kakao_tid) {
      return NextResponse.redirect(`${appUrl}/orders?error=no_tid`)
    }

    if (order.status === 'paid') {
      // Already approved — idempotent redirect
      return NextResponse.redirect(`${appUrl}/orders/${orderId}?success=true`)
    }

    const secretKey = process.env.KAKAO_PAY_SECRET_KEY
    if (!secretKey) {
      return NextResponse.redirect(`${appUrl}/orders?error=config`)
    }

    // Call Kakao Pay Approve API
    const kakaoRes = await fetch('https://open-api.kakaopay.com/online/v1/payment/approve', {
      method: 'POST',
      headers: {
        'Authorization': `SECRET_KEY ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cid: 'TC0ONETIME',
        tid: order.kakao_tid,
        partner_order_id: orderId,
        partner_user_id: order.user_id,
        pg_token,
      }),
    })

    if (!kakaoRes.ok) {
      const kakaoError = await kakaoRes.json()
      console.error('Kakao Pay Approve error:', kakaoError)
      // Redirect back to checkout with error
      const { data: orderDetail } = await supabase
        .from('orders')
        .select('photobook_id')
        .eq('id', orderId)
        .single()
      const photobookId = orderDetail?.photobook_id
      return NextResponse.redirect(
        photobookId
          ? `${appUrl}/checkout/${photobookId}?error=true`
          : `${appUrl}/orders?error=payment_failed`
      )
    }

    const now = new Date().toISOString()

    // Update order status to 'paid'
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: now })
      .eq('id', orderId)

    if (updateOrderError) {
      console.error('Order status update error:', updateOrderError)
    }

    // Update photobook status to 'paid'
    const { error: updatePbError } = await supabase
      .from('photobooks')
      .update({ status: 'paid' })
      .eq('id', order.photobook_id)

    if (updatePbError) {
      console.error('Photobook status update error:', updatePbError)
    }

    return NextResponse.redirect(`${appUrl}/orders/${orderId}?success=true`)
  } catch (err) {
    console.error('Kakao Pay Approve unexpected error:', err)
    return NextResponse.redirect(`${appUrl}/orders?error=server_error`)
  }
}

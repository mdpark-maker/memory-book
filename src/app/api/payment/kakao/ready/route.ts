import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { photobookId, shipping_name, shipping_phone, shipping_address, shipping_detail } = body

    if (!photobookId || !shipping_name || !shipping_phone || !shipping_address) {
      return NextResponse.json({ error: '필수 정보가 누락됐습니다.' }, { status: 400 })
    }

    // Validate photobook belongs to user and is in 'ready' status
    const { data: photobook, error: pbError } = await supabase
      .from('photobooks')
      .select('id, status, user_id')
      .eq('id', photobookId)
      .single()

    if (pbError || !photobook) {
      return NextResponse.json({ error: '포토북을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (photobook.user_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    if (photobook.status !== 'ready') {
      return NextResponse.json({ error: '결제할 수 없는 포토북 상태입니다.' }, { status: 400 })
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        photobook_id: photobookId,
        user_id: user.id,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_detail: shipping_detail || null,
        status: 'pending',
        total_price: 15000,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: '주문 생성에 실패했습니다.' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const secretKey = process.env.KAKAO_PAY_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json({ error: '결제 설정 오류입니다.' }, { status: 500 })
    }

    // Call Kakao Pay Ready API
    const kakaoRes = await fetch('https://open-api.kakaopay.com/online/v1/payment/ready', {
      method: 'POST',
      headers: {
        'Authorization': `SECRET_KEY ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cid: 'TC0ONETIME',
        partner_order_id: order.id,
        partner_user_id: user.id,
        item_name: 'Memory Book 포토북',
        quantity: 1,
        total_amount: 15000,
        vat_amount: 0,
        tax_free_amount: 0,
        approval_url: `${appUrl}/api/payment/kakao/approve?orderId=${order.id}`,
        fail_url: `${appUrl}/checkout/${photobookId}?error=true`,
        cancel_url: `${appUrl}/checkout/${photobookId}?cancelled=true`,
      }),
    })

    if (!kakaoRes.ok) {
      const kakaoError = await kakaoRes.json()
      console.error('Kakao Pay Ready error:', kakaoError)
      // Clean up the pending order
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: '카카오페이 결제 준비에 실패했습니다.' }, { status: 500 })
    }

    const kakaoData = await kakaoRes.json()
    const { tid, next_redirect_pc_url, next_redirect_mobile_url } = kakaoData

    // Save TID to order
    const { error: tidError } = await supabase
      .from('orders')
      .update({ kakao_tid: tid })
      .eq('id', order.id)

    if (tidError) {
      console.error('TID save error:', tidError)
      return NextResponse.json({ error: '결제 정보 저장에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      redirectUrl: next_redirect_pc_url,
      mobileRedirectUrl: next_redirect_mobile_url,
      orderId: order.id,
    })
  } catch (err) {
    console.error('Kakao Pay Ready unexpected error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OrderStatus } from '@/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  processing: '제작 중',
  shipped: '배송 중',
  delivered: '배달 완료',
  cancelled: '취소됨',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
}

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Orders fetch error:', error)
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#1a1a2e]/50 hover:text-[#1a1a2e] text-sm mb-4 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            대시보드
          </Link>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">주문 내역</h1>
          <p className="text-[#1a1a2e]/50 text-sm mt-1">나의 포토북 주문 현황을 확인하세요</p>
        </div>

        {/* Orders List */}
        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a2e]/5 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1a2e] mb-1">주문 내역이 없습니다</h3>
            <p className="text-[#1a1a2e]/40 text-sm">포토북을 제작하고 주문해 보세요!</p>
            <Link
              href="/"
              className="mt-5 inline-block px-5 py-2.5 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d4e] transition-colors"
            >
              포토북 만들기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const status = order.status as OrderStatus
              const date = new Date(order.created_at)
              const dateStr = `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 hover:border-[#1a1a2e]/20 hover:shadow-sm transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#1a1a2e]/5 flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 9h18M9 21V9"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a1a2e] text-sm">Memory Book 포토북</p>
                      <p className="text-[#1a1a2e]/40 text-xs mt-0.5">{dateStr}</p>
                      <p className="text-[#1a1a2e]/30 text-xs font-mono mt-0.5">
                        {order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <p className="font-bold text-[#1a1a2e] text-sm">
                      {order.total_price.toLocaleString()}원
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

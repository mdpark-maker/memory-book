import { createClient } from '@/lib/supabase/server'
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

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { status: filterStatus } = await searchParams

  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select(`
      id,
      user_id,
      status,
      shipping_name,
      shipping_phone,
      shipping_address,
      tracking_number,
      total_price,
      created_at,
      paid_at
    `)
    .order('created_at', { ascending: false })

  if (filterStatus && filterStatus !== 'all') {
    query = query.eq('status', filterStatus)
  }

  const { data: orders, error } = await query

  if (error) {
    console.error('Admin orders fetch error:', error)
  }

  const ALL_STATUSES: Array<{ value: string; label: string }> = [
    { value: 'all', label: '전체' },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ]

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">주문 관리</h1>
        <p className="text-[#1a1a2e]/50 text-sm mt-1">
          총 {orders?.length ?? 0}건의 주문
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {ALL_STATUSES.map(({ value, label }) => (
          <Link
            key={value}
            href={value === 'all' ? '/admin/orders' : `/admin/orders?status=${value}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              (value === 'all' && !filterStatus) || filterStatus === value
                ? 'bg-[#1a1a2e] text-white'
                : 'bg-white text-[#1a1a2e]/60 hover:bg-[#1a1a2e]/5 border border-[#1a1a2e]/10'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 overflow-hidden">
        {!orders || orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#1a1a2e]/40 text-sm">주문이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1a2e]/8 bg-[#faf8f5]">
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1a1a2e]/60 text-xs">주문 번호</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1a1a2e]/60 text-xs">받는 분</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1a1a2e]/60 text-xs">연락처</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1a1a2e]/60 text-xs">상태</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1a1a2e]/60 text-xs">결제액</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1a1a2e]/60 text-xs">주문일</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#1a1a2e]/60 text-xs">관리</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => {
                  const status = order.status as OrderStatus
                  const date = new Date(order.created_at)
                  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`

                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-[#1a1a2e]/5 hover:bg-[#faf8f5] transition-colors ${idx % 2 === 0 ? '' : 'bg-[#faf8f5]/40'}`}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-[#1a1a2e]/60">
                          {order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-[#1a1a2e]">{order.shipping_name}</p>
                          <p className="text-[#1a1a2e]/40 text-xs mt-0.5 truncate max-w-[160px]">{order.shipping_address}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#1a1a2e]/70">{order.shipping_phone}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#1a1a2e]">
                        {order.total_price.toLocaleString()}원
                      </td>
                      <td className="px-5 py-4 text-[#1a1a2e]/50 text-xs">{dateStr}</td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="px-3 py-1.5 bg-[#1a1a2e] text-white text-xs font-semibold rounded-lg hover:bg-[#2d2d4e] transition-colors"
                        >
                          운송장 입력
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

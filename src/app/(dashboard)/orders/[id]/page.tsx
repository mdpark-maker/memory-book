import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
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

const TIMELINE_STEPS = [
  { key: 'paid' as OrderStatus, label: '결제 완료', icon: '💳' },
  { key: 'processing' as OrderStatus, label: '제작 중', icon: '📖' },
  { key: 'shipped' as OrderStatus, label: '배송 중', icon: '🚚' },
  { key: 'delivered' as OrderStatus, label: '배달 완료', icon: '✅' },
]

const STATUS_ORDER: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

function getStatusIndex(status: OrderStatus) {
  return STATUS_ORDER.indexOf(status)
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { success } = await searchParams

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !order) {
    notFound()
  }

  const status = order.status as OrderStatus
  const currentStatusIndex = getStatusIndex(status)

  const createdAt = new Date(order.created_at)
  const formattedDate = `${createdAt.getFullYear()}년 ${createdAt.getMonth() + 1}월 ${createdAt.getDate()}일 ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-[#faf8f5] py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="flex items-center gap-2 text-[#1a1a2e]/50 hover:text-[#1a1a2e] text-sm mb-4 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            주문 내역
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1a1a2e]">주문 상세</h1>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
        </div>

        {/* Success Banner */}
        {success === 'true' && (
          <div className="mb-6 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🎉</span>
            <div>
              <p className="font-semibold text-emerald-800 text-sm">결제가 완료됐어요!</p>
              <p className="text-emerald-700 text-xs mt-0.5">포토북 제작을 시작합니다. 3~5 영업일 내 배송됩니다.</p>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 mb-4">
          <h2 className="font-semibold text-[#1a1a2e] mb-4 text-sm">주문 정보</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#1a1a2e]/50">주문 번호</span>
              <span className="font-mono font-medium text-[#1a1a2e]">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1a1a2e]/50">주문 일시</span>
              <span className="text-[#1a1a2e]">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1a1a2e]/50">상품명</span>
              <span className="text-[#1a1a2e]">Memory Book 포토북</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1a1a2e]/50">결제 금액</span>
              <span className="font-bold text-[#1a1a2e]">{order.total_price.toLocaleString()}원</span>
            </div>
            {order.paid_at && (
              <div className="flex justify-between">
                <span className="text-[#1a1a2e]/50">결제 일시</span>
                <span className="text-[#1a1a2e]">
                  {(() => {
                    const d = new Date(order.paid_at)
                    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 mb-4">
          <h2 className="font-semibold text-[#1a1a2e] mb-4 text-sm">배송 정보</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#1a1a2e]/50">받는 분</span>
              <span className="text-[#1a1a2e]">{order.shipping_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1a1a2e]/50">연락처</span>
              <span className="text-[#1a1a2e]">{order.shipping_phone}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#1a1a2e]/50 flex-shrink-0">주소</span>
              <span className="text-[#1a1a2e] text-right">
                {order.shipping_address}
                {order.shipping_detail && `, ${order.shipping_detail}`}
              </span>
            </div>
            {order.tracking_number && (
              <div className="flex justify-between items-center">
                <span className="text-[#1a1a2e]/50">운송장 번호</span>
                <span className="font-mono font-semibold text-[#1a1a2e] underline decoration-dotted cursor-pointer hover:text-[#e8a87c] transition-colors">
                  {order.tracking_number}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {status !== 'cancelled' && status !== 'pending' && (
          <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 mb-4">
            <h2 className="font-semibold text-[#1a1a2e] mb-5 text-sm">진행 현황</h2>
            <div className="flex items-center justify-between relative">
              {/* Track line */}
              <div className="absolute left-[22px] right-[22px] top-[22px] h-0.5 bg-[#1a1a2e]/10" />
              {TIMELINE_STEPS.map((step, idx) => {
                const stepIndex = getStatusIndex(step.key)
                const isDone = currentStatusIndex >= stepIndex
                const isCurrent = status === step.key

                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 z-10 flex-1">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                      isDone
                        ? 'bg-[#1a1a2e] border-[#1a1a2e] text-white'
                        : 'bg-white border-[#1a1a2e]/15 text-[#1a1a2e]/30'
                    } ${isCurrent ? 'ring-4 ring-[#1a1a2e]/10' : ''}`}>
                      {step.icon}
                    </div>
                    <span className={`text-xs text-center leading-tight ${isDone ? 'font-semibold text-[#1a1a2e]' : 'text-[#1a1a2e]/35'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cancelled notice */}
        {status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
            <p className="font-semibold text-red-700 text-sm">주문이 취소됐습니다.</p>
            <p className="text-red-600 text-xs mt-1">문의사항이 있으시면 고객센터로 연락해 주세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

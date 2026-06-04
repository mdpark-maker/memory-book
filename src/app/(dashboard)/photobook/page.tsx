import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Photobook, PhotobookStatus } from '@/types'

const STATUS_LABEL: Record<PhotobookStatus, string> = {
  collecting: '수집중',
  ready: '준비완료',
  paid: '결제완료',
  processing: '제작중',
  shipped: '배송중',
  delivered: '배달완료',
}

const STATUS_COLOR: Record<PhotobookStatus, string> = {
  collecting: 'bg-gray-100 text-gray-600',
  ready: 'bg-[#e8a87c]/15 text-[#e8a87c]',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
}

function StatusBadge({ status }: { status: PhotobookStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function PhotobookCard({ photobook }: { photobook: Photobook }) {
  return (
    <Link
      href={`/photobook/${photobook.id}`}
      className="group block bg-white rounded-2xl border border-[#1a1a2e]/8 shadow-sm hover:shadow-md hover:border-[#e8a87c]/40 hover:-translate-y-0.5 transition-all p-5"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Book icon */}
        <div className="w-12 h-14 rounded-lg bg-gradient-to-br from-[#e8a87c]/30 to-[#d4966a]/20 flex items-center justify-center shadow-sm">
          <svg
            className="w-6 h-7 text-[#e8a87c]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <StatusBadge status={photobook.status} />
      </div>

      <div>
        <p className="text-[#1a1a2e] font-semibold text-sm mb-1">
          {new Date(photobook.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="flex items-center gap-3 text-[#1a1a2e]/50 text-xs">
          <span>{photobook.photo_count}장</span>
          <span>·</span>
          <span>{photobook.price.toLocaleString('ko-KR')}원</span>
          {photobook.order_number && (
            <>
              <span>·</span>
              <span className="font-mono">{photobook.order_number}</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {photobook.status === 'ready' && (
          <span className="text-[#e8a87c] text-xs font-semibold">결제 대기중 →</span>
        )}
        {photobook.status === 'shipped' && (
          <span className="text-purple-600 text-xs font-semibold">배송중 →</span>
        )}
        {photobook.status === 'delivered' && (
          <span className="text-emerald-600 text-xs font-semibold">배달 완료</span>
        )}
        {!['ready', 'shipped', 'delivered'].includes(photobook.status) && (
          <span className="text-[#1a1a2e]/30 text-xs">자세히 보기 →</span>
        )}
        <svg
          className="w-4 h-4 text-[#1a1a2e]/30 group-hover:text-[#e8a87c] transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

export default async function PhotobookListPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: photobooks } = await supabase
    .from('photobooks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1a1a2e] mb-1">나의 포토북</h1>
        <p className="text-[#1a1a2e]/50 text-sm">
          주문한 포토북의 현황을 확인할 수 있어요
        </p>
      </div>

      {!photobooks || photobooks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a2e]/5 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#1a1a2e]/25"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <p className="text-[#1a1a2e]/50 text-sm mb-6">아직 포토북이 없어요</p>
          <Link
            href="/upload"
            className="inline-block px-6 py-3 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d4e] transition-colors"
          >
            사진 업로드하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(photobooks as Photobook[]).map((pb) => (
            <PhotobookCard key={pb.id} photobook={pb} />
          ))}
        </div>
      )}

      {/* CTA: create new photobook if has ready one */}
      {photobooks && photobooks.some((pb) => pb.status === 'ready' && pb.photo_count >= 30) && (
        <div className="mt-8 p-5 bg-[#e8a87c]/10 border border-[#e8a87c]/25 rounded-2xl text-center">
          <p className="text-[#1a1a2e]/70 text-sm mb-3">
            30장의 사진이 준비됐어요! AI 포토북을 만들어보세요.
          </p>
          <Link
            href="/photobook/create"
            className="inline-block px-6 py-3 bg-[#e8a87c] hover:bg-[#d4966a] text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md"
          >
            포토북 만들기
          </Link>
        </div>
      )}
    </div>
  )
}

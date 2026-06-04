import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Photo } from '@/types'

const PHOTO_TARGET = 30

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const displayName =
    user.user_metadata?.name || user.email?.split('@')[0] || '사용자'

  // Fetch photo count
  const { count: photoCount } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const count = photoCount ?? 0
  const progressPercent = Math.min((count / PHOTO_TARGET) * 100, 100)
  const isComplete = count >= PHOTO_TARGET

  // Fetch recent photos (up to 9)
  const { data: recentPhotos } = await supabase
    .from('photos')
    .select('id, storage_path, original_name, taken_at')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(9)

  const photos = (recentPhotos ?? []) as Photo[]

  // Generate signed URLs for photos
  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      const { data } = await supabase.storage
        .from('photos')
        .createSignedUrl(photo.storage_path, 3600)
      return { ...photo, url: data?.signedUrl }
    })
  )

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-1">
            안녕하세요, {displayName}님!
          </h1>
          <p className="text-[#1a1a2e]/50 text-sm">
            오늘도 소중한 순간을 담아보세요
          </p>
        </div>

        {isComplete && (
          <Link
            href="/photobook"
            className="flex-shrink-0 px-5 py-2.5 bg-[#e8a87c] hover:bg-[#d9946a] text-white text-sm font-semibold rounded-2xl transition-all hover:shadow-lg hover:shadow-[#e8a87c]/30 hover:-translate-y-0.5"
          >
            포토북 만들기 ✨
          </Link>
        )}
      </div>

      {/* Photo Progress Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a2e]/6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#1a1a2e]/50 text-sm font-medium mb-1">포토북 진행 상황</p>
            <p className="text-[#1a1a2e] font-bold text-2xl">
              <span className={isComplete ? 'text-[#e8a87c]' : 'text-[#1a1a2e]'}>{count}</span>
              <span className="text-[#1a1a2e]/30 font-normal text-lg"> / {PHOTO_TARGET}장</span>
            </p>
            <p className="text-[#1a1a2e]/50 text-sm mt-1">
              {isComplete
                ? '사진이 다 모였어요! 포토북을 만들어보세요.'
                : `${PHOTO_TARGET - count}장 더 필요해요`}
            </p>
          </div>

          {isComplete ? (
            <div className="w-16 h-16 rounded-full bg-[#e8a87c]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">🎉</span>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-[#1a1a2e]/10 flex items-center justify-center flex-shrink-0 relative">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" width="64" height="64">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#e8a87c"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <span className="text-xs font-bold text-[#1a1a2e]">
                {Math.round(progressPercent)}%
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#1a1a2e]/8 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              background: isComplete
                ? 'linear-gradient(90deg, #e8a87c, #f0c090)'
                : 'linear-gradient(90deg, #1a1a2e, #3d3d6e)',
            }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-[#1a1a2e] mb-4">빠른 메뉴</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            icon="📤"
            title="사진 업로드"
            description="새 사진을 추가해 보세요"
            href="/gallery"
            variant="primary"
          />
          <QuickAction
            icon="📖"
            title="포토북 보기"
            description="완성된 포토북을 확인해요"
            href="/photobook"
            variant="default"
          />
          <QuickAction
            icon="📦"
            title="주문 내역"
            description="배송 현황을 확인해요"
            href="/orders"
            variant="default"
          />
        </div>
      </div>

      {/* Recent Photos Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1a1a2e]">최근 사진</h2>
          {photos.length > 0 && (
            <Link
              href="/gallery"
              className="text-sm text-[#e8a87c] font-medium hover:underline"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#1a1a2e]/12 p-16 text-center">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-[#1a1a2e] font-semibold mb-1">아직 사진이 없어요</p>
            <p className="text-[#1a1a2e]/45 text-sm mb-6">
              첫 번째 사진을 올리고 포토북을 시작해 보세요!
            </p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a2e] text-white text-sm font-semibold rounded-2xl hover:bg-[#2d2d4e] transition-colors"
            >
              사진 업로드하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {photosWithUrls.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-2xl overflow-hidden bg-[#1a1a2e]/8 relative group"
              >
                {photo.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt={photo.original_name ?? '사진'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl opacity-30">📷</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#1a1a2e]/0 group-hover:bg-[#1a1a2e]/20 transition-colors rounded-2xl" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  title,
  description,
  href,
  variant = 'default',
}: {
  icon: string
  title: string
  description: string
  href: string
  variant?: 'primary' | 'default'
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-1
        ${
          variant === 'primary'
            ? 'bg-[#1a1a2e] hover:bg-[#2d2d4e] hover:shadow-lg hover:shadow-[#1a1a2e]/25'
            : 'bg-white border border-[#1a1a2e]/8 hover:border-[#e8a87c]/30 hover:shadow-md'
        }
      `}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0
          ${variant === 'primary' ? 'bg-white/10' : 'bg-[#faf8f5]'}
        `}
      >
        {icon}
      </div>
      <div>
        <p
          className={`font-semibold text-sm mb-0.5
            ${variant === 'primary' ? 'text-white' : 'text-[#1a1a2e]'}
          `}
        >
          {title}
        </p>
        <p
          className={`text-xs
            ${variant === 'primary' ? 'text-white/55' : 'text-[#1a1a2e]/45'}
          `}
        >
          {description}
        </p>
      </div>
    </Link>
  )
}

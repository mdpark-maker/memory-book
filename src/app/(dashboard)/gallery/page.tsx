import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PhotoGrid from '@/components/PhotoGrid'
import { Photo } from '@/types'

const MAX_PHOTOS = 30
const SIGNED_URL_EXPIRY = 3600 // 1 hour

export default async function GalleryPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch all photos ordered by taken_at desc, uploaded_at desc
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false, nullsFirst: false })
    .order('uploaded_at', { ascending: false })

  if (photosError) {
    console.error('Gallery fetch error:', photosError)
  }

  const rawPhotos: Photo[] = photos ?? []

  // Generate signed URLs in parallel (batch of 20 for efficiency)
  const photosWithUrls: Photo[] = await Promise.all(
    rawPhotos.map(async (photo) => {
      if (!photo.storage_path) return photo
      try {
        const { data } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, SIGNED_URL_EXPIRY)
        return { ...photo, url: data?.signedUrl ?? undefined }
      } catch {
        return photo
      }
    })
  )

  const totalCount = photosWithUrls.length
  const progressPercent = Math.min(100, Math.round((totalCount / MAX_PHOTOS) * 100))
  const isComplete = totalCount >= MAX_PHOTOS

  return (
    <div className="space-y-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">내 사진 갤러리</h1>
            <p className="text-gray-500 mt-1 text-sm">
              업로드된 사진을 확인하고 관리하세요.
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-[#1a1a2e] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#2d2d4e] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            사진 추가
          </Link>
        </div>

        {/* Progress card */}
        <div className="mb-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">포토북 진행 현황</span>
            <span className="text-lg font-bold text-[#1a1a2e]">
              {totalCount} / {MAX_PHOTOS}장
            </span>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e8a87c] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {isComplete
                ? '30장이 모두 모였습니다! 포토북을 만들어보세요.'
                : `${MAX_PHOTOS - totalCount}장 더 업로드하면 포토북을 만들 수 있어요.`}
            </p>
            {isComplete && (
              <Link
                href="/photobook/create"
                className="text-xs font-semibold text-[#e8a87c] hover:text-[#d4956b] transition-colors"
              >
                포토북 만들기 →
              </Link>
            )}
          </div>
        </div>

        {/* Photo count header */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-600">
              총 <span className="text-[#1a1a2e] font-bold">{totalCount}</span>장
            </h2>
            {isComplete && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                포토북 준비 완료
              </span>
            )}
          </div>
        )}

        {/* Photo grid */}
        <PhotoGrid initialPhotos={photosWithUrls} />

        {/* Empty state CTA */}
        {totalCount === 0 && (
          <div className="text-center mt-6">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-[#e8a87c] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#d4956b] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              첫 번째 사진 업로드하기
            </Link>
          </div>
        )}
    </div>
  )
}

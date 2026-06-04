import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PhotobookPreview from '@/components/PhotobookPreview'
import type { PhotobookPage, Photo } from '@/types'

interface PageWithPhotos extends PhotobookPage {
  photos: (Photo & { url: string | null })[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PhotobookDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the photobook
  const { data: photobook, error: photobookError } = await supabase
    .from('photobooks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (photobookError || !photobook) {
    notFound()
  }

  // Fetch pages
  const { data: pages, error: pagesError } = await supabase
    .from('photobook_pages')
    .select('*')
    .eq('photobook_id', id)
    .order('page_number', { ascending: true })

  if (pagesError || !pages || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-[#1a1a2e]/8">
          <h2 className="text-[#1a1a2e] font-bold text-lg mb-2">페이지가 없습니다</h2>
          <p className="text-[#1a1a2e]/60 text-sm mb-6">
            포토북 레이아웃을 먼저 생성해 주세요.
          </p>
          <Link
            href="/photobook/create"
            className="inline-block px-6 py-3 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d4e] transition-colors"
          >
            레이아웃 생성하기
          </Link>
        </div>
      </div>
    )
  }

  // Collect all photo IDs across all pages
  const allPhotoIds = pages.flatMap((p) => p.photo_ids as string[])

  // Fetch photos
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .in('id', allPhotoIds)

  const photoMap: Record<string, Photo> = {}
  if (photos) {
    for (const photo of photos) {
      photoMap[photo.id] = photo
    }
  }

  // Generate signed URLs
  const photoUrlMap: Record<string, string> = {}
  if (photos) {
    await Promise.all(
      photos.map(async (photo) => {
        const { data } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, 3600)
        if (data?.signedUrl) {
          photoUrlMap[photo.id] = data.signedUrl
        }
      })
    )
  }

  // Build pages with photos
  const pagesWithPhotos: PageWithPhotos[] = pages.map((page) => ({
    ...page,
    photos: (page.photo_ids as string[]).map((pid) => ({
      ...(photoMap[pid] ?? {
        id: pid,
        user_id: user.id,
        photobook_id: id,
        storage_path: '',
        original_name: null,
        taken_at: null,
        width: null,
        height: null,
        uploaded_at: '',
      }),
      url: photoUrlMap[pid] ?? null,
    })),
  }))

  const statusLabel: Record<string, string> = {
    collecting: '수집중',
    ready: '준비완료',
    paid: '결제완료',
    processing: '제작중',
    shipped: '배송중',
    delivered: '배달완료',
  }

  const statusColors: Record<string, string> = {
    collecting: 'bg-gray-100 text-gray-600',
    ready: 'bg-[#e8a87c]/15 text-[#e8a87c]',
    paid: 'bg-green-100 text-green-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link + status */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/photobook"
          className="flex items-center gap-1.5 text-[#1a1a2e]/60 hover:text-[#1a1a2e] transition-colors text-sm"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          포토북 목록
        </Link>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            statusColors[photobook.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {statusLabel[photobook.status] ?? photobook.status}
        </span>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-[#1a1a2e] mb-1">나의 포토북</h1>
        <p className="text-[#1a1a2e]/40 text-xs">
          {new Date(photobook.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          · {photobook.photo_count}장
        </p>
      </div>

      <PhotobookPreview photobookId={photobook.id} pages={pagesWithPhotos} />

      {/* Payment button (only for ready status) */}
      {photobook.status === 'ready' && (
        <div className="mt-8 text-center">
          <Link
            href={`/checkout/${photobook.id}`}
            className="inline-block px-10 py-4 bg-[#e8a87c] hover:bg-[#d4966a] text-white font-bold text-base rounded-2xl transition-all hover:shadow-lg hover:shadow-[#e8a87c]/30 hover:-translate-y-0.5"
          >
            결제하기 · {photobook.price.toLocaleString('ko-KR')}원
          </Link>
        </div>
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { generateBackgroundsForPages } from '@/lib/ai-background'
import PhotobookPreview from '@/components/PhotobookPreview'
import type { PhotobookPage, Photo } from '@/types'

interface PageWithPhotos extends PhotobookPage {
  photos: (Photo & { url: string | null })[]
}

export default async function CreatePhotobookPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check for a 'ready' photobook with >= 30 photos
  const { data: photobook } = await supabase
    .from('photobooks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .gte('photo_count', 30)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!photobook) {
    redirect('/gallery?message=need30photos')
  }

  // Fetch 30 photos sorted by taken_at
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('photobook_id', photobook.id)
    .order('taken_at', { ascending: true, nullsFirst: false })
    .limit(30)

  if (photosError || !photos || photos.length < 30) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-[#1a1a2e]/8">
          <h2 className="text-[#1a1a2e] font-bold text-lg mb-2">사진이 부족합니다</h2>
          <p className="text-[#1a1a2e]/60 text-sm mb-6">
            포토북을 만들려면 30장의 사진이 필요합니다.
          </p>
          <Link
            href="/gallery"
            className="inline-block px-6 py-3 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d4e] transition-colors"
          >
            갤러리로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // Group photos into pages of 3 (10 pages)
  const pageGroups: Photo[][] = []
  for (let i = 0; i < 30; i += 3) {
    pageGroups.push(photos.slice(i, i + 3))
  }

  // Generate AI backgrounds
  const photoInfoGroups = pageGroups.map((group) =>
    group.map((p) => ({ takenAt: p.taken_at }))
  )
  const backgrounds = await generateBackgroundsForPages(photoInfoGroups)

  // Delete any existing pages and recreate
  await supabase.from('photobook_pages').delete().eq('photobook_id', photobook.id)

  const pageInserts = pageGroups.map((group, index) => ({
    photobook_id: photobook.id,
    page_number: index + 1,
    photo_ids: group.map((p) => p.id),
    background_style: backgrounds[index],
  }))

  const { data: insertedPages, error: insertError } = await supabase
    .from('photobook_pages')
    .insert(pageInserts)
    .select()

  if (insertError || !insertedPages) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-[#1a1a2e]/8">
          <h2 className="text-[#1a1a2e] font-bold text-lg mb-2">오류가 발생했습니다</h2>
          <p className="text-[#1a1a2e]/60 text-sm mb-6">
            페이지 생성 중 오류가 발생했습니다. 다시 시도해 주세요.
          </p>
          <Link
            href="/gallery"
            className="inline-block px-6 py-3 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d4e] transition-colors"
          >
            갤러리로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // Generate signed URLs for all photos
  const photoUrlMap: Record<string, string> = {}
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

  // Build pages with photos
  const pagesWithPhotos: PageWithPhotos[] = insertedPages.map((page) => ({
    ...page,
    photos: pageGroups[page.page_number - 1].map((p) => ({
      ...p,
      url: photoUrlMap[p.id] ?? null,
    })),
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-[#1a1a2e] mb-2">포토북이 완성됐어요!</h1>
        <p className="text-[#1a1a2e]/55 text-sm">
          AI가 사진의 분위기에 맞는 배경을 디자인했어요. 각 페이지를 확인해보세요.
        </p>
      </div>

      <PhotobookPreview photobookId={photobook.id} pages={pagesWithPhotos} />
    </div>
  )
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateBackgroundsForPages } from '@/lib/ai-background'
import type { Photo } from '@/types'

export async function POST() {
  const supabase = await createClient()

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  // Get the user's 'ready' photobook
  const { data: photobook, error: photobookError } = await supabase
    .from('photobooks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .gte('photo_count', 30)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (photobookError || !photobook) {
    return NextResponse.json(
      { error: '준비된 포토북을 찾을 수 없습니다. 사진 30장을 먼저 업로드해 주세요.' },
      { status: 404 }
    )
  }

  // Fetch 30 photos for this photobook, sorted by taken_at
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('photobook_id', photobook.id)
    .order('taken_at', { ascending: true, nullsFirst: false })
    .limit(30)

  if (photosError || !photos || photos.length < 30) {
    return NextResponse.json(
      { error: '사진이 충분하지 않습니다. 30장의 사진이 필요합니다.' },
      { status: 400 }
    )
  }

  // Group into pages of 3 (10 pages total)
  const pageGroups: Photo[][] = []
  for (let i = 0; i < 30; i += 3) {
    pageGroups.push(photos.slice(i, i + 3))
  }

  // Build photo info for AI background generation
  const photoInfoGroups = pageGroups.map((group) =>
    group.map((p) => ({ takenAt: p.taken_at }))
  )

  // Generate AI backgrounds
  const backgrounds = await generateBackgroundsForPages(photoInfoGroups)

  // Delete existing pages for this photobook (regeneration support)
  await supabase.from('photobook_pages').delete().eq('photobook_id', photobook.id)

  // Create photobook_pages records
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

  if (insertError) {
    console.error('Page insert error:', insertError)
    return NextResponse.json(
      { error: '페이지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
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

  // Build response with page data enriched with photo URLs
  const pagesWithUrls = insertedPages!.map((page) => ({
    ...page,
    photos: pageGroups[page.page_number - 1].map((p) => ({
      ...p,
      url: photoUrlMap[p.id] ?? null,
    })),
  }))

  return NextResponse.json({
    photobookId: photobook.id,
    pages: pagesWithUrls,
  })
}

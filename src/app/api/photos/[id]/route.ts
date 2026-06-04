import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // Fetch the photo to verify ownership and get storage path
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })
    }

    const photobookId = photo.photobook_id

    // Delete from storage
    if (photo.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.storage_path])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue even if storage delete fails
      }
    }

    // Delete DB record
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('DB delete error:', deleteError)
      return NextResponse.json(
        { error: `사진 삭제 실패: ${deleteError.message}` },
        { status: 500 }
      )
    }

    // Decrement photobook photo_count if linked
    if (photobookId) {
      const { data: photobook } = await supabase
        .from('photobooks')
        .select('photo_count, status')
        .eq('id', photobookId)
        .single()

      if (photobook) {
        const newCount = Math.max(0, (photobook.photo_count ?? 1) - 1)
        // If was 'ready' and now below 30, revert to 'collecting'
        const newStatus =
          photobook.status === 'ready' && newCount < 30 ? 'collecting' : photobook.status

        await supabase
          .from('photobooks')
          .update({ photo_count: newCount, status: newStatus })
          .eq('id', photobookId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete route error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

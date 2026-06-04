import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const takenAtStr = formData.get('takenAt') as string | null

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP, HEIC 파일만 가능합니다.' },
        { status: 400 }
      )
    }

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${Date.now()}_${sanitizedName}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `스토리지 업로드 실패: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Parse takenAt date
    const takenAt = takenAtStr ? new Date(takenAtStr) : null

    // Insert photo record
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        original_name: file.name,
        taken_at: takenAt?.toISOString() ?? null,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('photos').remove([storagePath])
      return NextResponse.json(
        { error: `데이터베이스 저장 실패: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Find or create user's 'collecting' photobook
    let { data: photobook, error: pbError } = await supabase
      .from('photobooks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'collecting')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pbError || !photobook) {
      // Create new photobook
      const { data: newPb, error: createPbError } = await supabase
        .from('photobooks')
        .insert({
          user_id: user.id,
          status: 'collecting',
          photo_count: 0,
          price: 15000,
        })
        .select()
        .single()

      if (createPbError || !newPb) {
        console.error('Photobook create error:', createPbError)
        return NextResponse.json(
          { error: '포토북 생성 실패' },
          { status: 500 }
        )
      }
      photobook = newPb
    }

    // Link photo to photobook
    const { error: linkError } = await supabase
      .from('photos')
      .update({ photobook_id: photobook.id })
      .eq('id', photo.id)

    if (linkError) {
      console.error('Photo link error:', linkError)
    }

    // Increment photo_count
    const newCount = (photobook.photo_count ?? 0) + 1
    const newStatus = newCount >= 30 ? 'ready' : 'collecting'

    const { data: updatedPb, error: updatePbError } = await supabase
      .from('photobooks')
      .update({
        photo_count: newCount,
        status: newStatus,
      })
      .eq('id', photobook.id)
      .select()
      .single()

    if (updatePbError) {
      console.error('Photobook update error:', updatePbError)
    }

    const finalPhotobook = updatedPb ?? photobook

    return NextResponse.json({
      photo: { ...photo, photobook_id: photobook.id },
      photobook: finalPhotobook,
    })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

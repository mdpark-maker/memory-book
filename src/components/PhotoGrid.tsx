'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { Photo } from '@/types'

interface PhotoGridProps {
  initialPhotos: Photo[]
}

function formatKoreanDate(dateStr: string | null): string {
  if (!dateStr) return '날짜 없음'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '날짜 없음'
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface PhotoCardProps {
  photo: Photo
  onDelete: (id: string) => void
}

function PhotoCard({ photo, onDelete }: PhotoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isDeleting) return

      const confirmed = window.confirm('이 사진을 삭제하시겠습니까?')
      if (!confirmed) return

      setIsDeleting(true)
      try {
        const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          alert(data.error ?? '삭제에 실패했습니다.')
          setIsDeleting(false)
          return
        }
        onDelete(photo.id)
      } catch {
        alert('삭제 중 오류가 발생했습니다.')
        setIsDeleting(false)
      }
    },
    [photo.id, isDeleting, onDelete]
  )

  return (
    <div
      className={`group relative rounded-xl overflow-hidden bg-gray-100 shadow-sm transition-all duration-200 hover:shadow-md ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Image */}
      <div className="aspect-square relative">
        {photo.url && !imgError ? (
          <Image
            src={photo.url}
            alt={photo.original_name ?? '사진'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Delete button - shown on hover */}
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
          aria-label="사진 삭제"
        >
          {isDeleting ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>

      {/* Date */}
      <div className="px-2 py-2">
        <p className="text-xs text-gray-500 text-center truncate">
          {formatKoreanDate(photo.taken_at)}
        </p>
      </div>
    </div>
  )
}

export default function PhotoGrid({ initialPhotos }: PhotoGridProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)

  const handleDelete = useCallback((deletedId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== deletedId))
  }, [])

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-base font-medium text-gray-700 mb-1">아직 업로드된 사진이 없어요</h3>
        <p className="text-sm text-gray-400">소중한 순간을 담은 사진을 업로드해보세요.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} onDelete={handleDelete} />
      ))}
    </div>
  )
}

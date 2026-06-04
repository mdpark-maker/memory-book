'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { PhotobookPage, BackgroundStyle, Photo } from '@/types'

interface PageWithPhotos extends PhotobookPage {
  photos: (Photo & { url: string | null })[]
}

interface PhotobookPreviewProps {
  photobookId: string
  pages: PageWithPhotos[]
}

function buildGradientStyle(bg: BackgroundStyle | null): React.CSSProperties {
  if (!bg) {
    return { background: 'linear-gradient(135deg, #faf8f5, #f5f0eb)' }
  }
  if (bg.type === 'solid') {
    return { background: bg.colors[0] ?? '#faf8f5' }
  }
  const angle = bg.angle ?? 135
  const stops = bg.colors.join(', ')
  return { background: `linear-gradient(${angle}deg, ${stops})` }
}

function formatKoreanDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

function PhotoFrame({
  photo,
  className = '',
}: {
  photo: Photo & { url: string | null }
  className?: string
}) {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="relative w-full flex-1 rounded-xl overflow-hidden shadow-md bg-white/40">
        {photo.url ? (
          <Image
            src={photo.url}
            alt={photo.original_name ?? '사진'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
            사진 없음
          </div>
        )}
        {/* Paper-like inner shadow */}
        <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.08)] rounded-xl pointer-events-none" />
      </div>
      {photo.taken_at && (
        <p className="mt-1.5 text-[10px] text-white/70 text-center leading-tight font-light">
          {formatKoreanDate(photo.taken_at)}
        </p>
      )}
    </div>
  )
}

type LayoutType = 'large-top' | 'three-equal' | 'large-bottom'

function getLayout(pageNumber: number): LayoutType {
  const mod = ((pageNumber - 1) % 3) + 1
  if (mod === 1) return 'large-top'
  if (mod === 2) return 'three-equal'
  return 'large-bottom'
}

function PageLayout({
  page,
}: {
  page: PageWithPhotos
}) {
  const layout = getLayout(page.page_number)
  const photos = page.photos
  const bgStyle = buildGradientStyle(page.background_style)

  return (
    <div
      className="relative w-full h-full flex flex-col rounded-2xl overflow-hidden select-none"
      style={bgStyle}
    >
      {/* Mood badge */}
      {page.background_style?.mood && (
        <span className="absolute top-3 left-4 text-white/60 text-[10px] font-light tracking-widest uppercase z-10">
          {page.background_style.mood}
        </span>
      )}

      {/* Photos area */}
      <div className="flex-1 p-5 pt-8 flex flex-col gap-3">
        {layout === 'large-top' && (
          <>
            {/* 1 large top */}
            <div className="flex-[2] flex flex-col">
              {photos[0] && <PhotoFrame photo={photos[0]} className="h-full" />}
            </div>
            {/* 2 small bottom */}
            <div className="flex-[1] flex gap-3">
              {photos[1] && <PhotoFrame photo={photos[1]} className="flex-1" />}
              {photos[2] && <PhotoFrame photo={photos[2]} className="flex-1" />}
            </div>
          </>
        )}

        {layout === 'three-equal' && (
          <div className="flex-1 flex gap-3">
            {photos[0] && <PhotoFrame photo={photos[0]} className="flex-1" />}
            {photos[1] && <PhotoFrame photo={photos[1]} className="flex-1" />}
            {photos[2] && <PhotoFrame photo={photos[2]} className="flex-1" />}
          </div>
        )}

        {layout === 'large-bottom' && (
          <>
            {/* 2 small top */}
            <div className="flex-[1] flex gap-3">
              {photos[0] && <PhotoFrame photo={photos[0]} className="flex-1" />}
              {photos[1] && <PhotoFrame photo={photos[1]} className="flex-1" />}
            </div>
            {/* 1 large bottom */}
            <div className="flex-[2] flex flex-col">
              {photos[2] && <PhotoFrame photo={photos[2]} className="h-full" />}
            </div>
          </>
        )}
      </div>

      {/* Page number */}
      <div className="pb-3 text-center">
        <span className="text-white/50 text-[10px] tracking-widest">{page.page_number} / 10</span>
      </div>
    </div>
  )
}

export default function PhotobookPreview({ photobookId, pages }: PhotobookPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentPage = pages[currentIndex]

  function prev() {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }

  function next() {
    setCurrentIndex((i) => Math.min(pages.length - 1, i + 1))
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* Book title bar */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-[#1a1a2e] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">M</span>
        </div>
        <span className="text-[#1a1a2e] font-semibold text-sm tracking-tight">Memory Book</span>
      </div>

      {/* Main page view */}
      <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
        {/* Book spine shadow */}
        <div className="absolute -left-2 top-2 bottom-2 w-2 rounded-l-sm bg-black/10 blur-sm" />

        {currentPage && (
          <div className="w-full h-full shadow-2xl shadow-black/20 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15), -4px 0 8px rgba(0,0,0,0.06)' }}>
            <PageLayout page={currentPage} />
          </div>
        )}

        {/* Navigation arrows */}
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          aria-label="이전 페이지"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 shadow-md text-[#1a1a2e] disabled:opacity-30 hover:bg-white transition-all hover:scale-105 z-20"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={next}
          disabled={currentIndex === pages.length - 1}
          aria-label="다음 페이지"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 shadow-md text-[#1a1a2e] disabled:opacity-30 hover:bg-white transition-all hover:scale-105 z-20"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 w-full justify-center flex-wrap">
        {pages.map((page, index) => {
          const bgStyle = buildGradientStyle(page.background_style)
          const isActive = index === currentIndex
          return (
            <button
              key={page.id}
              onClick={() => setCurrentIndex(index)}
              aria-label={`${index + 1}페이지`}
              className={`relative flex-shrink-0 w-12 rounded-md overflow-hidden transition-all ${
                isActive
                  ? 'ring-2 ring-[#1a1a2e] shadow-md scale-105'
                  : 'ring-1 ring-black/10 hover:ring-[#1a1a2e]/40 hover:scale-105'
              }`}
              style={{ aspectRatio: '3/4' }}
            >
              <div className="absolute inset-0 rounded-md" style={bgStyle} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/80 text-[8px] font-semibold">{index + 1}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <Link
        href={`/checkout/${photobookId}`}
        className="w-full max-w-sm py-4 bg-[#1a1a2e] hover:bg-[#2d2d4e] text-white font-semibold text-center rounded-2xl transition-all hover:shadow-lg hover:shadow-[#1a1a2e]/20 hover:-translate-y-0.5 text-sm"
      >
        이 포토북으로 제작하기
      </Link>
    </div>
  )
}

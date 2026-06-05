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
  if (!bg) return { background: 'linear-gradient(135deg, #faf8f5, #f5f0eb)' }
  if (bg.type === 'solid') return { background: bg.colors[0] ?? '#faf8f5' }
  const angle = bg.angle ?? 135
  return { background: `linear-gradient(${angle}deg, ${bg.colors.join(', ')})` }
}

function formatDate(dateStr: string | null, style: 'long' | 'short' = 'long'): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return style === 'long'
      ? d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      : d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return '' }
}

// Smart photo frame — uses object-contain so portrait photos aren't cropped,
// blurred copy fills the background for visual appeal.
function PhotoFrame({ photo, className = '' }: {
  photo: Photo & { url: string | null }
  className?: string
}) {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="relative w-full flex-1 rounded-xl overflow-hidden shadow-md">
        {photo.url ? (
          <>
            {/* Blurred background fill (covers letterbox bars) */}
            <Image
              src={photo.url}
              alt=""
              fill
              aria-hidden
              className="object-cover opacity-40 blur-sm scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {/* Sharp foreground with contain so portrait photos show fully */}
            <Image
              src={photo.url}
              alt={photo.original_name ?? '사진'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-white/20 flex items-center justify-center text-white/50 text-sm">
            사진 없음
          </div>
        )}
        <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.08)] rounded-xl pointer-events-none" />
      </div>
      {photo.taken_at && (
        <p className="mt-1.5 text-[10px] text-white/70 text-center leading-tight font-light">
          {formatDate(photo.taken_at)}
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

function PageLayout({ page, totalPages }: { page: PageWithPhotos; totalPages: number }) {
  const layout = getLayout(page.page_number)
  const photos = page.photos
  const bgStyle = buildGradientStyle(page.background_style)

  return (
    <div
      className="relative w-full h-full flex flex-col rounded-2xl overflow-hidden select-none"
      style={bgStyle}
    >
      {page.background_style?.mood && (
        <span className="absolute top-3 left-4 text-white/60 text-[10px] font-light tracking-widest uppercase z-10">
          {page.background_style.mood}
        </span>
      )}

      <div className="flex-1 p-5 pt-8 flex flex-col gap-3">
        {layout === 'large-top' && (
          <>
            <div className="flex-[2] flex flex-col">
              {photos[0] && <PhotoFrame photo={photos[0]} className="h-full" />}
            </div>
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
            <div className="flex-[1] flex gap-3">
              {photos[0] && <PhotoFrame photo={photos[0]} className="flex-1" />}
              {photos[1] && <PhotoFrame photo={photos[1]} className="flex-1" />}
            </div>
            <div className="flex-[2] flex flex-col">
              {photos[2] && <PhotoFrame photo={photos[2]} className="h-full" />}
            </div>
          </>
        )}
      </div>

      <div className="pb-3 text-center">
        <span className="text-white/50 text-[10px] tracking-widest">
          {page.page_number} / {totalPages}
        </span>
      </div>
    </div>
  )
}

function CoverPage({ pages }: { pages: PageWithPhotos[] }) {
  // First photo URL for blurred background
  const bgPhotoUrl = pages[0]?.photos?.[0]?.url ?? null

  // Date range from all photos
  const allTimestamps = pages
    .flatMap((p) => p.photos)
    .map((ph) => ph.taken_at)
    .filter(Boolean)
    .map((d) => new Date(d!).getTime())
    .sort((a, b) => a - b)

  const firstDate = allTimestamps.length > 0 ? new Date(allTimestamps[0]).toISOString() : null
  const lastDate = allTimestamps.length > 0 ? new Date(allTimestamps[allTimestamps.length - 1]).toISOString() : null
  const sameDay = firstDate && lastDate && firstDate.slice(0, 10) === lastDate.slice(0, 10)

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#1a1a2e]">
      {/* Blurred background */}
      {bgPhotoUrl && (
        <Image
          src={bgPhotoUrl}
          alt=""
          fill
          aria-hidden
          className="object-cover opacity-35 blur-md scale-110"
          sizes="100vw"
          priority
        />
      )}
      {/* Dark vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-white/50 text-[10px] tracking-[0.35em] uppercase mb-5 font-light">
          Memory Book
        </p>
        <h1 className="text-white font-black text-3xl sm:text-4xl leading-tight drop-shadow-lg">
          My Memory
        </h1>
        {firstDate && (
          <div className="mt-6 space-y-1">
            <div className="w-8 h-px bg-white/40 mx-auto mb-3" />
            <p className="text-white/75 text-sm font-light">
              {formatDate(firstDate, 'short')}
            </p>
            {!sameDay && lastDate && (
              <>
                <p className="text-white/40 text-xs">—</p>
                <p className="text-white/75 text-sm font-light">
                  {formatDate(lastDate, 'short')}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="text-white/30 text-[9px] tracking-[0.4em] uppercase">Cover</span>
      </div>
    </div>
  )
}

export default function PhotobookPreview({ photobookId, pages }: PhotobookPreviewProps) {
  // Index 0 = cover, 1..N = pages
  const [currentIndex, setCurrentIndex] = useState(0)
  const totalPages = pages.length
  const isCover = currentIndex === 0
  const currentPage = isCover ? null : pages[currentIndex - 1]

  function prev() { setCurrentIndex((i) => Math.max(0, i - 1)) }
  function next() { setCurrentIndex((i) => Math.min(totalPages, i + 1)) }

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
        <div className="absolute -left-2 top-2 bottom-2 w-2 rounded-l-sm bg-black/10 blur-sm" />

        <div
          className="w-full h-full shadow-2xl rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15), -4px 0 8px rgba(0,0,0,0.06)' }}
        >
          {isCover ? (
            <CoverPage pages={pages} />
          ) : (
            currentPage && <PageLayout page={currentPage} totalPages={totalPages} />
          )}
        </div>

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
          disabled={currentIndex === totalPages}
          aria-label="다음 페이지"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 shadow-md text-[#1a1a2e] disabled:opacity-30 hover:bg-white transition-all hover:scale-105 z-20"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnail strip — index 0 = cover, 1..N = pages */}
      <div className="flex gap-2 overflow-x-auto pb-1 w-full justify-center flex-wrap">
        {/* Cover thumbnail */}
        <button
          onClick={() => setCurrentIndex(0)}
          aria-label="커버"
          className={`relative flex-shrink-0 w-12 rounded-md overflow-hidden transition-all ${
            currentIndex === 0
              ? 'ring-2 ring-[#1a1a2e] shadow-md scale-105'
              : 'ring-1 ring-black/10 hover:ring-[#1a1a2e]/40 hover:scale-105'
          }`}
          style={{ aspectRatio: '3/4' }}
        >
          {pages[0]?.photos?.[0]?.url ? (
            <Image
              src={pages[0].photos[0].url}
              alt="cover"
              fill
              className="object-cover opacity-60"
              sizes="48px"
            />
          ) : (
            <div className="absolute inset-0 bg-[#1a1a2e]" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-white/90 text-[8px] font-bold">C</span>
          </div>
        </button>

        {/* Page thumbnails */}
        {pages.map((page, index) => {
          const bgStyle = buildGradientStyle(page.background_style)
          const isActive = currentIndex === index + 1
          return (
            <button
              key={page.id}
              onClick={() => setCurrentIndex(index + 1)}
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

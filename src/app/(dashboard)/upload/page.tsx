'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import UploadProgress, { UploadFile, UploadStatus } from '@/components/UploadProgress'

const MAX_PHOTOS = 30
const MAX_BATCH = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

async function extractExifDate(file: File): Promise<Date | null> {
  try {
    const exifr = (await import('exifr')).default
    const result = await exifr.parse(file, ['DateTimeOriginal'])
    if (result?.DateTimeOriginal) {
      return new Date(result.DateTimeOriginal)
    }
  } catch {
    // EXIF not available or failed
  }
  return null
}

function formatKoreanDate(date: Date | null): string {
  if (!date) return '날짜 없음'
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Fetch current photo count on mount
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/photos/count')
        if (res.ok) {
          const data = await res.json()
          setTotalCount(data.count ?? 0)
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingCount(false)
      }
    }
    fetchCount()
  }, [])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadFiles.forEach((uf) => URL.revokeObjectURL(uf.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type))

      if (fileArray.length === 0) {
        setGlobalError('JPEG, PNG, WebP, HEIC 형식의 파일만 업로드 가능합니다.')
        return
      }

      const remaining = MAX_PHOTOS - totalCount
      if (remaining <= 0) {
        setGlobalError('이미 30장이 모두 업로드되었습니다.')
        return
      }

      const toProcess = fileArray.slice(0, Math.min(MAX_BATCH, remaining))
      if (toProcess.length < fileArray.length) {
        setGlobalError(
          `최대 ${MAX_BATCH}장씩 업로드 가능하며, ${remaining}장 남았습니다. ${toProcess.length}장만 처리합니다.`
        )
      } else {
        setGlobalError(null)
      }

      // Build initial UploadFile entries with previews and EXIF dates
      const newEntries: UploadFile[] = await Promise.all(
        toProcess.map(async (file) => {
          const [preview, takenAt] = await Promise.all([
            Promise.resolve(createPreviewUrl(file)),
            extractExifDate(file),
          ])
          return {
            id: generateId(),
            file,
            preview,
            takenAt,
            status: 'pending' as UploadStatus,
            progress: 0,
          }
        })
      )

      setUploadFiles((prev) => [...prev, ...newEntries])

      // Upload each file sequentially to avoid overwhelming the server
      for (const entry of newEntries) {
        setUploadFiles((prev) =>
          prev.map((uf) =>
            uf.id === entry.id ? { ...uf, status: 'uploading', progress: 10 } : uf
          )
        )

        try {
          const formData = new FormData()
          formData.append('file', entry.file)
          if (entry.takenAt) {
            formData.append('takenAt', entry.takenAt.toISOString())
          }

          // Simulate progress during upload
          const progressInterval = setInterval(() => {
            setUploadFiles((prev) =>
              prev.map((uf) =>
                uf.id === entry.id && uf.status === 'uploading' && uf.progress < 80
                  ? { ...uf, progress: uf.progress + 15 }
                  : uf
              )
            )
          }, 300)

          const res = await fetch('/api/photos/upload', {
            method: 'POST',
            body: formData,
          })

          clearInterval(progressInterval)

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData.error || `업로드 실패 (${res.status})`)
          }

          const data = await res.json()

          setUploadFiles((prev) =>
            prev.map((uf) =>
              uf.id === entry.id ? { ...uf, status: 'success', progress: 100 } : uf
            )
          )

          if (typeof data.photobook?.photo_count === 'number') {
            setTotalCount(data.photobook.photo_count)
          } else {
            setTotalCount((c) => c + 1)
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
          setUploadFiles((prev) =>
            prev.map((uf) =>
              uf.id === entry.id
                ? { ...uf, status: 'error', progress: 0, errorMessage: message }
                : uf
            )
          )
        }
      }
    },
    [totalCount]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
        // Reset input so same files can be re-selected
        e.target.value = ''
      }
    },
    [processFiles]
  )

  const progressPercent = Math.min(100, Math.round((totalCount / MAX_PHOTOS) * 100))
  const isComplete = totalCount >= MAX_PHOTOS

  const successCount = uploadFiles.filter((uf) => uf.status === 'success').length
  const uploadingCount = uploadFiles.filter(
    (uf) => uf.status === 'uploading' || uf.status === 'pending'
  ).length

  return (
    <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">사진 업로드</h1>
          <p className="text-gray-500 mt-1 text-sm">
            소중한 순간을 담은 사진을 업로드하세요. JPEG, PNG, WebP, HEIC 형식을 지원합니다.
          </p>
        </div>

        {/* Progress counter */}
        <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">포토북 진행 현황</span>
            <span className="text-lg font-bold text-[#1a1a2e]">
              {isLoadingCount ? '...' : `${totalCount} / ${MAX_PHOTOS}장`}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e8a87c] rounded-full transition-all duration-500"
              style={{ width: `${isLoadingCount ? 0 : progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {isComplete
              ? '30장이 모두 모였습니다! 포토북을 만들어보세요.'
              : `${MAX_PHOTOS - totalCount}장 더 업로드하면 포토북을 만들 수 있어요.`}
          </p>
        </div>

        {/* Drop zone */}
        {!isComplete && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
              flex flex-col items-center justify-center p-12 text-center
              ${
                isDragging
                  ? 'border-[#e8a87c] bg-orange-50 scale-[1.01]'
                  : 'border-gray-300 bg-white hover:border-[#e8a87c] hover:bg-orange-50/30'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging ? 'bg-[#e8a87c]/20' : 'bg-gray-100'
              }`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${isDragging ? 'text-[#e8a87c]' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <p className="text-base font-medium text-gray-700 mb-1">
              {isDragging ? '여기에 놓으세요' : '사진을 끌어다 놓거나 클릭하세요'}
            </p>
            <p className="text-sm text-gray-400">한 번에 최대 10장 • JPEG, PNG, WebP, HEIC</p>

            {uploadingCount > 0 && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-10 h-10 text-[#e8a87c] animate-spin mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">업로드 중...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global error */}
        {globalError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {globalError}
          </div>
        )}

        {/* Success summary */}
        {successCount > 0 && uploadingCount === 0 && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successCount}장이 성공적으로 업로드되었습니다.
          </div>
        )}

        {/* Upload progress list */}
        <UploadProgress uploadFiles={uploadFiles} />

        {/* Preview grid */}
        {uploadFiles.filter((uf) => uf.status === 'success').length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-600 mb-3">이번에 업로드한 사진</h3>
            <div className="grid grid-cols-3 gap-3">
              {uploadFiles
                .filter((uf) => uf.status === 'success')
                .map((uf) => (
                  <div key={uf.id} className="group relative">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uf.preview}
                        alt={uf.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {formatKoreanDate(uf.takenAt)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* CTA: Create photobook */}
        {isComplete && (
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2d4e] rounded-2xl p-8 text-white">
              <div className="w-16 h-16 bg-[#e8a87c]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#e8a87c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">30장이 모였어요!</h2>
              <p className="text-white/70 text-sm mb-6">
                이제 나만의 특별한 포토북을 만들 수 있어요.
              </p>
              <button
                onClick={() => router.push('/photobook/create')}
                className="bg-[#e8a87c] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#d4956b] transition-colors"
              >
                포토북 만들기
              </button>
            </div>
          </div>
        )}

        {/* Gallery link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/gallery')}
            className="text-sm text-gray-500 hover:text-[#e8a87c] transition-colors underline underline-offset-2"
          >
            업로드된 사진 모두 보기 →
          </button>
        </div>
    </div>
  )
}

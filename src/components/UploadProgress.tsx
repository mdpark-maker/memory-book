'use client'

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface UploadFile {
  id: string
  file: File
  preview: string
  takenAt: Date | null
  status: UploadStatus
  progress: number
  errorMessage?: string
}

interface UploadProgressProps {
  uploadFiles: UploadFile[]
}

function formatKoreanDate(date: Date | null): string {
  if (!date) return '날짜 없음'
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === 'success') {
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (status === 'error') {
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  if (status === 'uploading') {
    return (
      <svg className="w-5 h-5 text-[#e8a87c] animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function UploadProgress({ uploadFiles }: UploadProgressProps) {
  if (uploadFiles.length === 0) return null

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-medium text-gray-600">업로드 현황</h3>
      <div className="space-y-2">
        {uploadFiles.map((uf) => (
          <div key={uf.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uf.preview}
                  alt={uf.file.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{uf.file.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatKoreanDate(uf.takenAt)}</p>

                {/* Progress bar */}
                {(uf.status === 'uploading' || uf.status === 'pending') && (
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#e8a87c] rounded-full transition-all duration-300"
                      style={{ width: `${uf.progress}%` }}
                    />
                  </div>
                )}

                {uf.status === 'error' && uf.errorMessage && (
                  <p className="text-xs text-red-500 mt-0.5">{uf.errorMessage}</p>
                )}

                {uf.status === 'success' && (
                  <p className="text-xs text-green-600 mt-0.5">업로드 완료</p>
                )}
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                <StatusIcon status={uf.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

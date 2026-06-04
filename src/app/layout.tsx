import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
})

export const metadata: Metadata = {
  title: 'Memory Book | 메모리북',
  description: '소중한 순간을 포토북으로. 30장의 사진으로 나만의 포토북을 만들어보세요.',
  keywords: '포토북, 사진, 메모리북, photobook',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#faf8f5] text-[#1a1a2e]">
        {children}
      </body>
    </html>
  )
}

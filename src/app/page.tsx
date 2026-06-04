import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// 자연 속 가족사진 (Unsplash – 검증된 ID)
const BOOK_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=750&fit=crop&q=80',
    date: '2024년 5월 12일',
    alt: '초록 들판 가족',
  },
  {
    src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=750&fit=crop&q=80',
    date: '2024년 6월 3일',
    alt: '해질녘 가족 실루엣',
  },
  {
    src: 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=600&h=750&fit=crop&q=80',
    date: '2024년 8월 17일',
    alt: '바닷가 가족',
  },
  {
    src: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&h=750&fit=crop&q=80',
    date: '2024년 10월 5일',
    alt: '가을 단풍 가족',
  },
  {
    src: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=500&fit=crop&q=80',
    date: '2024년 7월 22일',
    alt: '여름 소풍',
  },
  {
    src: 'https://images.unsplash.com/photo-1501289836524-8c84ef58db2b?w=400&h=500&fit=crop&q=80',
    date: '2024년 9월 14일',
    alt: '숲속 산책',
  },
]

export default async function LandingPage() {
  // 로그인된 사용자는 대시보드로
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/home')

  return (
    <div className="min-h-screen bg-[#f5efe6] flex flex-col overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="text-[#1a1a2e] font-bold text-xl tracking-tight">Memory Book</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-[#1a1a2e]/70 hover:text-[#1a1a2e] transition-colors">
            로그인
          </Link>
          <Link href="/signup" className="px-5 py-2.5 text-sm font-semibold bg-[#1a1a2e] text-white rounded-full hover:bg-[#2d2d4e] transition-all shadow-md hover:shadow-lg">
            무료로 시작하기
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center pt-4 pb-20 px-4 relative">

        {/* 배경 빛 번짐 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full bg-gradient-to-b from-[#e8d5b7]/50 to-transparent pointer-events-none" />

        {/* 타이틀 */}
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/70 border border-[#c9a876]/30 rounded-full mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8a87c] animate-pulse" />
            <span className="text-xs font-semibold text-[#b07d48] tracking-wide">사진 30장 · AI 자동 제작 · 15,000원 배송</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1a1a2e] leading-[1.1] tracking-tight">
            소중한 순간을
            <br />
            <span style={{ color: '#c9874a' }}>포토북</span>에 담다
          </h1>
          <p className="mt-5 text-lg text-[#1a1a2e]/55 max-w-lg mx-auto leading-relaxed">
            사진을 올리면 AI가 자동으로 아름다운 포토북을 완성해요.
            <br className="hidden sm:block" />
            집으로 배송까지 한 번에.
          </p>
        </div>

        {/* ── 큰 포토북 ── */}
        <div className="relative w-full max-w-4xl mx-auto" style={{ perspective: '1400px' }}>

          {/* 책 바닥 그림자 */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/20 blur-3xl rounded-full" />

          {/* 포토북 본체 */}
          <div
            className="relative mx-auto rounded-2xl overflow-visible"
            style={{
              maxWidth: '860px',
              transform: 'rotateX(5deg) translateY(0)',
              transformOrigin: 'bottom center',
            }}
          >
            {/* 포토북 상단 커버 띠 */}
            <div className="rounded-t-2xl h-6 bg-gradient-to-r from-[#2c2416] via-[#5a4030] to-[#2c2416] flex items-center justify-center gap-3 shadow-md">
              <div className="w-1 h-1 rounded-full bg-[#c9a876]/70" />
              <span className="text-[9px] font-bold tracking-[0.35em] text-[#c9a876]/90 uppercase">Memory Book</span>
              <div className="w-1 h-1 rounded-full bg-[#c9a876]/70" />
            </div>

            {/* 페이지 2단 */}
            <div
              className="grid grid-cols-2 bg-[#fdfaf5]"
              style={{
                boxShadow: '0 30px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.07)',
                minHeight: '480px',
              }}
            >
              {/* 왼쪽 페이지 */}
              <div className="relative p-5 border-r border-[#e8d9c4] flex flex-col gap-3">
                {/* 큰 사진 */}
                <div className="relative rounded-xl overflow-hidden shadow-md" style={{ height: '260px' }}>
                  <Image src={BOOK_PHOTOS[0].src} alt={BOOK_PHOTOS[0].alt} fill className="object-cover" sizes="400px" unoptimized />
                </div>
                <p className="text-center text-[10px] text-[#b0956e] font-medium tracking-widest">{BOOK_PHOTOS[0].date}</p>
                {/* 작은 사진 2장 */}
                <div className="grid grid-cols-2 gap-2">
                  {[BOOK_PHOTOS[4], BOOK_PHOTOS[5]].map((p) => (
                    <div key={p.src}>
                      <div className="relative rounded-lg overflow-hidden shadow-sm" style={{ paddingBottom: '72%' }}>
                        <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="160px" unoptimized />
                      </div>
                      <p className="text-center text-[8px] text-[#b0956e]/80 mt-0.5">{p.date}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-3 left-5 text-[9px] text-[#c9b49a]">1</div>
              </div>

              {/* 책등 오버레이 */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/8 via-transparent to-black/8 pointer-events-none" />

              {/* 오른쪽 페이지 */}
              <div className="relative p-5 flex flex-col gap-3">
                {/* 작은 사진 2장 */}
                <div className="grid grid-cols-2 gap-2">
                  {[BOOK_PHOTOS[1], BOOK_PHOTOS[2]].map((p) => (
                    <div key={p.src}>
                      <div className="relative rounded-lg overflow-hidden shadow-sm" style={{ paddingBottom: '72%' }}>
                        <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="160px" unoptimized />
                      </div>
                      <p className="text-center text-[8px] text-[#b0956e]/80 mt-0.5">{p.date}</p>
                    </div>
                  ))}
                </div>
                {/* 큰 사진 */}
                <div className="relative rounded-xl overflow-hidden shadow-md" style={{ height: '260px' }}>
                  <Image src={BOOK_PHOTOS[3].src} alt={BOOK_PHOTOS[3].alt} fill className="object-cover" sizes="400px" unoptimized />
                </div>
                <p className="text-center text-[10px] text-[#b0956e] font-medium tracking-widest">{BOOK_PHOTOS[3].date}</p>
                <div className="absolute bottom-3 right-5 text-[9px] text-[#c9b49a]">2</div>
              </div>
            </div>

            {/* 포토북 하단 커버 띠 */}
            <div className="rounded-b-2xl h-6 bg-gradient-to-r from-[#2c2416] via-[#5a4030] to-[#2c2416] shadow-[0_8px_20px_rgba(0,0,0,0.25)]" />
          </div>

          {/* 왼쪽 빠져나온 사진 */}
          <div className="hidden lg:block absolute -left-10 top-10 w-36 rounded-xl overflow-hidden shadow-2xl border-4 border-white/80"
            style={{ transform: 'rotate(-9deg)', zIndex: 20 }}>
            <Image
              src="https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=240&h=300&fit=crop&q=80"
              alt="가족 하이킹" width={144} height={180} className="object-cover w-full" unoptimized
            />
            <div className="bg-white px-2 py-1.5 text-center">
              <p className="text-[8px] text-[#b0956e] font-medium">2024년 7월 20일</p>
            </div>
          </div>

          {/* 오른쪽 빠져나온 사진 */}
          <div className="hidden lg:block absolute -right-10 top-14 w-32 rounded-xl overflow-hidden shadow-2xl border-4 border-white/80"
            style={{ transform: 'rotate(8deg)', zIndex: 20 }}>
            <Image
              src="https://images.unsplash.com/photo-1530785602389-07594beb8b73?w=220&h=280&fit=crop&q=80"
              alt="자연 가족" width={128} height={160} className="object-cover w-full" unoptimized
            />
            <div className="bg-white px-2 py-1.5 text-center">
              <p className="text-[8px] text-[#b0956e] font-medium">2024년 4월 8일</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mt-14 relative z-10">
          <Link href="/signup"
            className="px-9 py-4 bg-[#1a1a2e] text-white text-base font-bold rounded-2xl hover:bg-[#2d2d4e] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            나의 포토북 만들기 →
          </Link>
          <Link href="/login"
            className="px-9 py-4 bg-white/80 backdrop-blur text-[#1a1a2e] text-base font-semibold rounded-2xl border border-[#1a1a2e]/10 hover:border-[#c9874a]/40 hover:bg-[#fdf4ea] transition-all hover:-translate-y-0.5">
            이미 계정이 있어요
          </Link>
        </div>

        {/* 피처 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full mt-16 relative z-10">
          {[
            { icon: '📸', title: '30장 자동 완성', desc: '30장이 모이면 AI가 자동으로 포토북을 완성해요' },
            { icon: '📅', title: '날짜 자동 인식', desc: 'EXIF 데이터로 촬영 날짜를 자동으로 읽어요' },
            { icon: '✨', title: 'AI 배경 생성', desc: '사진 분위기에 맞는 배경을 AI가 만들어줘요' },
            { icon: '📦', title: '15,000원 배송', desc: '완성된 포토북을 집으로 바로 배송해드려요' },
          ].map((f) => (
            <div key={f.title} className="bg-white/70 backdrop-blur rounded-2xl p-5 shadow-sm border border-white/80 hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-[#1a1a2e] font-bold text-sm mb-1.5">{f.title}</h3>
              <p className="text-[#1a1a2e]/50 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 border-t border-[#1a1a2e]/8 bg-white/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1a1a2e] flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-[#1a1a2e]/60 text-sm font-medium">Memory Book</span>
          </div>
          <p className="text-[#1a1a2e]/35 text-xs">© 2024 Memory Book. 소중한 순간을 포토북으로.</p>
        </div>
      </footer>
    </div>
  )
}

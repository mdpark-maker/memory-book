@AGENTS.md

# CLAUDE.md

## Project: Memory Book

사용자가 사진 30장을 업로드하면 자동으로 포토북을 생성해 배송해주는 앱.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database/Auth/Storage**: Supabase
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Commands
```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # 린트 검사
```

## Architecture
```
src/
  app/
    (auth)/          # 로그인, 회원가입 (URL: /login, /signup)
    (dashboard)/     # 사용자 대시보드 (URL: /, /gallery, /upload, /photobook, /orders, /checkout)
    admin/           # 관리자 패널 (URL: /admin/orders)
    api/             # API 라우트
      photos/        # 사진 업로드/삭제
      photobook/     # 포토북 생성
      payment/       # 카카오페이 결제
      admin/         # 관리자 API
    auth/callback/   # Supabase OAuth 콜백
  components/        # 공유 컴포넌트
  lib/supabase/      # Supabase 클라이언트 (client.ts, server.ts)
  types/             # TypeScript 타입
  proxy.ts           # 인증 미들웨어 (Next.js 16 proxy)
```

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Supabase Settings > API
ANTHROPIC_API_KEY=                 # AI 배경 생성
KAKAO_PAY_SECRET_KEY=              # 카카오페이 테스트: TC0ONETIME
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=                       # 관리자 이메일 (기본값: mdpark12@gmail.com)
```

## Key Features
- 사진 업로드 + EXIF 날짜 자동 추출
- 30장 모이면 포토북 자동 생성 (3장/페이지, 10페이지)
- Claude AI로 페이지별 배경색 자동 생성
- 카카오페이 15,000원 결제
- 관리자 수동 배송 관리

## Supabase Project
- Project ID: `pjkgfdmzhqrivnthxavq`
- Region: ap-northeast-1 (Tokyo)
- Storage bucket: `photos` (per-user folders: `{userId}/{filename}`)

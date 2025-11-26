# 쩝테이블 (ZepTable)

모임에서 "오늘 뭐 먹지?"를 빠르게 결정하는 메뉴/장소 투표 시스템

## 핵심 기능

- 세션 생성 및 링크 공유
- 참여자 이름으로 간편 참여 (로그인 불필요)
- 키워드 기반 선호도 선택
- 장소/메뉴 투표 (복수 선택 가능)
- 실시간 투표 결과 확인
- 취향이 비슷한 "테이블메이트" 매칭 기능

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Design**: Custom design system with coral color palette

## 시작하기

### 1. 레포지토리 클론

```bash
git clone <repository-url>
cd ZepTable
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 파일 실행
3. `.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 데이터베이스 스키마

### Tables

- **sessions**: 쩝테이블 세션 정보
- **users**: 참여자 정보 및 선택한 키워드
- **keywords**: 시스템 키워드 (사전 정의)
- **places**: 장소 후보
- **votes**: 투표 기록

자세한 스키마는 `supabase-schema.sql` 참조

## 페이지 구조

1. **Home (/)** - 랜딩 페이지
2. **CreateSession (/create-session)** - 새 세션 생성
3. **ShareLink (/share-link)** - 링크 공유 및 관리자 기능
4. **Admin (/admin)** - 장소 추가/관리 (세션 생성자용)
5. **Join (/join)** - 참여자 입장
6. **KeywordSelect (/keyword-select)** - 키워드 선택
7. **PlaceVote (/place-vote)** - 장소 투표
8. **LiveResults (/live-results)** - 실시간 결과 및 테이블메이트
9. **FinalResult (/final-result)** - 최종 결과

## 사용 흐름

### 세션 생성자

1. "새 쩝테이블 만들기" 클릭
2. 모임 이름과 예상 인원 수 입력
3. 생성된 링크를 참여자들에게 공유
4. 관리자 페이지에서 장소 추가
5. 실시간 투표 현황 확인
6. 투표 종료 후 결과 확정

### 참여자

1. 공유받은 링크로 접속
2. 이름 입력하여 참여
3. 선호하는 키워드 선택
4. 장소에 투표
5. 실시간 결과 확인 및 테이블메이트 확인

## 디자인 시스템

### 색상

- Primary: `#DB7144` (코랄)
- Primary Hover: `#C86636`
- Primary Light: `#FFF4EF`
- Background: `#F8F9FA`
- Card: `#FFFFFF`

### 타이포그래피

- H1: 32px / Bold
- H2: 24px / Semi-bold
- H3: 20px / Semi-bold
- Body: 16px / Regular
- Caption: 14px / Regular

## 주요 컴포넌트

- `Button` - Primary, Secondary, Ghost 변형
- `Card` - 그림자 효과가 있는 카드
- `Input` - 폼 입력
- `Tag` - 카테고리 및 상태 표시
- `KeywordChip` - 선택 가능한 키워드
- `Toast` - 알림 메시지

## 테이블메이트 매칭 알고리즘

참여자들의 선택한 키워드를 비교하여 매칭률 계산:

```
매칭률 = (공통 키워드 수 / 전체 고유 키워드 수) × 100
```

상위 3명을 "상성이 높은 테이블메이트"로 표시

## 빌드 및 배포

### 개발 모드 실행 (권장)

```bash
npm run dev
```

이 MVP는 동적 렌더링이 필요한 페이지들이 있어, 개발 모드에서 실행하거나 동적 렌더링을 지원하는 플랫폼에 배포하는 것을 권장합니다.

### Vercel 배포 (권장)

Vercel은 Next.js의 동적 렌더링을 자동으로 처리합니다:

1. Vercel 계정에 연결
2. 환경 변수 설정 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
3. 자동 배포

### 프로덕션 빌드 (선택사항)

```bash
npm run build
npm start
```

**참고**: 정적 빌드는 useSearchParams를 사용하는 페이지들로 인해 빌드 시 경고가 발생할 수 있습니다. 이는 Next.js의 동적 라우팅 특성상 정상이며, Vercel 등의 플랫폼에서는 자동으로 처리됩니다.

## 라이선스

ISC

## 개발자

쩝테이블은 모임의 의사결정을 즐겁고 빠르게 만들기 위해 개발되었습니다.

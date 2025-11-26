# 🚀 ZepTable 설정 가이드

## 1️⃣ Supabase 프로젝트 생성

### 1.1 Supabase 계정 만들기
1. [https://supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭 (GitHub 계정으로 로그인 가능)
3. 새 조직(Organization) 생성

### 1.2 프로젝트 생성
1. "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `zeptable` (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 생성 (잘 기억해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국에 가장 가까운 지역)
   - **Pricing Plan**: Free tier 선택
3. "Create new project" 클릭
4. 프로젝트 생성 완료까지 1-2분 대기

## 2️⃣ 데이터베이스 스키마 설정

### 2.1 SQL Editor 열기
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
2. "New query" 버튼 클릭

### 2.2 스키마 실행
1. 프로젝트 루트의 `supabase-schema.sql` 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)
3. Supabase SQL Editor에 붙여넣기 (Ctrl+V)
4. "Run" 버튼 클릭 (또는 Ctrl+Enter)
5. 성공 메시지 확인: `Success. No rows returned`

### 2.3 테이블 확인
1. 왼쪽 메뉴에서 **"Table Editor"** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ sessions
   - ✅ users
   - ✅ keywords (9개 데이터 포함)
   - ✅ places
   - ✅ votes

## 3️⃣ API 키 가져오기

### 3.1 Project Settings 열기
1. 왼쪽 메뉴 하단의 **⚙️ Settings** 클릭
2. **"API"** 메뉴 선택

### 3.2 필요한 정보 복사
다음 두 가지 정보를 복사해두세요:

1. **Project URL**
   ```
   https://xxxxxxxxxxx.supabase.co
   ```

2. **anon public key** (Public API Key)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **주의**: `service_role` 키가 아닌 `anon` 키를 사용하세요!

## 4️⃣ 환경 변수 설정

### 4.1 .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Mac/Linux
touch .env.local

# Windows (PowerShell)
New-Item .env.local
```

### 4.2 환경 변수 입력
`.env.local` 파일을 열고 다음 내용 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

위의 값들을 3.2단계에서 복사한 **실제 값**으로 교체하세요!

## 5️⃣ 개발 서버 실행

### 5.1 서버 재시작
이미 실행 중이던 경우 중지 (Ctrl+C) 후 재시작:

```bash
npm run dev
```

### 5.2 브라우저에서 확인
1. [http://localhost:3000](http://localhost:3000) 접속
2. 경고 메시지가 사라졌는지 확인
3. "새 쩝테이블 만들기" 클릭
4. 모임 이름 입력 후 세션 생성 테스트

## 6️⃣ 테스트

### 6.1 세션 생성 테스트
1. 홈에서 "새 쩝테이블 만들기"
2. 모임 이름 입력 (예: "금요일 저녁")
3. 인원 수 선택
4. "쩝테이블 시작하기" 클릭
5. 링크 공유 페이지가 나오면 ✅ 성공!

### 6.2 Supabase Table Editor에서 확인
1. Supabase > Table Editor > sessions
2. 방금 생성한 세션이 보이는지 확인

## 🔧 문제 해결

### "네트워크 오류: Supabase 연결을 확인해주세요"
- `.env.local` 파일의 URL이 정확한지 확인
- 개발 서버를 재시작했는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### "인증 오류: Supabase API 키를 확인해주세요"
- `anon` 키를 사용했는지 확인 (`service_role` 키 ❌)
- API 키 전체가 복사되었는지 확인 (매우 긴 문자열)
- 따옴표나 공백이 들어가지 않았는지 확인

### "데이터베이스 오류: 테이블이 생성되지 않았습니다"
- `supabase-schema.sql`을 SQL Editor에서 실행했는지 확인
- Table Editor에서 5개 테이블이 모두 생성되었는지 확인
- keywords 테이블에 9개 데이터가 있는지 확인

### 여전히 문제가 있다면
1. 브라우저 개발자 도구 (F12) 열기
2. Console 탭에서 에러 메시지 확인
3. 정확한 에러 메시지와 함께 문의

## 📱 Vercel 배포 시 환경 변수 설정

1. Vercel 프로젝트 Settings > Environment Variables
2. 두 개의 환경 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 모든 환경 (Production, Preview, Development)에 적용
4. 재배포

---

설정 완료! 🎉 이제 쩝테이블을 사용할 준비가 되었습니다.

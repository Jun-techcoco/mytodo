# 업무 노트 (My Work To-Do)

후배분이 만든 것처럼 `내이름.vercel.app` 같은 주소로 접속할 수 있는 나만의 To-Do 앱이에요.
모든 기기에서 같은 목록이 보이고, 자동으로 저장돼요. **다 무료**입니다.

---

## 🎯 전체 흐름 (총 20~30분)

1. **Supabase** 가입 → 데이터 저장소 만들기 (약 5분)
2. **GitHub** 가입 → 코드 업로드 (약 5분)
3. **Vercel** 가입 → 배포 (약 5분)
4. 끝! 내 주소로 접속

---

## ① Supabase 설정 (데이터베이스)

데이터를 저장할 곳을 먼저 만들어요.

### 1-1. 계정 만들기
- [https://supabase.com](https://supabase.com) 접속
- 우측 상단 **Start your project** → GitHub로 가입하는 게 가장 빨라요
  (GitHub 계정이 아직 없다면 ② 단계 먼저 만들고 오셔도 돼요)

### 1-2. 프로젝트 만들기
- **New project** 클릭
- **Name**: 아무거나 (예: `my-todo`)
- **Database Password**: 자동 생성된 거 그대로 두고 **꼭 복사해서 메모장에 저장**
- **Region**: `Northeast Asia (Seoul)` 추천
- **Create new project** 클릭 → 2분 정도 기다리기

### 1-3. 데이터베이스 테이블 만들기
- 왼쪽 메뉴에서 **SQL Editor** 클릭
- **New query** 클릭
- 첨부된 `supabase-schema.sql` 파일을 열어서 내용을 통째로 복사 → 붙여넣기
- 우측 하단 **Run** 클릭 → "Success. No rows returned" 뜨면 성공

### 1-4. 키 복사하기 (메모장에 저장하세요)
- 왼쪽 메뉴 **Project Settings** (톱니바퀴) → **API**
- 두 가지를 복사:
  - **Project URL**: `https://xxxxx.supabase.co`
  - **anon public** key: `eyJhbGc...` (긴 문자열)
- 이 두 개는 ③에서 씁니다

### 1-5. 로그인 이메일 도메인 허용
- 왼쪽 메뉴 **Authentication** → **URL Configuration**
- **Site URL**에 나중에 Vercel에서 받을 주소를 넣어야 해요 (③에서 다시 옴)
- 지금은 **Authentication → Providers → Email**이 켜져 있는지만 확인 (기본 켜짐)

---

## ② GitHub에 코드 올리기

### 2-1. 계정 만들기
- [https://github.com](https://github.com) → **Sign up**
- 이메일 인증까지 마치기

### 2-2. 새 저장소(Repository) 만들기
- 우측 상단 **+** → **New repository**
- **Repository name**: `my-todo` (또는 원하는 이름)
- **Public** 또는 **Private** 둘 다 됨 (개인 정보 없으니 아무거나)
- **Create repository** 클릭

### 2-3. 파일 업로드 (드래그 앤 드롭!)
- 만든 저장소 페이지에서 **uploading an existing file** 링크 클릭
- 다운로드 받은 폴더(`todo-app`) 안의 **모든 파일과 폴더를** 통째로 드래그해서 올리기
  - `node_modules` 폴더는 있다면 빼고 올리세요 (없어도 됩니다)
  - `.env.local` 파일은 절대 올리지 마세요 (없을 거예요)
- 페이지 아래 **Commit changes** 클릭

---

## ③ Vercel 배포 (이제 진짜 끝)

### 3-1. 계정 만들기
- [https://vercel.com](https://vercel.com) → **Sign Up**
- **Continue with GitHub** 선택 (방금 만든 GitHub로 로그인)

### 3-2. 프로젝트 import
- **Add New** → **Project**
- 방금 만든 `my-todo` 저장소 옆 **Import** 클릭

### 3-3. 환경변수 입력 (제일 중요!)
- **Environment Variables** 섹션 펼치기
- 두 개를 입력:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ①-4에서 복사한 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ①-4에서 복사한 anon public key |

- **Deploy** 클릭 → 1~2분 기다리기

### 3-4. 내 주소 확인
- 배포 완료되면 `my-todo-xxxx.vercel.app` 같은 주소가 떠요
- 그 주소를 복사

### 3-5. Supabase에 내 주소 등록 (다시 Supabase로)
- Supabase 프로젝트 → **Authentication** → **URL Configuration**
- **Site URL**에 방금 받은 Vercel 주소 입력 (예: `https://my-todo-xxxx.vercel.app`)
- **Redirect URLs**에도 같은 주소 추가
- **Save** 클릭

---

## ✅ 완료! 사용하기

1. Vercel 주소 접속
2. 본인 이메일 입력 → **로그인 링크 받기**
3. 받은 메일에서 링크 클릭 → 자동 로그인
4. 할 일 추가/완료/보류 자유롭게 사용
5. 휴대폰에서도 같은 주소 접속해서 같은 이메일로 로그인하면 똑같은 목록 보임

휴대폰 홈 화면에 추가하면 앱처럼 써요:
- **iPhone**: Safari로 접속 → 공유 → "홈 화면에 추가"
- **Android**: Chrome으로 접속 → 메뉴 → "홈 화면에 추가"

---

## 🆘 문제가 생기면

- **로그인 메일이 안 와요**: 스팸함 확인, Supabase의 Site URL이 정확한지 확인
- **추가는 되는데 다른 기기에서 안 보여요**: 같은 이메일로 로그인했는지 확인
- **저장이 안 돼요**: 환경변수가 제대로 들어갔는지 Vercel Settings → Environment Variables 확인
- **에러 메시지가 떠요**: Vercel 대시보드의 Logs 탭에서 어떤 에러인지 확인

---

## 💰 비용

- **Supabase 무료 티어**: 500MB DB, 월 5만 인증 → 개인 To-Do로는 평생 무료
- **Vercel 무료 티어**: 월 100GB 트래픽 → 개인용은 무료
- **GitHub**: Public 저장소 무제한 무료

월 비용 **0원**입니다.

---

## 🎨 나중에 더 하고 싶은 것

- 마감일 추가
- 카테고리/태그
- 우선순위
- 검색 기능
- 다크 모드
- 모바일 푸시 알림

다 가능해요. 필요할 때 Claude한테 "이거 추가해줘" 하시면 돼요.

-- 이 SQL을 Supabase의 SQL Editor에서 실행하세요
-- (왼쪽 메뉴에서 SQL Editor 클릭 → New query → 붙여넣기 → Run)

-- 할 일 테이블 생성
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  text text not null,
  status text not null default 'active',
  reason text,
  created_at timestamptz default now(),
  parked_at timestamptz
);

-- 보안 정책 활성화 (각 사용자가 자기 데이터만 볼 수 있도록)
alter table tasks enable row level security;

-- 본인 데이터만 조회 가능
create policy "view own tasks" on tasks
  for select using (auth.uid() = user_id);

-- 본인 이름으로만 추가 가능
create policy "insert own tasks" on tasks
  for insert with check (auth.uid() = user_id);

-- 본인 데이터만 수정 가능
create policy "update own tasks" on tasks
  for update using (auth.uid() = user_id);

-- 본인 데이터만 삭제 가능
create policy "delete own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- 정렬용 인덱스
create index tasks_user_status_idx on tasks(user_id, status, created_at desc);

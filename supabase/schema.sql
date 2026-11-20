-- ===========================================================
-- 四夕酒馆 · Supabase 数据库结构
-- 用法：Supabase 控制台 → SQL Editor → 新建查询 → 整段粘贴 → Run
-- 说明：可重复执行（全部使用 if not exists / drop policy if exists）
-- ===========================================================

create extension if not exists pgcrypto;

-- ---------- 1. 用户资料（与 auth.users 一一对应） ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (char_length(username) between 2 and 16),
  birthday    date,
  signature   text check (char_length(signature) <= 40),
  role        text not null default 'user' check (role in ('user','owner')),
  created_at  timestamptz not null default now()
);

-- 注册后自动建档（用户名先取邮箱前缀，用户可在设置里改）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. 分类 ----------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 20),
  sort       int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id, sort);

-- ---------- 3. 书籍 ----------
create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  author      text,
  publisher   text,
  isbn        text check (isbn is null or isbn ~ '^[0-9Xx]{10,13}$'),
  category_id uuid references public.categories(id) on delete set null,
  cover_url   text,
  color       int not null default 0 check (color between 0 and 7),
  created_at  timestamptz not null default now()
);
create index if not exists books_user_idx on public.books(user_id, created_at desc);
create index if not exists books_isbn_idx on public.books(isbn);

-- ---------- 4. 笔记 ----------
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  book_id      uuid not null references public.books(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 120),
  content      text not null,
  visibility   text not null default 'public' check (visibility in ('public','followers','private')),
  anonymous    boolean not null default false,
  status       text not null default 'pending' check (status in ('draft','pending','published','rejected')),
  tags         text[] not null default '{}',
  like_count   int not null default 0,
  tip_count    int not null default 0,
  created_at   timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists notes_feed_idx on public.notes(status, visibility, created_at desc);
create index if not exists notes_user_idx on public.notes(user_id, created_at desc);
create index if not exists notes_book_idx on public.notes(book_id);

-- ---------- 5. 评论 ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 1000),
  anonymous  boolean not null default false,
  status     text not null default 'pending' check (status in ('pending','published','rejected')),
  like_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists comments_note_idx on public.comments(note_id, created_at desc);

-- ---------- 6. 点赞（笔记与评论共用） ----------
create table if not exists public.likes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('note','comment')),
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

-- ---------- 7. 当赏（只记壶数，不含真实支付） ----------
create table if not exists public.tips (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  from_user  uuid not null references public.profiles(id) on delete cascade,
  amount     int not null default 1 check (amount > 0 and amount <= 99),
  created_at timestamptz not null default now()
);
create index if not exists tips_note_idx on public.tips(note_id);

-- ---------- 8. 关注 ----------
create table if not exists public.follows (
  follower   uuid not null references public.profiles(id) on delete cascade,
  following  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, following),
  check (follower <> following)
);

-- ---------- 9. 屏蔽词 ----------
create table if not exists public.blockwords (
  id         uuid primary key default gen_random_uuid(),
  word       text unique not null check (char_length(word) between 1 and 30),
  created_at timestamptz not null default now()
);

-- ---------- 10. 举报 / 反馈 ----------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter    uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('note','comment')),
  target_id   uuid not null,
  reason      text not null,
  status      text not null default 'open' check (status in ('open','handled','dismissed')),
  created_at  timestamptz not null default now()
);

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  kind       text not null default '建议',
  content    text not null,
  created_at timestamptz not null default now()
);

-- ---------- 11. 广告位 ----------
create table if not exists public.ad_slots (
  id         text primary key,
  name       text not null,
  enabled    boolean not null default false,
  code       text default ''
);
insert into public.ad_slots (id, name, enabled, code) values
  ('tavern-feed-1', '酒肆信息流 · 第 6 位卡片下方', true, ''),
  ('note-bottom-1', '笔记详情 · 正文底部横幅', true, '')
on conflict (id) do nothing;

-- ---------- 11.5 共享书目元数据（同一 ISBN 只查一次，全站复用） ----------
create table if not exists public.book_meta (
  isbn         text primary key check (isbn ~ '^[0-9Xx]{10,13}$'),
  title        text not null,
  author       text,
  publisher    text,
  cover_url    text,
  contributed_by uuid references public.profiles(id) on delete set null,
  updated_at   timestamptz not null default now()
);

alter table public.book_meta enable row level security;

drop policy if exists book_meta_read on public.book_meta;
create policy book_meta_read on public.book_meta for select using (true);

drop policy if exists book_meta_write on public.book_meta;
create policy book_meta_write on public.book_meta for insert
  with check (auth.uid() is not null);
drop policy if exists book_meta_update on public.book_meta;
create policy book_meta_update on public.book_meta for update
  using (auth.uid() is not null);

-- ---------- 12. 计数触发器 ----------
create or replace function public.sync_like_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    if new.target_type = 'note' then
      update public.notes set like_count = like_count + 1 where id = new.target_id;
    else
      update public.comments set like_count = like_count + 1 where id = new.target_id;
    end if;
  elsif (tg_op = 'DELETE') then
    if old.target_type = 'note' then
      update public.notes set like_count = greatest(like_count - 1, 0) where id = old.target_id;
    else
      update public.comments set like_count = greatest(like_count - 1, 0) where id = old.target_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_sync on public.likes;
create trigger likes_sync
  after insert or delete on public.likes
  for each row execute function public.sync_like_count();

create or replace function public.sync_tip_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.notes
     set tip_count = tip_count + coalesce(new.amount, 0)
   where id = new.note_id;
  return null;
end;
$$;

drop trigger if exists tips_sync on public.tips;
create trigger tips_sync
  after insert on public.tips
  for each row execute function public.sync_tip_count();

-- ---------- 13. 行级权限 ----------
alter table public.profiles  enable row level security;
alter table public.categories enable row level security;
alter table public.books     enable row level security;
alter table public.notes     enable row level security;
alter table public.comments  enable row level security;
alter table public.likes     enable row level security;
alter table public.tips      enable row level security;
alter table public.follows   enable row level security;
alter table public.blockwords enable row level security;
alter table public.reports   enable row level security;
alter table public.feedback  enable row level security;
alter table public.ad_slots  enable row level security;

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (auth.uid() = id);

-- categories / books：公开可读，自己可写
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (true);
drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists books_read on public.books;
create policy books_read on public.books for select using (true);
drop policy if exists books_write on public.books;
create policy books_write on public.books for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notes：公开已发布 + 关注者可见（且我在关注） + 自己的
drop policy if exists notes_read on public.notes;
create policy notes_read on public.notes for select using (
  user_id = auth.uid()
  or (
    status = 'published'
    and (
      visibility = 'public'
      or (
        visibility = 'followers'
        and exists (
          select 1 from public.follows f
          where f.follower = auth.uid() and f.following = notes.user_id
        )
      )
    )
  )
);
drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes for insert
  with check (auth.uid() = user_id);
drop policy if exists notes_update on public.notes;
create policy notes_update on public.notes for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes for delete using (auth.uid() = user_id);

-- comments
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select using (
  status = 'published' or user_id = auth.uid()
);
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete using (auth.uid() = user_id);

-- likes / follows / tips
drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select using (true);
drop policy if exists likes_write on public.likes;
create policy likes_write on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows for select using (true);
drop policy if exists follows_write on public.follows;
create policy follows_write on public.follows for all using (auth.uid() = follower) with check (auth.uid() = follower);

drop policy if exists tips_read on public.tips;
create policy tips_read on public.tips for select using (true);
drop policy if exists tips_insert on public.tips;
create policy tips_insert on public.tips for insert with check (auth.uid() = from_user);

-- 屏蔽词：登录用户可读；仅馆主可改
drop policy if exists blockwords_read on public.blockwords;
create policy blockwords_read on public.blockwords for select using (auth.uid() is not null);
drop policy if exists blockwords_write on public.blockwords;
create policy blockwords_write on public.blockwords for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
);

-- 举报 / 反馈：可提交，只有馆主能看
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert with check (auth.uid() is not null);
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
);

drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback for insert with check (true);
drop policy if exists feedback_read on public.feedback;
create policy feedback_read on public.feedback for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
);

-- 广告位：所有人可读启用的，馆主可写
drop policy if exists ad_slots_read on public.ad_slots;
create policy ad_slots_read on public.ad_slots for select using (enabled or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'
));
drop policy if exists ad_slots_write on public.ad_slots;
create policy ad_slots_write on public.ad_slots for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
);

-- ---------- 14. 存储：封面图 ----------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists covers_read on storage.objects;
create policy covers_read on storage.objects for select using (bucket_id = 'covers');
drop policy if exists covers_write on storage.objects;
create policy covers_write on storage.objects for insert
  with check (bucket_id = 'covers' and auth.role() = 'authenticated');
drop policy if exists covers_update on storage.objects;
create policy covers_update on storage.objects for update
  using (bucket_id = 'covers' and owner = auth.uid());

-- ---------- 15. 初始屏蔽词（按需增删） ----------
insert into public.blockwords (word) values
  ('加微信'), ('私聊我'), ('刷单'), ('兼职日结'), ('引流'), ('二维码'),
  ('博彩'), ('赌博'), ('杀猪盘'), ('洗钱'), ('代开发票'), ('办假证'),
  ('傻逼'), ('脑残'), ('智障'), ('去死'), ('贱人'),
  ('约炮'), ('裸聊'), ('黄片'), ('包养'),
  ('枪支'), ('毒品'), ('迷药'), ('外挂'), ('论文代写')
on conflict (word) do nothing;

-- ---------- 完成 ----------
-- 下一步：Authentication → Providers → Email 里关闭「Confirm email」（内测期）
-- 或配置自有 SMTP；Storage 里确认 covers 桶为 public。

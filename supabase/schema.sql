create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'college_type') then
    create type public.college_type as enum (
      'chung_chi',
      'new_asia',
      'united',
      'shaw',
      'morningside',
      's_h_ho',
      'cw_chu',
      'wu_yee_sun',
      'lee_woo_sing',
      'postgraduate',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('active', 'suspended', 'deleted');
  end if;

  if not exists (select 1 from pg_type where typname = 'item_category') then
    create type public.item_category as enum (
      'electronics',
      'furniture',
      'dorm',
      'kitchen',
      'textbook',
      'clothing',
      'sports',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'item_condition') then
    create type public.item_condition as enum (
      'new',
      'like_new',
      'good',
      'usable',
      'flawed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'item_status') then
    create type public.item_status as enum (
      'available',
      'reserved',
      'sold',
      'off_shelf'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'group_status') then
    create type public.group_status as enum (
      'recruiting',
      'formed',
      'closed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'participant_status') then
    create type public.participant_status as enum ('joined', 'left', 'removed');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type public.report_reason as enum (
      'scam',
      'fake_item',
      'harassment',
      'inappropriate',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum (
      'pending',
      'reviewing',
      'resolved',
      'rejected'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'report_target_type') then
    create type public.report_target_type as enum ('item', 'group', 'user');
  end if;

  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('owner', 'moderator');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  display_name text not null default 'CUHK Student',
  wechat_id text,
  college public.college_type,
  dormitory text,
  avatar_url text,
  bio text,
  status public.user_status not null default 'active',
  email_verified_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_cuhk_email_check
    check (email ~* '^[^@]+@(link\.cuhk\.edu\.hk|cuhk\.edu\.hk)$'),
  constraint users_display_name_len check (char_length(display_name) between 1 and 60),
  constraint users_wechat_id_len check (wechat_id is null or char_length(wechat_id) between 3 and 64)
);

create table if not exists public.admins (
  user_id uuid primary key references public.users(id) on delete cascade,
  role public.admin_role not null default 'moderator',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(10, 2) not null,
  currency text not null default 'HKD',
  category public.item_category not null,
  condition public.item_condition not null,
  dormitory text,
  college public.college_type,
  handover_location text not null,
  status public.item_status not null default 'available',
  view_count integer not null default 0,
  share_count integer not null default 0,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(dormitory, '') || ' ' ||
      coalesce(handover_location, '')
    )
  ) stored,
  published_at timestamptz not null default now(),
  reserved_at timestamptz,
  sold_at timestamptz,
  off_shelf_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_title_len check (char_length(title) between 1 and 80),
  constraint items_description_len check (char_length(description) between 1 and 2000),
  constraint items_price_non_negative check (price >= 0),
  constraint items_currency_hkd check (currency = 'HKD')
);

create table if not exists public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  storage_path text not null unique,
  public_url text,
  width integer,
  height integer,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  constraint item_images_sort_order_check check (sort_order between 1 and 9)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  source_platform text not null,
  total_price numeric(10, 2),
  per_person_price numeric(10, 2),
  currency text not null default 'HKD',
  target_size integer not null,
  current_size integer not null default 1,
  deadline_at timestamptz not null,
  dormitory text,
  college public.college_type,
  handover_location text not null,
  status public.group_status not null default 'recruiting',
  view_count integer not null default 0,
  share_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  closed_at timestamptz,
  constraint groups_title_len check (char_length(title) between 1 and 80),
  constraint groups_description_len check (char_length(description) between 1 and 2000),
  constraint groups_price_non_negative check (
    (total_price is null or total_price >= 0)
    and (per_person_price is null or per_person_price >= 0)
  ),
  constraint groups_target_size_check check (target_size >= 2),
  constraint groups_current_size_check check (current_size >= 0),
  constraint groups_currency_hkd check (currency = 'HKD')
);

create table if not exists public.group_participants (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.participant_status not null default 'joined',
  note text,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id),
  constraint group_participants_note_len check (note is null or char_length(note) <= 300)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_type public.report_target_type not null,
  target_item_id uuid references public.items(id) on delete cascade,
  target_group_id uuid references public.groups(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete cascade,
  reason public.report_reason not null,
  description text,
  status public.report_status not null default 'pending',
  handled_by uuid references public.users(id) on delete set null,
  handled_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_description_len check (description is null or char_length(description) <= 2000),
  constraint reports_admin_note_len check (admin_note is null or char_length(admin_note) <= 2000),
  constraint reports_single_target_check check (
    (target_type = 'item' and target_item_id is not null and target_group_id is null and target_user_id is null)
    or
    (target_type = 'group' and target_item_id is null and target_group_id is not null and target_user_id is null)
    or
    (target_type = 'user' and target_item_id is null and target_group_id is null and target_user_id is not null)
  )
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_college_idx on public.users (college);
create index if not exists users_dormitory_idx on public.users (dormitory);

create index if not exists admins_role_idx on public.admins (role);

create index if not exists items_seller_idx on public.items (seller_id);
create index if not exists items_status_created_idx on public.items (status, created_at desc);
create index if not exists items_category_idx on public.items (category);
create index if not exists items_college_idx on public.items (college);
create index if not exists items_dormitory_idx on public.items (dormitory);
create index if not exists items_search_idx on public.items using gin (search_vector);

create index if not exists item_images_item_sort_idx on public.item_images (item_id, sort_order);

create index if not exists groups_leader_idx on public.groups (leader_id);
create index if not exists groups_status_deadline_idx on public.groups (status, deadline_at);
create index if not exists groups_created_idx on public.groups (created_at desc);
create index if not exists groups_platform_idx on public.groups (source_platform);
create index if not exists groups_college_idx on public.groups (college);
create index if not exists groups_dormitory_idx on public.groups (dormitory);

create index if not exists group_participants_user_idx on public.group_participants (user_id, status);
create index if not exists group_participants_group_status_idx on public.group_participants (group_id, status);

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_target_item_idx on public.reports (target_item_id);
create index if not exists reports_target_group_idx on public.reports (target_group_id);
create index if not exists reports_target_user_idx on public.reports (target_user_id);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
before update on public.items
for each row execute function public.set_updated_at();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists set_group_participants_updated_at on public.group_participants;
create trigger set_group_participants_updated_at
before update on public.group_participants
for each row execute function public.set_updated_at();

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, email_verified_at)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), 'CUHK Student'),
    case when new.email_confirmed_at is not null then new.email_confirmed_at else now() end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.enforce_item_image_limit()
returns trigger
language plpgsql
as $$
declare
  image_count integer;
begin
  select count(*)
  into image_count
  from public.item_images
  where item_id = new.item_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if image_count >= 9 then
    raise exception 'An item can have at most 9 images.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_item_image_limit_trigger on public.item_images;
create trigger enforce_item_image_limit_trigger
before insert or update on public.item_images
for each row execute function public.enforce_item_image_limit();

create or replace function public.add_group_leader_as_participant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_participants (group_id, user_id, status)
  values (new.id, new.leader_id, 'joined')
  on conflict (group_id, user_id)
  do update set status = 'joined', left_at = null, updated_at = now();

  return new;
end;
$$;

drop trigger if exists add_group_leader_as_participant_trigger on public.groups;
create trigger add_group_leader_as_participant_trigger
after insert on public.groups
for each row execute function public.add_group_leader_as_participant();

create or replace function public.sync_group_current_size()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
  active_count integer;
begin
  target_group_id = coalesce(new.group_id, old.group_id);

  select count(*)
  into active_count
  from public.group_participants
  where group_id = target_group_id
    and status = 'joined';

  update public.groups
  set
    current_size = active_count,
    status = case
      when status in ('recruiting', 'formed') and active_count >= target_size then 'formed'::public.group_status
      when status in ('recruiting', 'formed') and active_count < target_size then 'recruiting'::public.group_status
      else status
    end
  where id = target_group_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_group_current_size_trigger on public.group_participants;
create trigger sync_group_current_size_trigger
after insert or update or delete on public.group_participants
for each row execute function public.sync_group_current_size();

create or replace function public.get_item_contact(p_item_id uuid)
returns table (display_name text, wechat_id text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  return query
  select u.display_name, u.wechat_id
  from public.items i
  join public.users u on u.id = i.seller_id
  where i.id = p_item_id
    and i.status in ('available', 'reserved', 'sold');
end;
$$;

create or replace function public.get_group_contact(p_group_id uuid)
returns table (display_name text, wechat_id text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  return query
  select u.display_name, u.wechat_id
  from public.groups g
  join public.users u on u.id = g.leader_id
  where g.id = p_group_id
    and g.status in ('recruiting', 'formed', 'closed');
end;
$$;

grant execute on function public.get_item_contact(uuid) to authenticated;
grant execute on function public.get_group_contact(uuid) to authenticated;

alter table public.users enable row level security;
alter table public.admins enable row level security;
alter table public.items enable row level security;
alter table public.item_images enable row level security;
alter table public.groups enable row level security;
alter table public.group_participants enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can read admin list" on public.admins;
create policy "Admins can read admin list"
on public.admins for select
to authenticated
using (public.is_admin() or user_id = auth.uid());

drop policy if exists "Owners can manage admins" on public.admins;
create policy "Owners can manage admins"
on public.admins for all
to authenticated
using (
  exists (
    select 1 from public.admins a
    where a.user_id = auth.uid()
      and a.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.admins a
    where a.user_id = auth.uid()
      and a.role = 'owner'
  )
);

drop policy if exists "Anyone can read visible items" on public.items;
create policy "Anyone can read visible items"
on public.items for select
to anon, authenticated
using (status in ('available', 'reserved', 'sold') or seller_id = auth.uid() or public.is_admin());

drop policy if exists "Users can create own items" on public.items;
create policy "Users can create own items"
on public.items for insert
to authenticated
with check (seller_id = auth.uid());

drop policy if exists "Sellers and admins can update items" on public.items;
create policy "Sellers and admins can update items"
on public.items for update
to authenticated
using (seller_id = auth.uid() or public.is_admin())
with check (seller_id = auth.uid() or public.is_admin());

drop policy if exists "Sellers and admins can delete items" on public.items;
create policy "Sellers and admins can delete items"
on public.items for delete
to authenticated
using (seller_id = auth.uid() or public.is_admin());

drop policy if exists "Anyone can read visible item images" on public.item_images;
create policy "Anyone can read visible item images"
on public.item_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.items i
    where i.id = item_id
      and (i.status in ('available', 'reserved', 'sold') or i.seller_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Sellers can manage item images" on public.item_images;
create policy "Sellers can manage item images"
on public.item_images for all
to authenticated
using (
  exists (
    select 1 from public.items i
    where i.id = item_id
      and (i.seller_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.items i
    where i.id = item_id
      and (i.seller_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Anyone can read visible groups" on public.groups;
create policy "Anyone can read visible groups"
on public.groups for select
to anon, authenticated
using (status in ('recruiting', 'formed', 'closed') or leader_id = auth.uid() or public.is_admin());

drop policy if exists "Users can create own groups" on public.groups;
create policy "Users can create own groups"
on public.groups for insert
to authenticated
with check (leader_id = auth.uid());

drop policy if exists "Leaders and admins can update groups" on public.groups;
create policy "Leaders and admins can update groups"
on public.groups for update
to authenticated
using (leader_id = auth.uid() or public.is_admin())
with check (leader_id = auth.uid() or public.is_admin());

drop policy if exists "Leaders and admins can delete groups" on public.groups;
create policy "Leaders and admins can delete groups"
on public.groups for delete
to authenticated
using (leader_id = auth.uid() or public.is_admin());

drop policy if exists "Participants can read own memberships" on public.group_participants;
create policy "Participants can read own memberships"
on public.group_participants for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.groups g
    where g.id = group_id
      and g.leader_id = auth.uid()
  )
);

drop policy if exists "Users can join groups as themselves" on public.group_participants;
create policy "Users can join groups as themselves"
on public.group_participants for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'joined'
  and exists (
    select 1 from public.groups g
    where g.id = group_id
      and g.status = 'recruiting'
      and g.deadline_at > now()
  )
);

drop policy if exists "Users can update own memberships" on public.group_participants;
create policy "Users can update own memberships"
on public.group_participants for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.groups g
    where g.id = group_id
      and g.leader_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.groups g
    where g.id = group_id
      and g.leader_id = auth.uid()
  )
);

drop policy if exists "Users can read own reports and admins read all" on public.reports;
create policy "Users can read own reports and admins read all"
on public.reports for select
to authenticated
using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "Users can create own reports" on public.reports;
create policy "Users can create own reports"
on public.reports for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
on public.reports for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public item images are readable" on storage.objects;
create policy "Public item images are readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'item-images');

drop policy if exists "Authenticated users can upload item images" on storage.objects;
create policy "Authenticated users can upload item images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'item-images');

drop policy if exists "Authenticated users can update item images" on storage.objects;
create policy "Authenticated users can update item images"
on storage.objects for update
to authenticated
using (bucket_id = 'item-images')
with check (bucket_id = 'item-images');

drop policy if exists "Authenticated users can delete item images" on storage.objects;
create policy "Authenticated users can delete item images"
on storage.objects for delete
to authenticated
using (bucket_id = 'item-images');

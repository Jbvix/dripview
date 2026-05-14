-- ============================================================
-- DripView Fleet Schema — Supabase PostgreSQL
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Organizations (port companies / operators)
create table organizations (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  port      text,
  country   text default 'BR',
  created_at timestamptz default now()
);

-- Profiles (extends Supabase Auth — one row per auth.user)
create table profiles (
  id       uuid primary key references auth.users(id) on delete cascade,
  org_id   uuid references organizations(id) on delete cascade not null,
  name     text not null,
  role     text default 'operator' check (role in ('operator','supervisor','admin')),
  created_at timestamptz default now()
);

-- Equipment (diesel engines / machines per organization)
create table equipment (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid references organizations(id) on delete cascade not null,
  name                     text not null,          -- "Rebocador Atlântico — Motor Principal"
  vessel                   text,                   -- "Rebocador Atlântico"
  engine_model             text,                   -- "Caterpillar 3512"
  oil_spec                 text,                   -- "SAE 40 CF-4"
  oil_capacity_liters      numeric,
  max_hours_between_changes integer,
  active                   boolean default true,
  notes                    text,
  created_at               timestamptz default now()
);

-- Analyses (one row per blotter spot test)
create table analyses (
  id                    uuid primary key default gen_random_uuid(),
  equipment_id          uuid references equipment(id) on delete cascade not null,
  user_id               uuid references profiles(id) not null,
  analyzed_at           timestamptz not null,
  condition             text not null check (condition in ('bom','atencao','critico')),
  score                 integer check (score between 0 and 100),
  color_data            jsonb,       -- { nucleo, difusao, halo } with rgb/hsl/darkness
  reference_color_data  jsonb,       -- same structure for reference image
  analysis_json         jsonb not null,  -- full KRATOS response
  image_url             text,        -- Supabase Storage path
  reference_image_url   text,
  is_comparative        boolean default false,
  user_notes            text,
  confirmed_by_lab      boolean default false,
  lab_result            jsonb,       -- { kin_viscosity, tan, tbn, fe_ppm, ... }
  lab_notes             text,
  device_id             text,        -- for offline sync dedup
  synced_at             timestamptz default now()
);

-- ── Indexes ─────────────────────────────────────────────────
create index analyses_equipment_id_analyzed_at
  on analyses(equipment_id, analyzed_at desc);

create index analyses_condition_score
  on analyses(equipment_id, condition, score);

-- ── Row Level Security ───────────────────────────────────────
alter table organizations enable row level security;
alter table profiles      enable row level security;
alter table equipment     enable row level security;
alter table analyses      enable row level security;

-- Helper: get caller's org_id without recursion
create or replace function current_org_id()
returns uuid language sql security definer stable as $$
  select org_id from profiles where id = auth.uid()
$$;

-- Organizations: member sees own org only
create policy "org_read_own" on organizations
  for select using (id = current_org_id());

-- Profiles: read own org; update own row
create policy "profiles_read_org" on profiles
  for select using (org_id = current_org_id());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- Equipment: full CRUD within own org
create policy "equipment_org_all" on equipment
  for all using (org_id = current_org_id())
  with check (org_id = current_org_id());

-- Analyses: full CRUD within own org's equipment
create policy "analyses_org_all" on analyses
  for all using (
    equipment_id in (
      select id from equipment where org_id = current_org_id()
    )
  )
  with check (
    equipment_id in (
      select id from equipment where org_id = current_org_id()
    )
  );

-- ── Storage bucket (images) ──────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket
-- Name: analysis-images   Access: private
-- Then add policy: authenticated users read/write own org path
-- Path convention: {org_id}/{equipment_id}/{analysis_id}/spot.jpg
--                  {org_id}/{equipment_id}/{analysis_id}/ref.jpg

-- ── Trigger: auto-create profile after signup ────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- org_id and name must be passed via raw_user_meta_data at signup
  insert into profiles(id, org_id, name, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'org_id')::uuid,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'operator')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

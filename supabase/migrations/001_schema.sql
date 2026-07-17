-- ============================================================
-- Mantis — core schema
--
-- Multi-user, private per owner. Every domain row carries owner_id and is
-- isolated by RLS (002_rls.sql) as owner_id = auth.uid(). The API layer uses
-- the service-role key and enforces the same scoping in code.
-- ============================================================

-- Shared trigger: keep updated_at fresh on every UPDATE.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── user_profiles ─────────────────────────────────────────────────────────────
-- One row per auth user. settings holds per-user config, notably the follow-up
-- "quiet" thresholds (days) per contact class.
create table user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role         text not null default 'user' check (role in ('user', 'admin')),
  settings     jsonb not null default
                 '{"quiet_thresholds": {"target": 14, "reach": 30, "backup": 60}}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger user_profiles_updated_at before update on user_profiles
  for each row execute function set_updated_at();

-- ── tags ──────────────────────────────────────────────────────────────────────
-- Owner-scoped catalog powering every fixed dropdown. Managed in Settings.
create table tags (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  category   text not null check (category in (
               'contact_class', 'recruiting_channel', 'action_type',
               'position_title', 'wishlist_status', 'label')),
  value      text not null,
  color      text,
  sort_order int  not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, category, value)
);
create index on tags (owner_id, category);
create trigger tags_updated_at before update on tags
  for each row execute function set_updated_at();

-- ── companies ─────────────────────────────────────────────────────────────────
create table companies (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  uuid not null references auth.users(id) on delete cascade,
  name                      text not null,
  website                   text,
  industry                  text,
  location                  text,
  description               text,           -- "what they do"
  recruiting_channel_tag_id uuid references tags(id) on delete set null,
  priority_tag_id           uuid references tags(id) on delete set null, -- contact_class values
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);
create unique index companies_owner_name_uniq
  on companies (owner_id, lower(name)) where deleted_at is null;
create index on companies (owner_id);
create trigger companies_updated_at before update on companies
  for each row execute function set_updated_at();

-- ── contacts ──────────────────────────────────────────────────────────────────
-- A person always belongs to a company (no loose knots).
create table contacts (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users(id) on delete cascade,
  company_id         uuid not null references companies(id) on delete cascade,
  full_name          text not null,
  title_tag_id       uuid references tags(id) on delete set null, -- position_title
  title_free         text,                                        -- free-text fallback
  class_tag_id       uuid references tags(id) on delete set null, -- contact_class
  how_i_know         text,
  email              text,
  phone              text,
  linkedin_url       text,
  next_follow_up_date date,   -- denormalized cache of the soonest open follow-up
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create index on contacts (owner_id);
create index on contacts (company_id);
create trigger contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

-- ── actions ───────────────────────────────────────────────────────────────────
-- The event log. A contact's "last action" is the newest by occurred_on.
create table actions (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  contact_id       uuid not null references contacts(id) on delete cascade,
  type_tag_id      uuid references tags(id) on delete set null, -- action_type
  occurred_on      date not null default current_date,
  summary          text,
  follow_up_on     date,
  follow_up_done_at timestamptz,
  source           text not null default 'app'
                     check (source in ('app', 'api', 'whatsapp', 'claude')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on actions (owner_id);
create index on actions (contact_id, occurred_on desc);
create index on actions (follow_up_on) where follow_up_done_at is null;
create trigger actions_updated_at before update on actions
  for each row execute function set_updated_at();

-- ── notes ─────────────────────────────────────────────────────────────────────
-- Linked notes (to a contact/action) surface on profiles. status='inbox' with
-- no links is a jot note awaiting classification (e.g. captured via WhatsApp).
create table notes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  contact_id uuid references contacts(id) on delete cascade,
  action_id  uuid references actions(id) on delete cascade,
  source     text not null default 'app'
               check (source in ('app', 'api', 'whatsapp', 'claude')),
  source_ref text,   -- external id (e.g. WhatsApp message id) for idempotency
  status     text not null default 'linked' check (status in ('inbox', 'linked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on notes (owner_id);
create index on notes (contact_id);
create index on notes (owner_id, status);
-- Idempotent capture: a given (source, source_ref) saves at most once per owner.
create unique index notes_source_ref_uniq
  on notes (owner_id, source, source_ref) where source_ref is not null;
create trigger notes_updated_at before update on notes
  for each row execute function set_updated_at();

-- ── wishlist_positions ────────────────────────────────────────────────────────
create table wishlist_positions (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  company_id    uuid references companies(id) on delete set null,
  title         text not null,
  url           text,
  status_tag_id uuid references tags(id) on delete set null, -- wishlist_status
  notes         text,
  follow_up_on  date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on wishlist_positions (owner_id);
create trigger wishlist_positions_updated_at before update on wishlist_positions
  for each row execute function set_updated_at();

-- ── entity_tags ───────────────────────────────────────────────────────────────
-- Free-form many-to-many labels on companies/contacts.
create table entity_tags (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('company', 'contact')),
  entity_id   uuid not null,
  tag_id      uuid not null references tags(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (owner_id, entity_type, entity_id, tag_id)
);
create index on entity_tags (owner_id, entity_type, entity_id);

-- ── api_tokens ────────────────────────────────────────────────────────────────
-- Personal access tokens (mnt_…) for Secretariat/Claude. Only the hash is stored.
create table api_tokens (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text,
  token_hash   text not null unique,
  scopes       text[] not null default '{}',
  last_used_at timestamptz,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index on api_tokens (owner_id);

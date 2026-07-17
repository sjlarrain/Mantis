-- ============================================================
-- Mantis — Row Level Security
--
-- Every domain table is private to its owner. Interactive/browser access goes
-- through the anon key and is confined by these policies. The API layer uses the
-- service-role key (bypasses RLS) and enforces owner scoping in code.
-- ============================================================

alter table user_profiles       enable row level security;
alter table tags                enable row level security;
alter table companies           enable row level security;
alter table contacts            enable row level security;
alter table actions             enable row level security;
alter table notes               enable row level security;
alter table wishlist_positions  enable row level security;
alter table entity_tags         enable row level security;
alter table api_tokens          enable row level security;

-- user_profiles is keyed by the auth uid itself.
create policy "own profile" on user_profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Every other table: owner_id must be the current user.
create policy "own tags" on tags
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own companies" on companies
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own contacts" on contacts
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own actions" on actions
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own notes" on notes
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own wishlist" on wishlist_positions
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own entity_tags" on entity_tags
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own api_tokens" on api_tokens
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ============================================================
-- New-user bootstrap: create a profile and seed default tags.
-- SECURITY DEFINER so it can write regardless of the caller's RLS context.
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into user_profiles (id) values (new.id);

  insert into tags (owner_id, category, value, sort_order) values
    (new.id, 'contact_class', 'Target', 0),
    (new.id, 'contact_class', 'Reach', 1),
    (new.id, 'contact_class', 'Backup', 2),
    (new.id, 'recruiting_channel', 'OCR', 0),
    (new.id, 'recruiting_channel', 'BCR', 1),
    (new.id, 'recruiting_channel', 'Academic Intern', 2),
    (new.id, 'action_type', 'Meeting', 0),
    (new.id, 'action_type', 'Cold outreach', 1),
    (new.id, 'action_type', 'Email response', 2),
    (new.id, 'action_type', 'Coffee chat', 3),
    (new.id, 'action_type', 'Intro', 4),
    (new.id, 'action_type', 'Panel', 5),
    (new.id, 'action_type', 'LinkedIn message', 6),
    (new.id, 'wishlist_status', 'Interested', 0),
    (new.id, 'wishlist_status', 'Applied', 1),
    (new.id, 'wishlist_status', 'Interviewing', 2),
    (new.id, 'wishlist_status', 'Offer', 3),
    (new.id, 'wishlist_status', 'Closed', 4);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

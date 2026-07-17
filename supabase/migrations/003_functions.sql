-- ============================================================
-- Mantis — transactional helpers and read views
-- ============================================================

-- ── create_contact_bundle ──────────────────────────────────────────────────────
-- "No loose knots": create a company (if new) + contact + optional first action
-- + optional note in ONE transaction. A plpgsql function body is a single
-- transaction, so any failure rolls back every write — never a contact without a
-- company. Used by both the web forms and the API.
--
-- Params (all owner-scoped to p_owner):
--   p_company : { "id": uuid }            -> link existing company (must be owner's)
--             | { "name": text, ... }     -> create a new company
--   p_contact : { "full_name": text, ... other contact columns }
--   p_action  : optional { "occurred_on": date, "summary": text, "type_tag_id": uuid, ... }
--   p_note    : optional { "body": text }
-- Returns: { company_id, contact_id, action_id, note_id }
create or replace function create_contact_bundle(
  p_owner   uuid,
  p_company jsonb,
  p_contact jsonb,
  p_action  jsonb default null,
  p_note    jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_company_id uuid;
  v_contact_id uuid;
  v_action_id  uuid;
  v_note_id    uuid;
begin
  -- Company: link existing (verify ownership) or create new.
  if p_company ? 'id' then
    select id into v_company_id from companies
      where id = (p_company->>'id')::uuid and owner_id = p_owner and deleted_at is null;
    if v_company_id is null then
      raise exception 'COMPANY_NOT_FOUND';
    end if;
  else
    if coalesce(p_company->>'name', '') = '' then
      raise exception 'COMPANY_NAME_REQUIRED';
    end if;
    insert into companies (owner_id, name, website, industry, location, description,
                           recruiting_channel_tag_id, priority_tag_id, notes)
    values (
      p_owner,
      p_company->>'name',
      p_company->>'website',
      p_company->>'industry',
      p_company->>'location',
      p_company->>'description',
      nullif(p_company->>'recruiting_channel_tag_id', '')::uuid,
      nullif(p_company->>'priority_tag_id', '')::uuid,
      p_company->>'notes'
    )
    returning id into v_company_id;
  end if;

  -- Contact (always created, always attached to the company above).
  if coalesce(p_contact->>'full_name', '') = '' then
    raise exception 'CONTACT_NAME_REQUIRED';
  end if;
  insert into contacts (owner_id, company_id, full_name, title_tag_id, title_free,
                        class_tag_id, how_i_know, email, phone, linkedin_url)
  values (
    p_owner,
    v_company_id,
    p_contact->>'full_name',
    nullif(p_contact->>'title_tag_id', '')::uuid,
    p_contact->>'title_free',
    nullif(p_contact->>'class_tag_id', '')::uuid,
    p_contact->>'how_i_know',
    p_contact->>'email',
    p_contact->>'phone',
    p_contact->>'linkedin_url'
  )
  returning id into v_contact_id;

  -- Optional first action.
  if p_action is not null then
    insert into actions (owner_id, contact_id, type_tag_id, occurred_on, summary,
                         follow_up_on, source)
    values (
      p_owner,
      v_contact_id,
      nullif(p_action->>'type_tag_id', '')::uuid,
      coalesce((p_action->>'occurred_on')::date, current_date),
      p_action->>'summary',
      nullif(p_action->>'follow_up_on', '')::date,
      coalesce(p_action->>'source', 'app')
    )
    returning id into v_action_id;
  end if;

  -- Optional note, linked to the contact (and action if present).
  if p_note is not null and coalesce(p_note->>'body', '') <> '' then
    insert into notes (owner_id, body, contact_id, action_id, source, status)
    values (
      p_owner,
      p_note->>'body',
      v_contact_id,
      v_action_id,
      coalesce(p_note->>'source', 'app'),
      'linked'
    )
    returning id into v_note_id;
  end if;

  return jsonb_build_object(
    'company_id', v_company_id,
    'contact_id', v_contact_id,
    'action_id',  v_action_id,
    'note_id',    v_note_id
  );
end;
$$;

-- ── contact_last_action ─────────────────────────────────────────────────────────
-- One row per live contact with its most recent action date. The dashboard joins
-- this with user_profiles.settings to compute "quiet" contacts in the app (the
-- threshold math lives in src/lib/followups.ts and is unit-tested there).
create view contact_last_action as
  select
    c.id            as contact_id,
    c.owner_id,
    c.company_id,
    c.full_name,
    c.class_tag_id,
    c.next_follow_up_date,
    la.last_action_on
  from contacts c
  left join lateral (
    select max(a.occurred_on) as last_action_on
    from actions a
    where a.contact_id = c.id
  ) la on true
  where c.deleted_at is null;

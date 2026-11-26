-- Enforce rolling account-change limits directly in Supabase Auth.
--
-- Email changes:
--   2 successful changes per rolling 24 hours
--   4 successful changes per rolling 14 days
--   5 successful changes per rolling 31 days
--
-- Password changes:
--   4 successful changes per rolling 24 hours
--   8 successful changes per rolling 14 days
--   10 successful changes per rolling 31 days
--
-- Only completed changes are recorded:
--   - Email: when auth.users.email actually changes after verification.
--   - Password: when auth.users.encrypted_password actually changes.
--
-- The audit record and Auth update share one transaction. If the Auth
-- update fails, the audit insert is rolled back as well.

-- Keep account-change records outside the API-exposed public schema.
create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated, service_role;

create table private.account_change_events (
  id bigint generated always as identity primary key,
  user_id uuid not null
    references auth.users (id)
    on delete cascade,
  change_type text not null
    check (change_type in ('email', 'password')),
  changed_at timestamptz not null default clock_timestamp()
);

comment on table private.account_change_events is
  'Private audit log used to enforce rolling email and password change limits.';

comment on column private.account_change_events.change_type is
  'The completed account change: email or password.';

comment on column private.account_change_events.changed_at is
  'Database timestamp when the completed account change was recorded.';

create index account_change_events_user_type_time_idx
  on private.account_change_events (
    user_id,
    change_type,
    changed_at desc
  );

alter table private.account_change_events enable row level security;

-- No application role may read or modify the audit records directly.
revoke all on table private.account_change_events
  from public, anon, authenticated, service_role;

-- Enforce limits in the same transaction as the Auth update.
create or replace function private.enforce_account_change_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();

  v_email_changed boolean;
  v_password_changed boolean;

  v_24h bigint;
  v_14d bigint;
  v_31d bigint;
begin
  v_email_changed :=
    new.email is distinct from old.email;

  v_password_changed :=
    new.encrypted_password is distinct from old.encrypted_password;

  -- Nothing to count if neither protected value actually changed.
  if not v_email_changed and not v_password_changed then
    return new;
  end if;

  -- Serialize account changes for this user. This prevents concurrent
  -- requests from both passing a limit based on the same previous count.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.id::text, 0)
  );

  -- Email limits are based on completed email changes only.
  if v_email_changed then
    select
      count(*) filter (
        where changed_at >= v_now - interval '24 hours'
      ),
      count(*) filter (
        where changed_at >= v_now - interval '14 days'
      ),
      count(*) filter (
        where changed_at >= v_now - interval '31 days'
      )
    into v_24h, v_14d, v_31d
    from private.account_change_events
    where user_id = new.id
      and change_type = 'email'
      and changed_at >= v_now - interval '31 days';

    if v_24h >= 2 then
      raise exception using
        errcode = 'P0001',
        message = 'EMAIL_CHANGE_LIMIT_24H';
    end if;

    if v_14d >= 4 then
      raise exception using
        errcode = 'P0001',
        message = 'EMAIL_CHANGE_LIMIT_14D';
    end if;

    if v_31d >= 5 then
      raise exception using
        errcode = 'P0001',
        message = 'EMAIL_CHANGE_LIMIT_31D';
    end if;
  end if;

  -- Password limits include successful password resets because both
  -- password-change and recovery flows ultimately update encrypted_password.
  if v_password_changed then
    select
      count(*) filter (
        where changed_at >= v_now - interval '24 hours'
      ),
      count(*) filter (
        where changed_at >= v_now - interval '14 days'
      ),
      count(*) filter (
        where changed_at >= v_now - interval '31 days'
      )
    into v_24h, v_14d, v_31d
    from private.account_change_events
    where user_id = new.id
      and change_type = 'password'
      and changed_at >= v_now - interval '31 days';

    if v_24h >= 4 then
      raise exception using
        errcode = 'P0001',
        message = 'PASSWORD_CHANGE_LIMIT_24H';
    end if;

    if v_14d >= 8 then
      raise exception using
        errcode = 'P0001',
        message = 'PASSWORD_CHANGE_LIMIT_14D';
    end if;

    if v_31d >= 10 then
      raise exception using
        errcode = 'P0001',
        message = 'PASSWORD_CHANGE_LIMIT_31D';
    end if;
  end if;

  -- Record only changes that have passed all applicable limits.
  -- These inserts roll back automatically if the Auth update fails.
  if v_email_changed then
    insert into private.account_change_events (
      user_id,
      change_type,
      changed_at
    )
    values (
      new.id,
      'email',
      v_now
    );
  end if;

  if v_password_changed then
    insert into private.account_change_events (
      user_id,
      change_type,
      changed_at
    )
    values (
      new.id,
      'password',
      v_now
    );
  end if;

  return new;
end;
$$;

-- The function is intended to run only through the Auth database trigger.
revoke all on function private.enforce_account_change_limits()
  from public, anon, authenticated, service_role;

-- Run before Auth persists a changed email or password hash.
create trigger enforce_account_change_limits
before update of email, encrypted_password
on auth.users
for each row
execute function private.enforce_account_change_limits();

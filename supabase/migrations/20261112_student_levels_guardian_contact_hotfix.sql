-- Apply before the frontend release. No existing rows are updated.
begin;

-- Classroom level remains as the legacy/default level; students can choose any level.
alter table public.students
  add column if not exists level_id uuid
  constraint students_level_id_fkey references public.levels(id);

-- Null retains the legacy classroom-derived level on existing students.
-- Foreign keys validate both the selected level and the existing classroom independently.

alter table public.guardians alter column email drop not null;

-- Validate only new/changed contact values so legacy records remain editable.
create or replace function public.validate_guardian_contact_hotfix()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  validate_phone boolean := true;
  validate_email boolean := true;
begin
  if TG_OP = 'UPDATE' then
    validate_phone := new.phone is distinct from old.phone;
    validate_email := new.email is distinct from old.email;
  end if;

  if validate_phone then
    if new.phone is null or
       regexp_replace(btrim(new.phone), '[[:space:]().-]', '', 'g')
         !~ '^(0|\+58)[2-4][0-9]{9}$' then
      raise exception 'Ingresa un teléfono venezolano completo, por ejemplo 04121234567 o +584121234567'
        using errcode = '23514';
    end if;
    new.phone := btrim(new.phone);
  end if;

  if validate_email then
    new.email := nullif(btrim(new.email), '');
    if new.email is not null and new.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'El correo no es válido' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger validate_guardian_contact_hotfix
before insert or update of phone, email on public.guardians
for each row execute function public.validate_guardian_contact_hotfix();

notify pgrst, 'reload schema';
commit;

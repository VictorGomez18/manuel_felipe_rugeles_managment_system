-- Run only on a test database after applying the hotfix migration.
-- Uses a temporary table; never writes existing guardians/students.
begin;
create temporary table hotfix_contacts (id integer, phone text, email text);

-- Legacy contact inserted before the trigger: unrelated edits must still work.
insert into hotfix_contacts values (0, 'legacy', 'legacy');
create trigger test_guardian_contact
before insert or update of phone, email on hotfix_contacts
for each row execute function public.validate_guardian_contact_hotfix();

do $$
declare
  invalid_phone text;
begin
  insert into hotfix_contacts values
    (1, '04121234567', null),
    (2, '+584121234567', 'prueba@example.test'),
    (3, '+58 (412) 123-45-67', '   '),
    (4, '0412-1234567', 'prueba@example.test');

  if exists (select 1 from hotfix_contacts where id in (1, 3) and email is not null) then
    raise exception 'Empty email must be stored as null';
  end if;
  update hotfix_contacts set email = '' where id = 2;
  if exists (select 1 from hotfix_contacts where id = 2 and email is not null) then
    raise exception 'Email must be removable on edit';
  end if;

  foreach invalid_phone in array array['0412', '+58412123', '041212345678', 'abc04121234567'] loop
    begin
      insert into hotfix_contacts values (5, invalid_phone, null);
      raise exception 'Incomplete/invalid phone was accepted';
    exception when check_violation then null;
    end;
  end loop;

  begin
    update hotfix_contacts set email = 'invalido' where id = 1;
    raise exception 'Invalid email was accepted';
  exception when check_violation then null;
  end;

  -- Trigger runs but does not revalidate unchanged legacy contacts.
  update hotfix_contacts set phone = phone, email = email where id = 0;
  raise notice 'Guardian contact SQL tests passed';
end;
$$;
rollback;

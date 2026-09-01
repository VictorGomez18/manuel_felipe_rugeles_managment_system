-- Hardening and workflow centralization for tuition, expenses, payroll, and audit.
-- This migration complements the original schema without modifying the original script in place.

set check_function_bodies = off;

create or replace function public.sync_tuition_obligation_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  if coalesce(new.amount_paid, 0) >= coalesce(new.amount, 0) and coalesce(new.amount, 0) > 0 then
    new.status := 'paid';
  elsif coalesce(new.amount_paid, 0) > 0 then
    if new.due_date < current_date then
      new.status := 'overdue';
    else
      new.status := 'partial';
    end if;
  elsif new.due_date < current_date then
    new.status := 'overdue';
  else
    new.status := 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_tuition_obligation_status_trigger on public.tuition_obligations;
create trigger sync_tuition_obligation_status_trigger
before insert or update of amount, amount_paid, due_date, status
on public.tuition_obligations
for each row
execute function public.sync_tuition_obligation_status();

update public.tuition_obligations
set status = status;

create or replace function public.void_expense(
  p_expense_id uuid,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Motivo obligatorio';
  end if;

  if not exists (
    select 1
    from public.expenses
    where id = p_expense_id
      and status = 'active'
  ) then
    raise exception 'Gasto no encontrado o ya anulado';
  end if;

  update public.expenses
  set status = 'voided',
      voided_at = now(),
      void_reason = p_reason,
      voided_by = auth.uid(),
      updated_at = now()
  where id = p_expense_id;
end;
$$;

create or replace function public.refresh_payroll_period_status(p_payroll_period_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_amount numeric;
  v_due_date date;
  v_paid_amount numeric;
  v_status payroll_status;
begin
  select total_amount, due_date
  into v_total_amount, v_due_date
  from public.payroll_periods
  where id = p_payroll_period_id;

  if not found then
    raise exception 'Periodo de nomina no encontrado';
  end if;

  select coalesce(sum(amount), 0)
  into v_paid_amount
  from public.payroll_payments
  where payroll_period_id = p_payroll_period_id;

  if v_paid_amount >= coalesce(v_total_amount, 0) and coalesce(v_total_amount, 0) > 0 then
    v_status := 'paid';
  elsif v_paid_amount > 0 then
    if v_due_date is not null and v_due_date < current_date then
      v_status := 'overdue';
    else
      v_status := 'partial';
    end if;
  elsif v_due_date is not null and v_due_date < current_date then
    v_status := 'overdue';
  else
    v_status := 'pending';
  end if;

  update public.payroll_periods
  set status = v_status,
      paid_date = case when v_status = 'paid' then current_date else paid_date end,
      updated_at = now()
  where id = p_payroll_period_id;
end;
$$;

create or replace function public.register_payroll_payment(
  p_payroll_period_id uuid,
  p_amount numeric,
  p_currency currency_code,
  p_payment_method payment_method,
  p_reference_number text default null,
  p_payment_date date default current_date,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Monto invalido';
  end if;

  if not exists (select 1 from public.payroll_periods where id = p_payroll_period_id) then
    raise exception 'Periodo de nomina no encontrado';
  end if;

  insert into public.payroll_payments (
    payroll_period_id,
    amount,
    currency,
    payment_method,
    reference_number,
    payment_date,
    notes,
    registered_by
  )
  values (
    p_payroll_period_id,
    p_amount,
    p_currency,
    p_payment_method,
    p_reference_number,
    p_payment_date,
    p_notes,
    auth.uid()
  )
  returning id into v_payment_id;

  perform public.refresh_payroll_period_status(p_payroll_period_id);

  return jsonb_build_object(
    'payment_id', v_payment_id,
    'payroll_period_id', p_payroll_period_id
  );
end;
$$;

create or replace function public.refresh_payroll_period_status_from_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_payroll_period_status(coalesce(new.payroll_period_id, old.payroll_period_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_payroll_period_status_from_payment_insert on public.payroll_payments;
create trigger refresh_payroll_period_status_from_payment_insert
after insert or update or delete
on public.payroll_payments
for each row
execute function public.refresh_payroll_period_status_from_payment();

create or replace function public.write_audit_log(
  p_action text,
  p_entity text,
  p_entity_id uuid,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_notes text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    old_values,
    new_values,
    notes
  )
  values (
    auth.uid(),
    p_action,
    p_entity,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_notes
  );
end;
$$;

create or replace function public.audit_financial_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit_log('insert', tg_table_name, new.id, null, to_jsonb(new), null);
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.write_audit_log('update', tg_table_name, new.id, to_jsonb(old), to_jsonb(new), null);
    return new;
  elsif tg_op = 'DELETE' then
    perform public.write_audit_log('delete', tg_table_name, old.id, to_jsonb(old), null, null);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists audit_payments_trigger on public.payments;
create trigger audit_payments_trigger
after insert or update or delete
on public.payments
for each row
execute function public.audit_financial_changes();

drop trigger if exists audit_expenses_trigger on public.expenses;
create trigger audit_expenses_trigger
after insert or update or delete
on public.expenses
for each row
execute function public.audit_financial_changes();

drop trigger if exists audit_payroll_periods_trigger on public.payroll_periods;
create trigger audit_payroll_periods_trigger
after insert or update or delete
on public.payroll_periods
for each row
execute function public.audit_financial_changes();

drop trigger if exists audit_payroll_payments_trigger on public.payroll_payments;
create trigger audit_payroll_payments_trigger
after insert or update or delete
on public.payroll_payments
for each row
execute function public.audit_financial_changes();

grant execute on function public.void_expense(uuid, text) to authenticated;
grant execute on function public.register_payroll_payment(uuid, numeric, currency_code, payment_method, text, date, text) to authenticated;

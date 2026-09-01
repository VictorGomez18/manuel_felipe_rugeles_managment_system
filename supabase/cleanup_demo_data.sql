-- LIMPIEZA DE INFORMACION DE PRUEBA
--
-- Conserva: perfiles y cuentas de acceso, configuracion, conceptos de pago,
-- categorias, niveles y salones.
--
-- Elimina: alumnos, representantes, mensualidades, pagos, gastos, nomina,
-- empleados y el historial de movimientos.
--
-- Ejecuta este archivo UNA SOLA VEZ en el SQL Editor de Supabase.

begin;

-- Registros dependientes de pagos. Se incluyen solo si existen en el proyecto.
do $$
begin
  if to_regclass('public.payment_allocations') is not null then
    execute 'delete from public.payment_allocations';
  end if;

  if to_regclass('public.payment_applications') is not null then
    execute 'delete from public.payment_applications';
  end if;

  if to_regclass('public.tuition_obligation_payments') is not null then
    execute 'delete from public.tuition_obligation_payments';
  end if;
end;
$$;

delete from public.audit_logs;
delete from public.payroll_payments;
delete from public.payroll_periods;
delete from public.expenses;
delete from public.payments;
delete from public.tuition_obligations;
delete from public.tuition_periods;

-- Se retiran primero las relaciones entre alumnos y representantes.
delete from public.student_guardians;

-- Evita que la referencia al representante principal bloquee la limpieza.
update public.students set primary_guardian_id = null;
delete from public.students;
delete from public.guardians;
delete from public.employees;

commit;

-- Tablas que se conservan deliberadamente:
-- public.profiles, auth.users, public.settings, public.payment_concepts,
-- public.expense_categories, public.levels y public.classrooms.

import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { AcademicsPage } from '../features/academics/pages/AcademicsPage'
import { AuditPage } from '../features/audit/pages/AuditPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { GuestRoute, ProtectedRoute } from '../features/auth/AuthGuard'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { EmployeeDetailPage, EmployeesPage } from '../features/employees/pages/EmployeesPages'
import { ExpensesPage } from '../features/expenses/pages/ExpensesPage'
import { GuardianDetailPage } from '../features/guardians/pages/GuardianDetailPage'
import { GuardiansListPage } from '../features/guardians/pages/GuardiansListPage'
import { PaymentReceiptPage, PaymentsPage } from '../features/payments/pages/PaymentsPage'
import { PayrollPage } from '../features/payroll/pages/PayrollPage'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { StudentDetailPage } from '../features/students/pages/StudentDetailPage'
import { StudentsListPage } from '../features/students/pages/StudentsListPage'
import { ReceivablesPage, TuitionPage } from '../features/tuition/pages/TuitionPages'
import { UsersPage } from '../features/users/pages/UsersPage'

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="alumnos" element={<StudentsListPage />} />
        <Route path="alumnos/:id" element={<StudentDetailPage />} />
        <Route path="representantes" element={<GuardiansListPage />} />
        <Route path="representantes/:id" element={<GuardianDetailPage />} />
        <Route path="salones" element={<AcademicsPage />} />
        <Route path="mensualidades" element={<TuitionPage />} />
        <Route path="pagos" element={<PaymentsPage />} />
        <Route path="pagos/:id" element={<PaymentReceiptPage />} />
        <Route path="cuentas-por-cobrar" element={<ReceivablesPage />} />
        <Route path="gastos" element={<ExpensesPage />} />
        <Route path="empleados" element={<EmployeesPage />} />
        <Route path="empleados/:id" element={<EmployeeDetailPage />} />
        <Route path="nomina" element={<PayrollPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="usuarios" element={<UsersPage />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="auditoria" element={<AuditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

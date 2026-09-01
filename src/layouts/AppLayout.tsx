import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const getPageMeta = (pathname: string) => {
  if (pathname.startsWith('/alumnos/')) {
    return {
      title: 'Detalle de alumno',
      subtitle: 'Resumen academico, financiero y administrativo del estudiante.',
    }
  }

  if (pathname.startsWith('/representantes/')) {
    return {
      title: 'Detalle de representante',
      subtitle: 'Resumen de contacto, alumnos asociados y seguimiento financiero.',
    }
  }

  if (pathname.startsWith('/pagos/')) {
    return {
      title: 'Recibo de pago',
      subtitle: 'Consulta e impresion del comprobante emitido.',
    }
  }

  if (pathname.startsWith('/empleados/')) {
    return {
      title: 'Detalle de empleado',
      subtitle: 'Ficha laboral, historial de nomina y pagos asociados.',
    }
  }

  const pageTitles: Record<string, { title: string; subtitle?: string }> = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Resumen administrativo y financiero del centro.' },
    '/alumnos': { title: 'Alumnos', subtitle: 'Gestion de estudiantes y su informacion.' },
    '/representantes': { title: 'Representantes', subtitle: 'Gestion de contacto, relacion y seguimiento por representante.' },
    '/salones': { title: 'Salones y niveles', subtitle: 'Estructura academica y administrativa del centro.' },
    '/mensualidades': { title: 'Mensualidades', subtitle: 'Control de obligaciones mensuales y generacion por periodo.' },
    '/pagos': { title: 'Pagos', subtitle: 'Registro, anulacion y consulta de recibos emitidos.' },
    '/cuentas-por-cobrar': { title: 'Cuentas por cobrar', subtitle: 'Seguimiento de saldos pendientes, vencimientos y riesgo de cobranza.' },
    '/gastos': { title: 'Gastos', subtitle: 'Control de egresos, categorias y anulaciones operativas.' },
    '/empleados': { title: 'Empleados', subtitle: 'Gestion del personal, salarios y condiciones laborales.' },
    '/nomina': { title: 'Nomina', subtitle: 'Causacion y pagos de periodos de nomina del personal.' },
    '/reportes': { title: 'Reportes', subtitle: 'Analisis consolidado de cobranzas, gastos y compromisos.' },
    '/usuarios': { title: 'Usuarios y roles', subtitle: 'Administracion de perfiles, roles operativos y acceso al sistema.' },
    '/configuracion': { title: 'Configuracion', subtitle: 'Parametros base del sistema y del centro.' },
    '/auditoria': { title: 'Auditoria', subtitle: 'Seguimiento de cambios sensibles del sistema.' },
  }

  return pageTitles[pathname] ?? pageTitles['/dashboard']
}

export const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const location = useLocation()
  const current = getPageMeta(location.pathname)

  return (
    <div className="min-h-screen bg-background text-neutral-800">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
        <div className="min-w-0 flex-1">
          <Header title={current.title} subtitle={current.subtitle} onOpenSidebar={() => setMobileSidebarOpen(true)} />
          <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-content flex-col px-4 py-5 sm:px-5 lg:px-8 lg:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

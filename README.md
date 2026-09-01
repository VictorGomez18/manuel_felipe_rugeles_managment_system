# CEI Manuel Felipe Rugeles | Administrative & Financial System

[Español](#español) · [English](#english)

---

## Español

Sistema web para la gestión administrativa, académica y financiera del **Centro de Educación Inicial Manuel Felipe Rugeles**. Centraliza la información de alumnos, representantes, mensualidades, pagos, gastos, nómina y reportes en una única plataforma institucional.

### Características principales

- Panel principal con indicadores académicos y financieros.
- Gestión de alumnos, representantes, niveles y salones.
- Mensualidades, cuentas por cobrar y registro de pagos.
- Recibos institucionales con impresión y descarga en PDF.
- Control de gastos, empleados y nómina.
- Reportes visuales con gráficas y exportación a Excel y PDF.
- Gestión de usuarios, roles y permisos.
- Configuración institucional e historial de movimientos.

### Tecnologías

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Supabase
- TanStack Query
- React Hook Form + Zod
- Recharts
- jsPDF, jsPDF AutoTable y SheetJS

### Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Proyecto de Supabase configurado

### Instalación

```bash
git clone <repository-url>
cd preescolar-admin
npm install
```

Crea un archivo `.env` a partir de `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Inicia el proyecto:

```bash
npm run dev
```

### Comandos disponibles

```bash
npm run dev      # Entorno de desarrollo
npm run build    # Compilación para producción
npm run lint     # Revisión de código
npm run preview  # Vista previa de producción
```

### Roles de acceso

| Rol | Alcance principal |
| --- | --- |
| Administrador | Administración completa, usuarios y configuración |
| Directora | Gestión académica, financiera y operativa |
| Caja | Pagos, cobranzas, gastos y reportes |
| Docente | Consulta académica de alumnos y salones |

### Datos de demostración

El archivo [cleanup_demo_data.sql](supabase/cleanup_demo_data.sql) limpia información operativa de prueba sin borrar perfiles, cuentas de acceso, configuración, conceptos de pago, categorías, niveles ni salones. Revísalo antes de ejecutarlo en el SQL Editor de Supabase.

### Seguridad

No subas archivos `.env` ni claves al repositorio. El proyecto conserva `.env.example` como plantilla segura para configurar el entorno.

---

## English

Web application for the administrative, academic, and financial management of **Centro de Educación Inicial Manuel Felipe Rugeles**. It brings students, guardians, tuition, payments, expenses, payroll, and reports together in one institutional platform.

### Main features

- Academic and financial dashboard.
- Student, guardian, level, and classroom management.
- Tuition, receivables, and payment registration.
- Institutional receipts with print-ready and PDF download options.
- Expense, employee, and payroll management.
- Visual reports with charts plus Excel and PDF exports.
- User, role, and permission management.
- Institutional settings and activity history.

### Technology stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Supabase
- TanStack Query
- React Hook Form + Zod
- Recharts
- jsPDF, jsPDF AutoTable, and SheetJS

### Requirements

- Node.js 20 or later
- npm 10 or later
- A configured Supabase project

### Setup

```bash
git clone <repository-url>
cd preescolar-admin
npm install
```

Create a `.env` file using `.env.example` as a reference:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Start the application:

```bash
npm run dev
```

### Available scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Code quality checks
npm run preview  # Preview production build
```

### Access roles

| Role | Main scope |
| --- | --- |
| Administrator | Full administration, users, and settings |
| Director | Academic, financial, and operational management |
| Cashier | Payments, collections, expenses, and reports |
| Teacher | Student and classroom academic consultation |

### Demo data cleanup

[cleanup_demo_data.sql](supabase/cleanup_demo_data.sql) removes operational demo data while preserving profiles, access accounts, settings, payment concepts, categories, levels, and classrooms. Review it before running it in the Supabase SQL Editor.

### Security

Never commit `.env` files or credentials. `.env.example` is intentionally kept as a safe configuration template.

---

## License

Private institutional project. All rights reserved.

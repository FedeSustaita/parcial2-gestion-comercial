# Sistema de gestión comercial — 2º parcial Programación IV

> README en construcción: se completa en la Etapa 5 (descripción, integrantes, URL pública y usuarios de prueba).

## Puesta en marcha local

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

## Stack

TypeScript · Next.js (App Router, Route Handlers) · Tailwind CSS · shadcn/ui · Chart.js (react-chartjs-2) · Drizzle ORM + drizzle-kit · SQLite (local) / Turso (producción) · Zod · bcryptjs · jose (cookie de sesión firmada) · Vercel

## Organización del código (arquitectura en capas, sección 10)

| Carpeta | Capa | Contenido |
| --- | --- | --- |
| `db/` | Acceso a datos | `schema.ts` (tablas), `index.ts` (conexión), `migrations/`, `seed.ts` |
| `schemas/` | Validación | Esquemas Zod compartidos entre formularios y servidor |
| `services/` | Servicios | Reglas de negocio, permisos y transacciones (única fuente de reglas) |
| `app/api/` | Adaptador REST | Route Handlers: exigen sesión, llaman al servicio y responden |
| `app/` | Interfaz | Páginas (Server Components) y Server Actions |
| `components/ui/` | Interfaz | Componentes de shadcn/ui |
| `components/layout/` | Interfaz | Panel lateral, barra superior, primitivas de maquetación |
| `components/comunes/` | Interfaz | Piezas repetidas: estados de carga/vacío/error, confirmación, campo con error, campo de importe, insignias, paginador |
| `components/domain/` | Interfaz | Componentes del dominio (venta, factura, cliente…) |
| `hooks/` | Interfaz | Hook común de formularios |
| `lib/` | Transversal | `api-error.ts` (ApiError), `api.ts` (envoltorio de rutas), `action.ts` (envoltorio de Server Actions), `session.ts`/`auth.ts` (cookie firmada), `format.ts` (moneda, fechas, numeración) |
| `proxy.ts` | Protección | Primera barrera: sin cookie firmada válida redirige a `/login` (o 401 en la API) |

## Usuarios de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | admin@comercio.test | admin1234 |
| Vendedor | vendedor@comercio.test | vendedor1234 |

**Modo demo:** la pantalla de login tiene dos botones, *Administrador* y *Vendedor*, que entran con estos usuarios sin escribir credenciales. Se puede desactivar con la variable de entorno `DEMO_LOGIN=false`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run db:generate` | Genera una migración a partir de cambios en `db/schema.ts` |
| `pnpm run db:migrate` | Aplica las migraciones a la base de `DATABASE_URL` |
| `pnpm run db:seed` | Carga los datos de prueba |
| `pnpm run db:reset` | Borra la base local y la vuelve a crear con datos de prueba |
| `pnpm run db:verificar` | Verifica que la existencia de cada producto coincida con sus movimientos |
| `pnpm run db:studio` | Explorador visual de la base (Drizzle Studio) |
| `pnpm run typecheck` | Chequeo de tipos de TypeScript |

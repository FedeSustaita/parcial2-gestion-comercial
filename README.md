# Sistema de gestión comercial — Ferretería El Tornillo

2º parcial de Programación IV (UTN FRT). Sistema web para un comercio minorista de un solo local: **factura ventas**, **controla las existencias** del catálogo y lleva la **cuenta corriente de los clientes**, con usuarios administrador y vendedor.

**Sitio publicado:** https://parcial2-gestion-comercial.vercel.app
**Repositorio:** https://github.com/FedeSustaita/parcial2-gestion-comercial

## Integrantes

| Nombre | Legajo |
| --- | --- |
| _(completar)_ | _(completar)_ |
| _(completar)_ | _(completar)_ |
| _(completar)_ | _(completar)_ |

## Usuarios de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | admin@comercio.test | admin1234 |
| Vendedor | vendedor@comercio.test | vendedor1234 |

**Modo demo:** la pantalla de login tiene dos botones, *Administrador* y *Vendedor*, que entran con estos usuarios sin escribir credenciales. Se puede desactivar con la variable de entorno `DEMO_LOGIN=false`.

## Qué hace

| Módulo | Funcionalidades | Requerimientos |
| --- | --- | --- |
| **Inicio** | Ventas del día y del mes, total adeudado, productos bajo el mínimo, gráfico de ventas de 30 días, ventas por forma de pago y los 5 más vendidos (Chart.js) | RF-T1 a RF-T3 |
| **Ventas** | Nueva venta en una pantalla (comprador, ítems y forma de pago) operable con teclado; contado con vuelto, tarjeta (solo tipo, marca y últimos 4 dígitos) y cuenta corriente con límite de crédito; comprobante imprimible; listado con filtros; anulación con motivo | RF-V1 a RF-V9 |
| **Productos** | Catálogo con búsqueda y filtros, marca de bajo mínimo, ficha con movimientos, ingresos y egresos de stock, pestañas *Existencias* y *Categorías*, baja lógica | RF-P1 a RF-P7 |
| **Clientes** | Listado con saldo, ficha con pestaña *Cuenta corriente* (saldo acumulado por renglón), pagos con recibo numerado e imprimible, pestaña *Saldos* con el total adeudado | RF-C1 a RF-C7 |
| **Usuarios** | Alta, edición, rol, desactivación y restablecimiento de contraseña (solo administrador); `/perfil` para cambiar la propia | RF-U1 a RF-U5 |

**Atajos de Nueva venta:** `F2` buscar producto · `Enter` agregar · `F4` ir al pago · `Ctrl+Enter` confirmar.

## Puesta en marcha local

Requisitos: Node.js 20 o superior y pnpm.

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

La aplicación queda en http://localhost:3000. Con el `.env` de ejemplo usa una base SQLite local (`local.db`).

## Variables de entorno

Definidas en [`.env.example`](.env.example):

| Variable | Local | Producción (Vercel) |
| --- | --- | --- |
| `DATABASE_URL` | `file:local.db` | URL de Turso: `libsql://….turso.io` |
| `DATABASE_AUTH_TOKEN` | vacía | Token de la base de Turso |
| `SESSION_SECRET` | valor de ejemplo | Secreto propio de 32+ caracteres (`openssl rand -base64 32`) |
| `DEMO_LOGIN` | opcional | `false` para ocultar los botones de modo demo |

Los secretos nunca se suben al repositorio: `.env*` está en `.gitignore` (salvo `.env.example`).

## Publicación (Vercel + Turso)

1. Crear la base en Turso y un token de lectura y escritura.
2. Crear las tablas y cargar los datos de prueba contra Turso con los mismos comandos, cambiando solo las variables:
   ```bash
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… pnpm run db:migrate
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… pnpm run db:seed
   ```
3. Importar el repositorio en Vercel y cargar `DATABASE_URL`, `DATABASE_AUTH_TOKEN` y `SESSION_SECRET` en *Settings → Environment Variables* (Production).
4. Cada `git push` a `main` publica una versión nueva.

`GET /api/salud` (pública) informa si las variables están presentes y si la base responde, sin mostrar sus valores. Sirve para comprobar que el sitio usa Turso y no una base local.

## Stack

TypeScript · Next.js 16 (App Router, Route Handlers, Server Actions) · Tailwind CSS · shadcn/ui · Chart.js (react-chartjs-2) · Drizzle ORM + drizzle-kit · SQLite (local) / Turso (producción) · Zod · bcryptjs · jose (cookie de sesión firmada) · Vercel

- **Zod** valida con los mismos esquemas en el formulario y en el servidor (`schemas/`).
- **Sesión propia** en cookie `httpOnly` firmada con `jose`, en lugar de Auth.js: es más simple de explicar y cumple lo pedido (sección 10.5).

## Organización del código (arquitectura en capas, sección 10)

| Carpeta | Capa | Contenido |
| --- | --- | --- |
| `db/` | Acceso a datos | `schema.ts` (tablas), `index.ts` (conexión y `transaccion()`), `migrations/`, `seed.ts`, `verificar.ts` |
| `schemas/` | Validación | Esquemas Zod compartidos entre formularios y servidor |
| `services/` | Servicios | Reglas de negocio, permisos y transacciones (única fuente de reglas) |
| `app/api/` | Adaptador REST | Las 31 rutas: exigen sesión, llaman al servicio y responden |
| `app/` | Interfaz | Páginas (Server Components) y Server Actions |
| `components/ui/` | Interfaz | Componentes de shadcn/ui |
| `components/layout/` | Interfaz | Panel lateral, barra superior, primitivas de maquetación |
| `components/comunes/` | Interfaz | Estados de carga/vacío/error, confirmación, campo con error, campo de importe, insignias, paginador, filtros |
| `components/domain/` | Interfaz | Componentes del dominio (venta, factura, cliente, producto, tablero) |
| `hooks/` | Interfaz | Hook común de formularios y búsqueda en vivo |
| `lib/` | Transversal | `api-error.ts`, `api.ts` (envoltorio de rutas), `action.ts` (envoltorio de Server Actions), `session.ts`/`auth.ts` (cookie firmada), `format.ts` (moneda, fechas, numeración) |
| `proxy.ts` | Protección | Primera barrera: sin cookie firmada válida redirige a `/login` (o 401 en la API) |

Puntos clave:

- **La existencia solo cambia en `moverStock()`** (`services/stock.ts`), con `UPDATE … WHERE existencia >= ?` y el movimiento en la misma transacción.
- **Confirmar una factura** (`services/facturas.ts → crearFactura`) es una sola transacción: factura, renglones, stock y cuenta corriente, o nada. `transaccion()` reintenta si SQLite está ocupado, así dos ventas simultáneas de la última unidad terminan con una sola confirmada.
- **El saldo del cliente** no se guarda: sale siempre de sus movimientos de cuenta (`services/cuenta.ts`).
- **La numeración** (punto de venta y número correlativo) está en `services/numeracion.ts`.

## Scripts

| Script | Qué hace |
| --- | --- |
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` / `start` | Build y servidor de producción |
| `pnpm run db:generate` | Genera una migración a partir de cambios en `db/schema.ts` |
| `pnpm run db:migrate` | Aplica las migraciones a la base de `DATABASE_URL` |
| `pnpm run db:seed` | Carga los datos de prueba (con los servicios de la app) |
| `pnpm run db:reset` | Borra la base local y la vuelve a crear con datos de prueba |
| `pnpm run db:verificar` | Verifica que el stock cuadre con sus movimientos y que no haya saldos a favor |
| `pnpm run db:studio` | Explorador visual de la base (Drizzle Studio) |
| `pnpm run typecheck` / `lint` | Chequeo de tipos y lint |

## Datos de prueba

El script `db/seed.ts` crea, **con los mismos servicios de la aplicación**: 2 usuarios (uno por rol), 5 categorías, 30 productos de ferretería con stock inicial, 10 clientes (6 con cuenta corriente), **50 facturas** repartidas en los últimos 30 días, 5 pagos con recibo y 1 anulación.

## Uso de inteligencia artificial

El sistema se desarrolló con **Claude Code** (agente de IA de Anthropic), por etapas siguiendo los hitos de la consigna, revisando y probando cada etapa. Algunos errores del agente que se detectaron y corrigieron:

- **Conteo de productos por categoría:** la primera versión usaba una subconsulta correlacionada que Drizzle generó sin calificar las columnas, y mostraba 1 en todas las categorías. Se reemplazó por un `LEFT JOIN` con `GROUP BY` (`services/categorias.ts`).
- **Ventas simultáneas:** con la base SQLite local, la segunda transacción concurrente fallaba con `SQLITE_BUSY` (error 500). Se agregó `transaccion()` con reintentos en `db/index.ts`, y se comprobó que de 5 ventas simultáneas de la última unidad se confirma una sola.
- **Teclado en Nueva venta:** al pasar con `Tab` del buscador a la cantidad, el foco caía en un resultado de la lista y se perdía la cantidad. Se sacaron los resultados del orden de tabulación.
- **Despliegue:** pnpm 11.12.0 (versión rota) fallaba en Vercel; se fijó la 11.28.13. Además, para Turso se usa el cliente web de libSQL, que no carga código nativo.

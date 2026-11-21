// Esquema de la base de datos (sección 7 de la consigna).
// Capa de acceso a datos: solo define tablas, relaciones y restricciones;
// no contiene reglas de negocio (esas viven en services/).
//
// Convenciones:
// - Los nombres en TypeScript son camelCase; en la base quedan en snake_case
//   (opción `casing: "snake_case"` en db/index.ts y drizzle.config.ts).
// - Importes SIEMPRE en centavos como enteros (regla 10): nunca coma flotante.
// - Fechas como timestamp en milisegundos (UTC).
// - Bajas lógicas con el campo `activo` (regla 12): nada con historial se borra.
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Columnas comunes: id y fecha de creación en todas las tablas.
const id = () => integer().primaryKey({ autoIncrement: true });
const creadoEn = () =>
  integer({ mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const ROLES = ["admin", "vendedor"] as const;
export const TIPOS_MOV_STOCK = ["venta", "anulacion", "ingreso", "egreso"] as const;
export const TIPOS_DOC = ["DNI", "CUIT"] as const;
export const FORMAS_PAGO = ["contado", "tarjeta", "cuenta_corriente"] as const;
export const TIPOS_TARJETA = ["debito", "credito"] as const;
export const ESTADOS_FACTURA = ["emitida", "anulada"] as const;
export const MEDIOS_PAGO = ["efectivo", "transferencia", "tarjeta_debito"] as const;
export const TIPOS_MOV_CUENTA = ["debito", "credito"] as const;

// ───────────────────────── Usuarios ─────────────────────────
export const usuarios = sqliteTable("usuarios", {
  id: id(),
  email: text().notNull().unique(),
  nombre: text().notNull(),
  passwordHash: text().notNull(),
  rol: text({ enum: ROLES }).notNull(),
  activo: integer({ mode: "boolean" }).notNull().default(true),
  creadoEn: creadoEn(),
});

// ───────────────────────── Categorías ─────────────────────────
export const categorias = sqliteTable("categorias", {
  id: id(),
  nombre: text().notNull().unique(),
  activa: integer({ mode: "boolean" }).notNull().default(true),
  creadoEn: creadoEn(),
});

// ───────────────────────── Productos ─────────────────────────
// `existencia` se guarda como campo calculado y SOLO cambia en moverStock()
// (services/stock.ts). El CHECK es una red de seguridad de la regla 1.
export const productos = sqliteTable(
  "productos",
  {
    id: id(),
    codigo: text().notNull().unique(),
    descripcion: text().notNull(),
    categoriaId: integer()
      .notNull()
      .references(() => categorias.id),
    precio: integer().notNull(), // centavos
    existencia: integer().notNull().default(0),
    stockMinimo: integer().notNull().default(0),
    activo: integer({ mode: "boolean" }).notNull().default(true),
    creadoEn: creadoEn(),
  },
  (t) => [
    check("productos_existencia_no_negativa", sql`${t.existencia} >= 0`),
    check("productos_precio_no_negativo", sql`${t.precio} >= 0`),
    index("productos_categoria_idx").on(t.categoriaId),
  ],
);

// ───────────────────────── Clientes ─────────────────────────
// `nroDoc` se guarda solo con dígitos (sin puntos ni guiones) para que la
// unicidad y la búsqueda no dependan del formato. Se formatea al mostrar.
// El saldo NO se guarda: sale de movimientos_cuenta (débitos − créditos).
export const clientes = sqliteTable("clientes", {
  id: id(),
  tipoDoc: text({ enum: TIPOS_DOC }).notNull(),
  nroDoc: text().notNull().unique(),
  nombre: text().notNull(),
  domicilio: text(),
  telefono: text(),
  email: text(),
  cuentaCorriente: integer({ mode: "boolean" }).notNull().default(false),
  limiteCredito: integer(), // centavos; null = sin límite
  activo: integer({ mode: "boolean" }).notNull().default(true),
  creadoEn: creadoEn(),
});

// ───────────────────────── Facturas ─────────────────────────
// Numeración: (puntoVenta, numero) único. El número se asigna al confirmar,
// dentro de la transacción (regla 4).
export const facturas = sqliteTable(
  "facturas",
  {
    id: id(),
    puntoVenta: integer().notNull(),
    numero: integer().notNull(),
    fecha: creadoEn(),
    clienteId: integer().references(() => clientes.id), // null = consumidor final
    usuarioId: integer()
      .notNull()
      .references(() => usuarios.id),
    total: integer().notNull(), // centavos
    formaPago: text({ enum: FORMAS_PAGO }).notNull(),
    // Regla 9: de la tarjeta solo se guardan tipo, marca y últimos 4 dígitos.
    tarjetaTipo: text({ enum: TIPOS_TARJETA }),
    tarjetaMarca: text(),
    tarjetaUltimos4: text(),
    montoRecibido: integer(), // centavos, solo contado
    estado: text({ enum: ESTADOS_FACTURA }).notNull().default("emitida"),
    motivoAnulacion: text(),
    anuladaEn: integer({ mode: "timestamp_ms" }),
    anuladaPorId: integer().references(() => usuarios.id),
    creadoEn: creadoEn(),
  },
  (t) => [
    uniqueIndex("facturas_numero_unico").on(t.puntoVenta, t.numero),
    index("facturas_fecha_idx").on(t.fecha),
    index("facturas_cliente_idx").on(t.clienteId),
  ],
);

// Renglones: descripción, código y precio se COPIAN del catálogo al emitir
// (regla 3: el precio se congela).
export const facturaItems = sqliteTable(
  "factura_items",
  {
    id: id(),
    facturaId: integer()
      .notNull()
      .references(() => facturas.id),
    productoId: integer()
      .notNull()
      .references(() => productos.id),
    codigo: text().notNull(),
    descripcion: text().notNull(),
    cantidad: integer().notNull(),
    precioUnitario: integer().notNull(), // centavos
    subtotal: integer().notNull(), // centavos
    creadoEn: creadoEn(),
  },
  (t) => [
    index("factura_items_factura_idx").on(t.facturaId),
    check("factura_items_cantidad_positiva", sql`${t.cantidad} > 0`),
  ],
);

// ───────────────────────── Movimientos de stock ─────────────────────────
// Regla 2: todo cambio de stock deja un movimiento. La suma de `cantidad`
// (con signo) de un producto es igual a su existencia.
export const movimientosStock = sqliteTable(
  "movimientos_stock",
  {
    id: id(),
    productoId: integer()
      .notNull()
      .references(() => productos.id),
    tipo: text({ enum: TIPOS_MOV_STOCK }).notNull(),
    cantidad: integer().notNull(), // con signo: + entra, − sale
    existenciaResultante: integer().notNull(),
    motivo: text().notNull(),
    observacion: text(),
    usuarioId: integer()
      .notNull()
      .references(() => usuarios.id),
    facturaId: integer().references(() => facturas.id),
    fecha: creadoEn(),
  },
  (t) => [index("movimientos_stock_producto_idx").on(t.productoId, t.fecha)],
);

// ───────────────────────── Pagos (recibos) ─────────────────────────
// Los recibos tienen su propia numeración correlativa (regla 4).
export const pagos = sqliteTable(
  "pagos",
  {
    id: id(),
    puntoVenta: integer().notNull(),
    numero: integer().notNull(),
    fecha: creadoEn(),
    clienteId: integer()
      .notNull()
      .references(() => clientes.id),
    usuarioId: integer()
      .notNull()
      .references(() => usuarios.id),
    importe: integer().notNull(), // centavos
    medio: text({ enum: MEDIOS_PAGO }).notNull(),
    observacion: text(),
  },
  (t) => [
    uniqueIndex("pagos_numero_unico").on(t.puntoVenta, t.numero),
    check("pagos_importe_positivo", sql`${t.importe} > 0`),
  ],
);

// ───────────────────────── Movimientos de cuenta corriente ─────────────────────────
// Saldo del cliente = Σ débitos − Σ créditos (regla 7). `importe` siempre positivo.
export const movimientosCuenta = sqliteTable(
  "movimientos_cuenta",
  {
    id: id(),
    clienteId: integer()
      .notNull()
      .references(() => clientes.id),
    tipo: text({ enum: TIPOS_MOV_CUENTA }).notNull(),
    importe: integer().notNull(), // centavos
    descripcion: text().notNull(),
    facturaId: integer().references(() => facturas.id),
    pagoId: integer().references(() => pagos.id),
    fecha: creadoEn(),
  },
  (t) => [
    index("movimientos_cuenta_cliente_idx").on(t.clienteId, t.fecha),
    check("movimientos_cuenta_importe_positivo", sql`${t.importe} > 0`),
  ],
);

// ───────────────────────── Relaciones (para consultas con `with`) ─────────────────────────
export const usuariosRelations = relations(usuarios, ({ many }) => ({
  facturas: many(facturas),
}));

export const categoriasRelations = relations(categorias, ({ many }) => ({
  productos: many(productos),
}));

export const productosRelations = relations(productos, ({ one, many }) => ({
  categoria: one(categorias, { fields: [productos.categoriaId], references: [categorias.id] }),
  movimientos: many(movimientosStock),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  facturas: many(facturas),
  pagos: many(pagos),
  movimientos: many(movimientosCuenta),
}));

export const facturasRelations = relations(facturas, ({ one, many }) => ({
  cliente: one(clientes, { fields: [facturas.clienteId], references: [clientes.id] }),
  vendedor: one(usuarios, { fields: [facturas.usuarioId], references: [usuarios.id] }),
  anuladaPor: one(usuarios, { fields: [facturas.anuladaPorId], references: [usuarios.id] }),
  items: many(facturaItems),
}));

export const facturaItemsRelations = relations(facturaItems, ({ one }) => ({
  factura: one(facturas, { fields: [facturaItems.facturaId], references: [facturas.id] }),
  producto: one(productos, { fields: [facturaItems.productoId], references: [productos.id] }),
}));

export const movimientosStockRelations = relations(movimientosStock, ({ one }) => ({
  producto: one(productos, { fields: [movimientosStock.productoId], references: [productos.id] }),
  usuario: one(usuarios, { fields: [movimientosStock.usuarioId], references: [usuarios.id] }),
  factura: one(facturas, { fields: [movimientosStock.facturaId], references: [facturas.id] }),
}));

export const pagosRelations = relations(pagos, ({ one }) => ({
  cliente: one(clientes, { fields: [pagos.clienteId], references: [clientes.id] }),
  usuario: one(usuarios, { fields: [pagos.usuarioId], references: [usuarios.id] }),
}));

export const movimientosCuentaRelations = relations(movimientosCuenta, ({ one }) => ({
  cliente: one(clientes, { fields: [movimientosCuenta.clienteId], references: [clientes.id] }),
  factura: one(facturas, { fields: [movimientosCuenta.facturaId], references: [facturas.id] }),
  pago: one(pagos, { fields: [movimientosCuenta.pagoId], references: [pagos.id] }),
}));

export type Rol = (typeof ROLES)[number];
export type Usuario = typeof usuarios.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type Producto = typeof productos.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Factura = typeof facturas.$inferSelect;
export type FacturaItem = typeof facturaItems.$inferSelect;
export type MovimientoStock = typeof movimientosStock.$inferSelect;
export type Pago = typeof pagos.$inferSelect;
export type MovimientoCuenta = typeof movimientosCuenta.$inferSelect;

// Única clase de error del sistema (sección 10.4). Los servicios la lanzan;
// los adaptadores (Route Handlers y Server Actions) la traducen al formato
// estándar { error: { code, message, details } } de la sección 11.1.

export type CodigoError =
  | "JSON_INVALIDO"
  | "NO_AUTENTICADO"
  | "CREDENCIALES_INVALIDAS"
  | "SIN_PERMISO"
  | "NO_ENCONTRADO"
  | "CODIGO_DUPLICADO"
  | "DOCUMENTO_DUPLICADO"
  | "EMAIL_DUPLICADO"
  | "NOMBRE_DUPLICADO"
  | "CATEGORIA_EN_USO"
  | "STOCK_INSUFICIENTE"
  | "FACTURA_ANULADA"
  | "VALIDACION"
  | "PRODUCTO_INACTIVO"
  | "CUENTA_CORRIENTE_NO_HABILITADA"
  | "LIMITE_CREDITO_EXCEDIDO"
  | "MONTO_INSUFICIENTE"
  | "PAGO_SUPERA_DEUDA"
  | "SALDO_PENDIENTE"
  | "CONTRASENA_ACTUAL_INCORRECTA"
  | "OPERACION_SOBRE_SI_MISMO"
  | "ERROR_INTERNO";

export type DetalleCampo = { campo: string; mensaje: string };

export type ErrorPublico = {
  code: CodigoError;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: CodigoError,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON(): ErrorPublico {
    return {
      code: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

// Atajos para los errores más comunes.
export const errores = {
  noAutenticado: () => new ApiError(401, "NO_AUTENTICADO", "Tenés que iniciar sesión."),
  sinPermiso: () => new ApiError(403, "SIN_PERMISO", "No tenés permiso para esta operación."),
  noEncontrado: (que = "El recurso") => new ApiError(404, "NO_ENCONTRADO", `${que} no existe.`),
  validacion: (details: DetalleCampo[], message = "Hay campos con errores.") =>
    new ApiError(422, "VALIDACION", message, details),
};

// Convierte cualquier error en un ErrorPublico. Los inesperados se registran
// en el servidor y NUNCA llegan al cliente con su detalle (sección 10.4).
export function aErrorPublico(err: unknown): { status: number; error: ErrorPublico } {
  if (err instanceof ApiError) return { status: err.status, error: err.toJSON() };
  console.error("[ERROR_INTERNO]", err);
  return {
    status: 500,
    error: { code: "ERROR_INTERNO", message: "Ocurrió un error inesperado. Intentá de nuevo." },
  };
}

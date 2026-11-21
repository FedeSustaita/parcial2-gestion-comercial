import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { UsuarioSesion } from "@/services/auth";
import { aErrorPublico, ApiError, errores } from "./api-error";
import { obtenerUsuarioActual } from "./auth";

// Envoltorio común de los Route Handlers (sección 10.3). Hace lo que se repite
// en las 31 rutas: exige sesión, resuelve parámetros, lee el JSON y traduce
// cualquier error al formato estándar. Así cada route.ts queda en una línea:
// llamar al servicio y responder. Las rutas NO contienen reglas de negocio.

type Params = Record<string, string | string[] | undefined>;

export type ContextoRuta<U> = {
  usuario: U;
  params: Params & { id?: string };
  query: Record<string, string>;
  body: unknown;
  req: NextRequest;
};

type Opciones = { status?: number };

function construir<U>(
  obtenerUsuario: () => Promise<U>,
  fn: (ctx: ContextoRuta<U>) => Promise<unknown>,
  opciones: Opciones = {},
) {
  return async (req: NextRequest, ctx: { params: Promise<Params> }) => {
    try {
      const usuario = await obtenerUsuario();
      const params = (await ctx.params) ?? {};
      const query = Object.fromEntries(req.nextUrl.searchParams);
      const body = await leerJson(req);

      const resultado = await fn({ usuario, params, query, body, req });

      const status = opciones.status ?? 200;
      if (status === 204) return new NextResponse(null, { status: 204 });
      return NextResponse.json(resultado, { status });
    } catch (err) {
      const { status, error } = aErrorPublico(err);
      return NextResponse.json({ error }, { status });
    }
  };
}

async function leerJson(req: NextRequest): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const texto = await req.text();
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo no es JSON válido.");
  }
}

async function usuarioObligatorio(): Promise<UsuarioSesion> {
  const u = await obtenerUsuarioActual();
  if (!u) throw errores.noAutenticado(); // 401 NO_AUTENTICADO
  return u;
}

/** Ruta protegida: sin sesión válida responde 401. */
export function ruta(fn: (ctx: ContextoRuta<UsuarioSesion>) => Promise<unknown>, opciones?: Opciones) {
  return construir(usuarioObligatorio, fn, opciones);
}

/** Ruta pública: solo POST /api/auth/login. */
export function rutaPublica(fn: (ctx: ContextoRuta<null>) => Promise<unknown>, opciones?: Opciones) {
  return construir(async () => null, fn, opciones);
}

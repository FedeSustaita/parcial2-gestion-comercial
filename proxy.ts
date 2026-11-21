import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/session";

// Primera barrera de protección (sección 10.5): si falta la cookie firmada o
// la firma no es válida, redirige a /login (o responde 401 en la API).
// Las otras dos barreras: cada página vuelve a comprobar el usuario y cada
// servicio verifica el rol.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const esPublica = pathname === "/login" || pathname === "/api/auth/login";
  const valida = (await verificarSesion(req.cookies.get(COOKIE_SESION)?.value)) !== null;

  if (esPublica) {
    // Si ya está logueado y entra a /login, lo mandamos al inicio.
    if (valida && pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!valida) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "NO_AUTENTICADO", message: "Tenés que iniciar sesión." } },
        { status: 401 },
      );
    }
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("desde", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Todo salvo archivos estáticos de Next y del directorio public.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};

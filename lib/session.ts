import { jwtVerify, SignJWT } from "jose";

// Token de sesión: JWT firmado con HS256 usando SESSION_SECRET (variable de
// entorno, nunca en el repositorio). Este archivo no depende de Next, así lo
// puede usar tanto el proxy como el resto del servidor.

export const COOKIE_SESION = "sesion";
export const DURACION_SESION_SEG = 60 * 60 * 12; // 12 horas

function secreto(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET no está definida o tiene menos de 32 caracteres.");
  }
  return new TextEncoder().encode(s);
}

export async function firmarSesion(usuarioId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(usuarioId))
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_SEG}s`)
    .sign(secreto());
}

/** Devuelve el id del usuario si la firma es válida y no venció; si no, null. */
export async function verificarSesion(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

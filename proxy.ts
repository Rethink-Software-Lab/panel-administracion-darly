import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { ALMACENES, ROLES } from "@/app/(with-layout)/users/types";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  const verifyToken =
    token &&
    (await verifyAuth(token).catch((e) => {
      console.error(e);
    }));

  if (!verifyToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  const jsonString = JSON.stringify({
    id: verifyToken?.id,
    username: verifyToken?.username,
    rol: verifyToken?.rol,
    area_venta: verifyToken?.area_venta,
    almacen: verifyToken?.almacen,
  });
  const b64 = Buffer.from(jsonString).toString("base64");
  requestHeaders.set("x-user", b64);

  if (verifyToken?.rol !== ROLES.ADMIN && request.nextUrl.pathname == "/") {
    if (verifyToken?.rol === ROLES.SUPERVISOR) {
      return NextResponse.redirect(new URL("/cuentas", request.url));
    }
    if (
      verifyToken?.rol === ROLES.ALMACENERO &&
      verifyToken?.almacen === ALMACENES.CAFETERIA
    ) {
      return NextResponse.redirect(
        new URL("/inventario-cafeteria", request.url)
      );
    }
    if (verifyToken?.rol === ROLES.VENDEDOR_CAFETERIA) {
      return NextResponse.redirect(new URL("/cafeteria/ventas", request.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|placeholder.svg|login).*)",
  ],
};

import { ROLES } from "@/app/(with-layout)/users/types";
import { headers } from "next/headers";

export interface Session {
  user: UserSession;
  rol: string | null;
  area_venta: number | null;
  almacen: string | null;
  isAdmin: boolean;
  isAlmacenero: boolean;
  isSupervisor: boolean;
  isVendedor: boolean;
  isVendedorCafeteria: boolean;
  isStaff: boolean;
}

interface UserSession {
  id: number;
  username: string;
  rol: ROLES;
  area_venta: number;
  almacen: string;
}

export async function getSession() {
  const headersList = await headers();
  const cookieUser = headersList?.get("x-user");
  if (!cookieUser) {
    return null;
  }
  const user = JSON.parse(cookieUser) as UserSession;

  const isAdmin = user.rol === ROLES.ADMIN;
  const isAlmacenero = user.rol === ROLES.ALMACENERO;
  const isSupervisor = user.rol === ROLES.SUPERVISOR;
  const isStaff = isAdmin || isAlmacenero;
  const isVendedor = user.rol === ROLES.VENDEDOR;
  const isVendedorCafeteria = user.rol === ROLES.VENDEDOR_CAFETERIA;

  return {
    user,
    userId: user.id,
    rol: user.rol,
    area_venta: user.area_venta,
    almacen: user.almacen,
    isAdmin,
    isAlmacenero,
    isSupervisor,
    isVendedor,
    isVendedorCafeteria,
    isStaff,
  };
}

"use server";

import { db } from "@/db/initial";
import {
  inventarioHistorialpreciocostocafeteria,
  inventarioHistorialprecioventacafeteria,
  inventarioInventarioAlmacenCafeteria,
  inventarioInventarioAreaCafeteria,
  inventarioProductosCafeteria,
} from "@/db/schema";

import { ValidationError } from "@/lib/errors";
import { getSession } from "@/lib/getSession";
import { ProductosCafeteriaSchema } from "@/lib/schemas";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { InferOutput } from "valibot";

export async function addProductoCafeteria(
  producto: InferOutput<typeof ProductosCafeteriaSchema>
) {
  try {
    const { userId } = await getSession();
    if (!userId) throw new ValidationError("No autorizado");

    await db.transaction(async (tx) => {
      const [productoAgregado] = await tx
        .insert(inventarioProductosCafeteria)
        .values({
          nombre: producto.nombre,
          isIngrediente: producto.isIngrediente,
        })
        .returning({ id: inventarioProductosCafeteria.id });

      await tx.insert(inventarioHistorialpreciocostocafeteria).values({
        precio: producto.precioCosto.toString(),
        productoId: productoAgregado.id,
        usuarioId: Number(userId),
        fechaInicio: new Date().toISOString(),
      });

      await tx.insert(inventarioHistorialprecioventacafeteria).values({
        precio: producto.precioVenta.toString(),
        productoId: productoAgregado.id,
        usuarioId: Number(userId),
        fechaInicio: new Date().toISOString(),
      });

      await tx.insert(inventarioInventarioAlmacenCafeteria).values({
        productoId: productoAgregado.id,
        cantidad: "0",
      });
      await tx.insert(inventarioInventarioAreaCafeteria).values({
        productoId: productoAgregado.id,
        cantidad: "0",
      });
    });

    revalidatePath("/productos-cafeteria");
    return {
      data: "Producto agregado con éxito.",
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al agregar el producto de la cafetería.",
    };
  }
}

export async function editProductoCafeteria(
  producto: InferOutput<typeof ProductosCafeteriaSchema>,
  id: number
) {
  try {
    const { userId } = await getSession();
    if (!userId) throw new ValidationError("No autorizado");

    await db.transaction(async (tx) => {
      const [productoEditado] = await tx
        .update(inventarioProductosCafeteria)
        .set({
          nombre: producto.nombre,
          isIngrediente: producto.isIngrediente,
        })
        .where(eq(inventarioProductosCafeteria.id, id))
        .returning({ id: inventarioProductosCafeteria.id });

      const [ultimoPrecioCosto] = await tx
        .select()
        .from(inventarioHistorialpreciocostocafeteria)
        .where(
          eq(
            inventarioHistorialpreciocostocafeteria.productoId,
            productoEditado.id
          )
        )
        .orderBy(desc(inventarioHistorialpreciocostocafeteria.fechaInicio))
        .limit(1);

      const [ultimoPrecioVenta] = await tx
        .select()
        .from(inventarioHistorialprecioventacafeteria)
        .where(
          eq(
            inventarioHistorialprecioventacafeteria.productoId,
            productoEditado.id
          )
        )
        .orderBy(desc(inventarioHistorialprecioventacafeteria.fechaInicio))
        .limit(1);

      if (parseFloat(ultimoPrecioCosto.precio) !== producto.precioCosto) {
        await tx.insert(inventarioHistorialpreciocostocafeteria).values({
          precio: producto.precioCosto.toString(),
          productoId: productoEditado.id,
          usuarioId: Number(userId),
          fechaInicio: new Date().toISOString(),
        });
      }

      if (parseFloat(ultimoPrecioVenta.precio) !== producto.precioVenta) {
        await tx.insert(inventarioHistorialprecioventacafeteria).values({
          precio: producto.precioVenta.toString(),
          productoId: productoEditado.id,
          usuarioId: Number(userId),
          fechaInicio: new Date().toISOString(),
        });
      }
    });

    revalidatePath("/productos-cafeteria");
    return {
      data: "Producto editado con éxito.",
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al editar el producto de la cafetería.",
    };
  }
}

export async function deleteProductoCafeteria({ id }: { id: number }) {
  try {
    await db
      .update(inventarioProductosCafeteria)
      .set({ active: false })
      .where(eq(inventarioProductosCafeteria.id, id));

    revalidatePath("/productos-cafeteria");
    return {
      data: "Producto eliminado con éxito.",
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: "Error al eliminar el producto de la cafetería.",
    };
  }
}

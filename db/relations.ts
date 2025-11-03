import { relations } from "drizzle-orm/relations";
import {
  inventarioUser,
  inventarioAjusteinventario,
  djangoContentType,
  djangoAdminLog,
  inventarioAjusteinventarioProductos,
  inventarioProducto,
  inventarioCuentacasa,
  inventarioCuentacasaProductos,
  inventarioProductosCantidadCuentaCasa,
  inventarioCuentacasaElaboraciones,
  inventarioElaboracionesCantidadCuentaCasa,
  inventarioElaboraciones,
  inventarioElaboracionesIngredientesCantidad,
  inventarioIngredienteCantidad,
  inventarioElaboracionesCantidadMerma,
  inventarioCuentas,
  inventarioAreaventa,
  inventarioElaboracionesVentasCafeteria,
  inventarioGastos,
  inventarioProductosCafeteria,
  inventarioHistorialprecioventacafeteria,
  inventarioHistorialpreciocostocafeteria,
  inventarioProductoinfo,
  inventarioHistorialpreciocostosalon,
  inventarioHistorialprecioventasalon,
  inventarioCategorias,
  inventarioImage,
  inventarioInventarioAlmacenCafeteria,
  inventarioInventarioAreaCafeteria,
  inventarioMermacafeteriaElaboraciones,
  inventarioMermacafeteria,
  inventarioSalidaalmacen,
  inventarioProductosVentasCafeteria,
  inventarioProductosSalidasCafeteria,
  inventarioSalidaalmacenrevoltosa,
  inventarioElaboracionesSalidasAlmacenCafeteria,
  inventarioSalidasCafeteriaElaboraciones,
  inventarioSalidasCafeteria,
  inventarioSalidasCafeteriaProductos,
  inventarioEntradasCafeteria,
  inventarioTransacciones,
  inventarioEntradaalmacen,
  inventarioVentasCafeteria,
  inventarioVentas,
  inventarioTransferencia,
  inventarioTransferenciaProductos,
  authGroup,
  inventarioUserGroups,
  authPermission,
  inventarioUserUserPermissions,
  inventarioVentasCafeteriaElaboraciones,
  authGroupPermissions,
  inventarioProveedor,
  inventarioEntradasCafeteriaProductos,
  inventarioProductosEntradasCafeteria,
  inventarioMermacafeteriaProductos,
  inventarioProductosCantidadMerma,
  inventarioPrecioelaboracion,
  inventarioVentasCafeteriaProductos,
  inventarioGastosAreasVenta,
} from "./schema";

export const inventarioAjusteinventarioRelations = relations(
  inventarioAjusteinventario,
  ({ one, many }) => ({
    inventarioUser: one(inventarioUser, {
      fields: [inventarioAjusteinventario.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioAjusteinventarioProductos: many(
      inventarioAjusteinventarioProductos
    ),
  })
);

export const inventarioUserRelations = relations(
  inventarioUser,
  ({ one, many }) => ({
    inventarioAjusteinventarios: many(inventarioAjusteinventario),
    djangoAdminLogs: many(djangoAdminLog),
    inventarioCuentacasas: many(inventarioCuentacasa),
    inventarioGastos: many(inventarioGastos),
    inventarioHistorialprecioventacafeterias: many(
      inventarioHistorialprecioventacafeteria
    ),
    inventarioHistorialpreciocostocafeterias: many(
      inventarioHistorialpreciocostocafeteria
    ),
    inventarioHistorialpreciocostosalons: many(
      inventarioHistorialpreciocostosalon
    ),
    inventarioHistorialprecioventasalons: many(
      inventarioHistorialprecioventasalon
    ),
    inventarioMermacafeterias: many(inventarioMermacafeteria),
    inventarioSalidaalmacens: many(inventarioSalidaalmacen),
    inventarioSalidaalmacenrevoltosas: many(inventarioSalidaalmacenrevoltosa),
    inventarioSalidasCafeterias: many(inventarioSalidasCafeteria),
    inventarioTransacciones: many(inventarioTransacciones),
    inventarioVentasCafeterias: many(inventarioVentasCafeteria),
    inventarioTransferencias: many(inventarioTransferencia),
    inventarioUserGroups: many(inventarioUserGroups),
    inventarioUserUserPermissions: many(inventarioUserUserPermissions),
    inventarioAreaventa: one(inventarioAreaventa, {
      fields: [inventarioUser.areaVentaId],
      references: [inventarioAreaventa.id],
    }),
    inventarioEntradaalmacens: many(inventarioEntradaalmacen),
    inventarioEntradasCafeterias: many(inventarioEntradasCafeteria),
    inventarioPrecioelaboracions: many(inventarioPrecioelaboracion),
    inventarioVentas: many(inventarioVentas),
  })
);

export const djangoAdminLogRelations = relations(djangoAdminLog, ({ one }) => ({
  djangoContentType: one(djangoContentType, {
    fields: [djangoAdminLog.contentTypeId],
    references: [djangoContentType.id],
  }),
  inventarioUser: one(inventarioUser, {
    fields: [djangoAdminLog.userId],
    references: [inventarioUser.id],
  }),
}));

export const djangoContentTypeRelations = relations(
  djangoContentType,
  ({ many }) => ({
    djangoAdminLogs: many(djangoAdminLog),
    authPermissions: many(authPermission),
  })
);

export const inventarioAjusteinventarioProductosRelations = relations(
  inventarioAjusteinventarioProductos,
  ({ one }) => ({
    inventarioAjusteinventario: one(inventarioAjusteinventario, {
      fields: [inventarioAjusteinventarioProductos.ajusteinventarioId],
      references: [inventarioAjusteinventario.id],
    }),
    inventarioProducto: one(inventarioProducto, {
      fields: [inventarioAjusteinventarioProductos.productoId],
      references: [inventarioProducto.id],
    }),
  })
);

export const inventarioProductoRelations = relations(
  inventarioProducto,
  ({ one, many }) => ({
    inventarioAjusteinventarioProductos: many(
      inventarioAjusteinventarioProductos
    ),
    inventarioTransferenciaProductos: many(inventarioTransferenciaProductos),
    inventarioAreaventa_areaVentaId: one(inventarioAreaventa, {
      fields: [inventarioProducto.areaVentaId],
      references: [inventarioAreaventa.id],
      relationName: "inventarioProducto_areaVentaId_inventarioAreaventa_id",
    }),
    inventarioEntradaalmacen_entradaId: one(inventarioEntradaalmacen, {
      fields: [inventarioProducto.entradaId],
      references: [inventarioEntradaalmacen.id],
      relationName: "inventarioProducto_entradaId_inventarioEntradaalmacen_id",
    }),
    inventarioProductoinfo_infoId: one(inventarioProductoinfo, {
      fields: [inventarioProducto.infoId],
      references: [inventarioProductoinfo.id],
      relationName: "inventarioProducto_infoId_inventarioProductoinfo_id",
    }),
    inventarioSalidaalmacen_salidaId: one(inventarioSalidaalmacen, {
      fields: [inventarioProducto.salidaId],
      references: [inventarioSalidaalmacen.id],
      relationName: "inventarioProducto_salidaId_inventarioSalidaalmacen_id",
    }),
    inventarioSalidaalmacenrevoltosa_salidaRevoltosaId: one(
      inventarioSalidaalmacenrevoltosa,
      {
        fields: [inventarioProducto.salidaRevoltosaId],
        references: [inventarioSalidaalmacenrevoltosa.id],
        relationName:
          "inventarioProducto_salidaRevoltosaId_inventarioSalidaalmacenrevoltosa_id",
      }
    ),
    inventarioVenta_ventaId: one(inventarioVentas, {
      fields: [inventarioProducto.ventaId],
      references: [inventarioVentas.id],
      relationName: "inventarioProducto_ventaId_inventarioVentas_id",
    }),
  })
);

export const inventarioCuentacasaRelations = relations(
  inventarioCuentacasa,
  ({ one, many }) => ({
    inventarioUser: one(inventarioUser, {
      fields: [inventarioCuentacasa.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioCuentacasaProductos: many(inventarioCuentacasaProductos),
    inventarioCuentacasaElaboraciones: many(inventarioCuentacasaElaboraciones),
    inventarioTransacciones: many(inventarioTransacciones),
  })
);

export const inventarioCuentacasaProductosRelations = relations(
  inventarioCuentacasaProductos,
  ({ one }) => ({
    inventarioCuentacasa: one(inventarioCuentacasa, {
      fields: [inventarioCuentacasaProductos.cuentacasaId],
      references: [inventarioCuentacasa.id],
    }),
    inventarioProductosCantidadCuentaCasa: one(
      inventarioProductosCantidadCuentaCasa,
      {
        fields: [inventarioCuentacasaProductos.productosCantidadCuentaCasaId],
        references: [inventarioProductosCantidadCuentaCasa.id],
      }
    ),
  })
);

export const inventarioProductosCantidadCuentaCasaRelations = relations(
  inventarioProductosCantidadCuentaCasa,
  ({ one, many }) => ({
    inventarioCuentacasaProductos: many(inventarioCuentacasaProductos),
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioProductosCantidadCuentaCasa.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
  })
);

export const inventarioCuentacasaElaboracionesRelations = relations(
  inventarioCuentacasaElaboraciones,
  ({ one }) => ({
    inventarioCuentacasa: one(inventarioCuentacasa, {
      fields: [inventarioCuentacasaElaboraciones.cuentacasaId],
      references: [inventarioCuentacasa.id],
    }),
    inventarioElaboracionesCantidadCuentaCasa: one(
      inventarioElaboracionesCantidadCuentaCasa,
      {
        fields: [
          inventarioCuentacasaElaboraciones.elaboracionesCantidadCuentaCasaId,
        ],
        references: [inventarioElaboracionesCantidadCuentaCasa.id],
      }
    ),
  })
);

export const inventarioElaboracionesCantidadCuentaCasaRelations = relations(
  inventarioElaboracionesCantidadCuentaCasa,
  ({ one, many }) => ({
    inventarioCuentacasaElaboraciones: many(inventarioCuentacasaElaboraciones),
    inventarioElaboracione: one(inventarioElaboraciones, {
      fields: [inventarioElaboracionesCantidadCuentaCasa.productoId],
      references: [inventarioElaboraciones.id],
    }),
  })
);

export const inventarioElaboracionesRelations = relations(
  inventarioElaboraciones,
  ({ many }) => ({
    inventarioElaboracionesCantidadCuentaCasas: many(
      inventarioElaboracionesCantidadCuentaCasa
    ),
    inventarioElaboracionesIngredientesCantidads: many(
      inventarioElaboracionesIngredientesCantidad
    ),
    inventarioElaboracionesCantidadMermas: many(
      inventarioElaboracionesCantidadMerma
    ),
    inventarioElaboracionesVentasCafeterias: many(
      inventarioElaboracionesVentasCafeteria
    ),
    inventarioElaboracionesSalidasAlmacenCafeterias: many(
      inventarioElaboracionesSalidasAlmacenCafeteria
    ),
    inventarioPrecioelaboracions: many(inventarioPrecioelaboracion),
  })
);

export const inventarioElaboracionesIngredientesCantidadRelations = relations(
  inventarioElaboracionesIngredientesCantidad,
  ({ one }) => ({
    inventarioElaboracione: one(inventarioElaboraciones, {
      fields: [inventarioElaboracionesIngredientesCantidad.elaboracionesId],
      references: [inventarioElaboraciones.id],
    }),
    inventarioIngredienteCantidad: one(inventarioIngredienteCantidad, {
      fields: [
        inventarioElaboracionesIngredientesCantidad.ingredienteCantidadId,
      ],
      references: [inventarioIngredienteCantidad.id],
    }),
  })
);

export const inventarioIngredienteCantidadRelations = relations(
  inventarioIngredienteCantidad,
  ({ one, many }) => ({
    inventarioElaboracionesIngredientesCantidads: many(
      inventarioElaboracionesIngredientesCantidad
    ),
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioIngredienteCantidad.ingredienteId],
      references: [inventarioProductosCafeteria.id],
    }),
  })
);

export const inventarioElaboracionesCantidadMermaRelations = relations(
  inventarioElaboracionesCantidadMerma,
  ({ one, many }) => ({
    inventarioElaboracione: one(inventarioElaboraciones, {
      fields: [inventarioElaboracionesCantidadMerma.productoId],
      references: [inventarioElaboraciones.id],
    }),
    inventarioMermacafeteriaElaboraciones: many(
      inventarioMermacafeteriaElaboraciones
    ),
  })
);

export const inventarioAreaventaRelations = relations(
  inventarioAreaventa,
  ({ one, many }) => ({
    inventarioCuenta: one(inventarioCuentas, {
      fields: [inventarioAreaventa.cuentaId],
      references: [inventarioCuentas.id],
    }),
    inventarioGastos: many(inventarioGastos),
    inventarioSalidaalmacens: many(inventarioSalidaalmacen),
    inventarioTransferencias_deId: many(inventarioTransferencia, {
      relationName: "inventarioTransferencia_deId_inventarioAreaventa_id",
    }),
    inventarioTransferencias_paraId: many(inventarioTransferencia, {
      relationName: "inventarioTransferencia_paraId_inventarioAreaventa_id",
    }),
    inventarioUsers: many(inventarioUser),
    inventarioProductos_areaVentaId: many(inventarioProducto, {
      relationName: "inventarioProducto_areaVentaId_inventarioAreaventa_id",
    }),
    inventarioVentas: many(inventarioVentas),
    inventarioGastosAreasVentas: many(inventarioGastosAreasVenta),
  })
);

export const inventarioCuentasRelations = relations(
  inventarioCuentas,
  ({ many }) => ({
    inventarioAreaventas: many(inventarioAreaventa),
    inventarioGastos: many(inventarioGastos),
    inventarioTransacciones: many(inventarioTransacciones),
  })
);

export const inventarioElaboracionesVentasCafeteriaRelations = relations(
  inventarioElaboracionesVentasCafeteria,
  ({ one, many }) => ({
    inventarioElaboracione: one(inventarioElaboraciones, {
      fields: [inventarioElaboracionesVentasCafeteria.productoId],
      references: [inventarioElaboraciones.id],
    }),
    inventarioVentasCafeteriaElaboraciones: many(
      inventarioVentasCafeteriaElaboraciones
    ),
  })
);

export const inventarioGastosRelations = relations(
  inventarioGastos,
  ({ one, many }) => ({
    inventarioAreaventa: one(inventarioAreaventa, {
      fields: [inventarioGastos.areaVentaId],
      references: [inventarioAreaventa.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioGastos.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioCuenta: one(inventarioCuentas, {
      fields: [inventarioGastos.cuentaId],
      references: [inventarioCuentas.id],
    }),
    inventarioTransacciones: many(inventarioTransacciones),
    inventarioGastosAreasVentas: many(inventarioGastosAreasVenta),
  })
);

export const inventarioHistorialprecioventacafeteriaRelations = relations(
  inventarioHistorialprecioventacafeteria,
  ({ one }) => ({
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioHistorialprecioventacafeteria.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioHistorialprecioventacafeteria.usuarioId],
      references: [inventarioUser.id],
    }),
  })
);

export const inventarioProductosCafeteriaRelations = relations(
  inventarioProductosCafeteria,
  ({ many }) => ({
    inventarioHistorialprecioventacafeterias: many(
      inventarioHistorialprecioventacafeteria
    ),
    inventarioHistorialpreciocostocafeterias: many(
      inventarioHistorialpreciocostocafeteria
    ),
    inventarioProductosCantidadCuentaCasas: many(
      inventarioProductosCantidadCuentaCasa
    ),
    inventarioInventarioAlmacenCafeterias: many(
      inventarioInventarioAlmacenCafeteria
    ),
    inventarioInventarioAreaCafeterias: many(inventarioInventarioAreaCafeteria),
    inventarioProductosVentasCafeterias: many(
      inventarioProductosVentasCafeteria
    ),
    inventarioProductosSalidasCafeterias: many(
      inventarioProductosSalidasCafeteria
    ),
    inventarioIngredienteCantidads: many(inventarioIngredienteCantidad),
    inventarioProductosEntradasCafeterias: many(
      inventarioProductosEntradasCafeteria
    ),
    inventarioProductosCantidadMermas: many(inventarioProductosCantidadMerma),
  })
);

export const inventarioHistorialpreciocostocafeteriaRelations = relations(
  inventarioHistorialpreciocostocafeteria,
  ({ one }) => ({
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioHistorialpreciocostocafeteria.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioHistorialpreciocostocafeteria.usuarioId],
      references: [inventarioUser.id],
    }),
  })
);

export const inventarioHistorialpreciocostosalonRelations = relations(
  inventarioHistorialpreciocostosalon,
  ({ one }) => ({
    inventarioProductoinfo: one(inventarioProductoinfo, {
      fields: [inventarioHistorialpreciocostosalon.productoInfoId],
      references: [inventarioProductoinfo.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioHistorialpreciocostosalon.usuarioId],
      references: [inventarioUser.id],
    }),
  })
);

export const inventarioProductoinfoRelations = relations(
  inventarioProductoinfo,
  ({ one, many }) => ({
    inventarioHistorialpreciocostosalons: many(
      inventarioHistorialpreciocostosalon
    ),
    inventarioHistorialprecioventasalons: many(
      inventarioHistorialprecioventasalon
    ),
    inventarioCategoria: one(inventarioCategorias, {
      fields: [inventarioProductoinfo.categoriaId],
      references: [inventarioCategorias.id],
    }),
    inventarioImage: one(inventarioImage, {
      fields: [inventarioProductoinfo.imagenId],
      references: [inventarioImage.id],
    }),
    inventarioProductos_infoId: many(inventarioProducto, {
      relationName: "inventarioProducto_infoId_inventarioProductoinfo_id",
    }),
  })
);

export const inventarioHistorialprecioventasalonRelations = relations(
  inventarioHistorialprecioventasalon,
  ({ one }) => ({
    inventarioProductoinfo: one(inventarioProductoinfo, {
      fields: [inventarioHistorialprecioventasalon.productoInfoId],
      references: [inventarioProductoinfo.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioHistorialprecioventasalon.usuarioId],
      references: [inventarioUser.id],
    }),
  })
);

export const inventarioCategoriasRelations = relations(
  inventarioCategorias,
  ({ many }) => ({
    inventarioProductoinfos: many(inventarioProductoinfo),
  })
);

export const inventarioImageRelations = relations(
  inventarioImage,
  ({ many }) => ({
    inventarioProductoinfos: many(inventarioProductoinfo),
  })
);

export const inventarioInventarioAlmacenCafeteriaRelations = relations(
  inventarioInventarioAlmacenCafeteria,
  ({ one }) => ({
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioInventarioAlmacenCafeteria.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
  })
);

export const inventarioInventarioAreaCafeteriaRelations = relations(
  inventarioInventarioAreaCafeteria,
  ({ one }) => ({
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioInventarioAreaCafeteria.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
  })
);

export const inventarioMermacafeteriaElaboracionesRelations = relations(
  inventarioMermacafeteriaElaboraciones,
  ({ one }) => ({
    inventarioElaboracionesCantidadMerma: one(
      inventarioElaboracionesCantidadMerma,
      {
        fields: [
          inventarioMermacafeteriaElaboraciones.elaboracionesCantidadMermaId,
        ],
        references: [inventarioElaboracionesCantidadMerma.id],
      }
    ),
    inventarioMermacafeteria: one(inventarioMermacafeteria, {
      fields: [inventarioMermacafeteriaElaboraciones.mermacafeteriaId],
      references: [inventarioMermacafeteria.id],
    }),
  })
);

export const inventarioMermacafeteriaRelations = relations(
  inventarioMermacafeteria,
  ({ one, many }) => ({
    inventarioMermacafeteriaElaboraciones: many(
      inventarioMermacafeteriaElaboraciones
    ),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioMermacafeteria.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioMermacafeteriaProductos: many(inventarioMermacafeteriaProductos),
  })
);

export const inventarioSalidaalmacenRelations = relations(
  inventarioSalidaalmacen,
  ({ one, many }) => ({
    inventarioAreaventa: one(inventarioAreaventa, {
      fields: [inventarioSalidaalmacen.areaVentaId],
      references: [inventarioAreaventa.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioSalidaalmacen.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioProductos_salidaId: many(inventarioProducto, {
      relationName: "inventarioProducto_salidaId_inventarioSalidaalmacen_id",
    }),
  })
);

export const inventarioProductosVentasCafeteriaRelations = relations(
  inventarioProductosVentasCafeteria,
  ({ one, many }) => ({
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioProductosVentasCafeteria.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
    inventarioVentasCafeteriaProductos: many(
      inventarioVentasCafeteriaProductos
    ),
  })
);

export const inventarioProductosSalidasCafeteriaRelations = relations(
  inventarioProductosSalidasCafeteria,
  ({ one, many }) => ({
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioProductosSalidasCafeteria.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
    inventarioSalidasCafeteriaProductos: many(
      inventarioSalidasCafeteriaProductos
    ),
  })
);

export const inventarioSalidaalmacenrevoltosaRelations = relations(
  inventarioSalidaalmacenrevoltosa,
  ({ one, many }) => ({
    inventarioUser: one(inventarioUser, {
      fields: [inventarioSalidaalmacenrevoltosa.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioProductos_salidaRevoltosaId: many(inventarioProducto, {
      relationName:
        "inventarioProducto_salidaRevoltosaId_inventarioSalidaalmacenrevoltosa_id",
    }),
  })
);

export const inventarioSalidasCafeteriaElaboracionesRelations = relations(
  inventarioSalidasCafeteriaElaboraciones,
  ({ one }) => ({
    inventarioElaboracionesSalidasAlmacenCafeteria: one(
      inventarioElaboracionesSalidasAlmacenCafeteria,
      {
        fields: [
          inventarioSalidasCafeteriaElaboraciones.elaboracionesSalidasAlmacenCafeteriaId,
        ],
        references: [inventarioElaboracionesSalidasAlmacenCafeteria.id],
      }
    ),
    inventarioSalidasCafeteria: one(inventarioSalidasCafeteria, {
      fields: [inventarioSalidasCafeteriaElaboraciones.salidasCafeteriaId],
      references: [inventarioSalidasCafeteria.id],
    }),
  })
);

export const inventarioElaboracionesSalidasAlmacenCafeteriaRelations =
  relations(
    inventarioElaboracionesSalidasAlmacenCafeteria,
    ({ one, many }) => ({
      inventarioSalidasCafeteriaElaboraciones: many(
        inventarioSalidasCafeteriaElaboraciones
      ),
      inventarioElaboracione: one(inventarioElaboraciones, {
        fields: [inventarioElaboracionesSalidasAlmacenCafeteria.productoId],
        references: [inventarioElaboraciones.id],
      }),
    })
  );

export const inventarioSalidasCafeteriaRelations = relations(
  inventarioSalidasCafeteria,
  ({ one, many }) => ({
    inventarioSalidasCafeteriaElaboraciones: many(
      inventarioSalidasCafeteriaElaboraciones
    ),
    inventarioSalidasCafeteriaProductos: many(
      inventarioSalidasCafeteriaProductos
    ),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioSalidasCafeteria.usuarioId],
      references: [inventarioUser.id],
    }),
  })
);

export const inventarioSalidasCafeteriaProductosRelations = relations(
  inventarioSalidasCafeteriaProductos,
  ({ one }) => ({
    inventarioProductosSalidasCafeteria: one(
      inventarioProductosSalidasCafeteria,
      {
        fields: [
          inventarioSalidasCafeteriaProductos.productosSalidasCafeteriaId,
        ],
        references: [inventarioProductosSalidasCafeteria.id],
      }
    ),
    inventarioSalidasCafeteria: one(inventarioSalidasCafeteria, {
      fields: [inventarioSalidasCafeteriaProductos.salidasCafeteriaId],
      references: [inventarioSalidasCafeteria.id],
    }),
  })
);

export const inventarioTransaccionesRelations = relations(
  inventarioTransacciones,
  ({ one }) => ({
    inventarioEntradasCafeteria: one(inventarioEntradasCafeteria, {
      fields: [inventarioTransacciones.entradaCafeteriaId],
      references: [inventarioEntradasCafeteria.id],
    }),
    inventarioEntradaalmacen: one(inventarioEntradaalmacen, {
      fields: [inventarioTransacciones.entradaId],
      references: [inventarioEntradaalmacen.id],
    }),
    inventarioVentasCafeteria: one(inventarioVentasCafeteria, {
      fields: [inventarioTransacciones.ventaCafeteriaId],
      references: [inventarioVentasCafeteria.id],
    }),
    inventarioVenta: one(inventarioVentas, {
      fields: [inventarioTransacciones.ventaId],
      references: [inventarioVentas.id],
    }),
    inventarioCuenta: one(inventarioCuentas, {
      fields: [inventarioTransacciones.cuentaId],
      references: [inventarioCuentas.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioTransacciones.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioGasto: one(inventarioGastos, {
      fields: [inventarioTransacciones.gastoId],
      references: [inventarioGastos.id],
    }),
    inventarioCuentacasa: one(inventarioCuentacasa, {
      fields: [inventarioTransacciones.cuentaCasaId],
      references: [inventarioCuentacasa.id],
    }),
  })
);

export const inventarioEntradasCafeteriaRelations = relations(
  inventarioEntradasCafeteria,
  ({ one, many }) => ({
    inventarioTransacciones: many(inventarioTransacciones),
    inventarioProveedor: one(inventarioProveedor, {
      fields: [inventarioEntradasCafeteria.proveedorId],
      references: [inventarioProveedor.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioEntradasCafeteria.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioEntradasCafeteriaProductos: many(
      inventarioEntradasCafeteriaProductos
    ),
  })
);

export const inventarioEntradaalmacenRelations = relations(
  inventarioEntradaalmacen,
  ({ one, many }) => ({
    inventarioTransacciones: many(inventarioTransacciones),
    inventarioProductos_entradaId: many(inventarioProducto, {
      relationName: "inventarioProducto_entradaId_inventarioEntradaalmacen_id",
    }),
    inventarioProveedor: one(inventarioProveedor, {
      fields: [inventarioEntradaalmacen.proveedorId],
      references: [inventarioProveedor.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioEntradaalmacen.usuarioId],
      references: [inventarioUser.id],
    }),
  })
);

export const inventarioVentasCafeteriaRelations = relations(
  inventarioVentasCafeteria,
  ({ one, many }) => ({
    inventarioTransacciones: many(inventarioTransacciones),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioVentasCafeteria.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioVentasCafeteriaElaboraciones: many(
      inventarioVentasCafeteriaElaboraciones
    ),
    inventarioVentasCafeteriaProductos: many(
      inventarioVentasCafeteriaProductos
    ),
  })
);

export const inventarioVentasRelations = relations(
  inventarioVentas,
  ({ one, many }) => ({
    inventarioTransacciones: many(inventarioTransacciones),
    inventarioProductos_ventaId: many(inventarioProducto, {
      relationName: "inventarioProducto_ventaId_inventarioVentas_id",
    }),
    inventarioAreaventa: one(inventarioAreaventa, {
      fields: [inventarioVentas.areaVentaId],
      references: [inventarioAreaventa.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioVentas.usuarioId],
      references: [inventarioUser.id],
    }),
  })
);

export const inventarioTransferenciaRelations = relations(
  inventarioTransferencia,
  ({ one, many }) => ({
    inventarioAreaventa_deId: one(inventarioAreaventa, {
      fields: [inventarioTransferencia.deId],
      references: [inventarioAreaventa.id],
      relationName: "inventarioTransferencia_deId_inventarioAreaventa_id",
    }),
    inventarioAreaventa_paraId: one(inventarioAreaventa, {
      fields: [inventarioTransferencia.paraId],
      references: [inventarioAreaventa.id],
      relationName: "inventarioTransferencia_paraId_inventarioAreaventa_id",
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioTransferencia.usuarioId],
      references: [inventarioUser.id],
    }),
    inventarioTransferenciaProductos: many(inventarioTransferenciaProductos),
  })
);

export const inventarioTransferenciaProductosRelations = relations(
  inventarioTransferenciaProductos,
  ({ one }) => ({
    inventarioProducto: one(inventarioProducto, {
      fields: [inventarioTransferenciaProductos.productoId],
      references: [inventarioProducto.id],
    }),
    inventarioTransferencia: one(inventarioTransferencia, {
      fields: [inventarioTransferenciaProductos.transferenciaId],
      references: [inventarioTransferencia.id],
    }),
  })
);

export const inventarioUserGroupsRelations = relations(
  inventarioUserGroups,
  ({ one }) => ({
    authGroup: one(authGroup, {
      fields: [inventarioUserGroups.groupId],
      references: [authGroup.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioUserGroups.userId],
      references: [inventarioUser.id],
    }),
  })
);

export const authGroupRelations = relations(authGroup, ({ many }) => ({
  inventarioUserGroups: many(inventarioUserGroups),
  authGroupPermissions: many(authGroupPermissions),
}));

export const inventarioUserUserPermissionsRelations = relations(
  inventarioUserUserPermissions,
  ({ one }) => ({
    authPermission: one(authPermission, {
      fields: [inventarioUserUserPermissions.permissionId],
      references: [authPermission.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioUserUserPermissions.userId],
      references: [inventarioUser.id],
    }),
  })
);

export const authPermissionRelations = relations(
  authPermission,
  ({ one, many }) => ({
    inventarioUserUserPermissions: many(inventarioUserUserPermissions),
    djangoContentType: one(djangoContentType, {
      fields: [authPermission.contentTypeId],
      references: [djangoContentType.id],
    }),
    authGroupPermissions: many(authGroupPermissions),
  })
);

export const inventarioVentasCafeteriaElaboracionesRelations = relations(
  inventarioVentasCafeteriaElaboraciones,
  ({ one }) => ({
    inventarioElaboracionesVentasCafeteria: one(
      inventarioElaboracionesVentasCafeteria,
      {
        fields: [
          inventarioVentasCafeteriaElaboraciones.elaboracionesVentasCafeteriaId,
        ],
        references: [inventarioElaboracionesVentasCafeteria.id],
      }
    ),
    inventarioVentasCafeteria: one(inventarioVentasCafeteria, {
      fields: [inventarioVentasCafeteriaElaboraciones.ventasCafeteriaId],
      references: [inventarioVentasCafeteria.id],
    }),
  })
);

export const authGroupPermissionsRelations = relations(
  authGroupPermissions,
  ({ one }) => ({
    authPermission: one(authPermission, {
      fields: [authGroupPermissions.permissionId],
      references: [authPermission.id],
    }),
    authGroup: one(authGroup, {
      fields: [authGroupPermissions.groupId],
      references: [authGroup.id],
    }),
  })
);

export const inventarioProveedorRelations = relations(
  inventarioProveedor,
  ({ many }) => ({
    inventarioEntradaalmacens: many(inventarioEntradaalmacen),
    inventarioEntradasCafeterias: many(inventarioEntradasCafeteria),
  })
);

export const inventarioEntradasCafeteriaProductosRelations = relations(
  inventarioEntradasCafeteriaProductos,
  ({ one }) => ({
    inventarioEntradasCafeteria: one(inventarioEntradasCafeteria, {
      fields: [inventarioEntradasCafeteriaProductos.entradasCafeteriaId],
      references: [inventarioEntradasCafeteria.id],
    }),
    inventarioProductosEntradasCafeteria: one(
      inventarioProductosEntradasCafeteria,
      {
        fields: [
          inventarioEntradasCafeteriaProductos.productosEntradasCafeteriaId,
        ],
        references: [inventarioProductosEntradasCafeteria.id],
      }
    ),
  })
);

export const inventarioProductosEntradasCafeteriaRelations = relations(
  inventarioProductosEntradasCafeteria,
  ({ one, many }) => ({
    inventarioEntradasCafeteriaProductos: many(
      inventarioEntradasCafeteriaProductos
    ),
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioProductosEntradasCafeteria.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
  })
);

export const inventarioMermacafeteriaProductosRelations = relations(
  inventarioMermacafeteriaProductos,
  ({ one }) => ({
    inventarioMermacafeteria: one(inventarioMermacafeteria, {
      fields: [inventarioMermacafeteriaProductos.mermacafeteriaId],
      references: [inventarioMermacafeteria.id],
    }),
    inventarioProductosCantidadMerma: one(inventarioProductosCantidadMerma, {
      fields: [inventarioMermacafeteriaProductos.productosCantidadMermaId],
      references: [inventarioProductosCantidadMerma.id],
    }),
  })
);

export const inventarioProductosCantidadMermaRelations = relations(
  inventarioProductosCantidadMerma,
  ({ one, many }) => ({
    inventarioMermacafeteriaProductos: many(inventarioMermacafeteriaProductos),
    inventarioProductosCafeteria: one(inventarioProductosCafeteria, {
      fields: [inventarioProductosCantidadMerma.productoId],
      references: [inventarioProductosCafeteria.id],
    }),
  })
);

export const inventarioPrecioelaboracionRelations = relations(
  inventarioPrecioelaboracion,
  ({ one }) => ({
    inventarioElaboracione: one(inventarioElaboraciones, {
      fields: [inventarioPrecioelaboracion.elaboracionId],
      references: [inventarioElaboraciones.id],
    }),
    inventarioUser: one(inventarioUser, {
      fields: [inventarioPrecioelaboracion.usuarioId],
      references: [inventarioUser.id],
    }),
  })
);

export const inventarioVentasCafeteriaProductosRelations = relations(
  inventarioVentasCafeteriaProductos,
  ({ one }) => ({
    inventarioProductosVentasCafeteria: one(
      inventarioProductosVentasCafeteria,
      {
        fields: [inventarioVentasCafeteriaProductos.productosVentasCafeteriaId],
        references: [inventarioProductosVentasCafeteria.id],
      }
    ),
    inventarioVentasCafeteria: one(inventarioVentasCafeteria, {
      fields: [inventarioVentasCafeteriaProductos.ventasCafeteriaId],
      references: [inventarioVentasCafeteria.id],
    }),
  })
);

export const inventarioGastosAreasVentaRelations = relations(
  inventarioGastosAreasVenta,
  ({ one }) => ({
    inventarioGasto: one(inventarioGastos, {
      fields: [inventarioGastosAreasVenta.gastosId],
      references: [inventarioGastos.id],
    }),
    inventarioAreaventa: one(inventarioAreaventa, {
      fields: [inventarioGastosAreasVenta.areaventaId],
      references: [inventarioAreaventa.id],
    }),
  })
);

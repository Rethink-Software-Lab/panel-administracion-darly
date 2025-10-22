import { METODOS_PAGO } from "@/app/(with-layout)/(almacen-cafeteria)/entradas-cafeteria/types";
import {
  FrecuenciasGastos,
  TiposGastos,
} from "@/app/(with-layout)/gastos/types";
import { LOCALACIONES } from "@/app/(with-layout)/merma/type";
import { Banco, TipoTransferencia } from "@/app/(with-layout)/cuentas/types";
import { ROLES } from "@/app/(with-layout)/users/types";
import {
  enum_,
  pipe,
  minLength,
  object,
  literal,
  string,
  number,
  minValue,
  array,
  optional,
  nonEmpty,
  forward,
  partialCheck,
  maxValue,
  integer,
  boolean,
  custom,
  maxLength,
  transform,
} from "valibot";

export const UserSchema = pipe(
  object({
    username: pipe(
      string("El nombre de ususario es requerido"),
      minLength(1, "El nombre de ususario es requerido")
    ),
    rol: enum_(ROLES, "Rol invalido"),
    area_venta: optional(pipe(string(), nonEmpty())),
    almacen: optional(pipe(string(), nonEmpty())),
    password: pipe(
      string("La contraseña es requerida"),
      minLength(1, "La contraseña es requerida")
    ),
  }),
  forward(
    partialCheck(
      [["rol"], ["area_venta"]],
      (input) => {
        if (input.rol === "VENDEDOR" && !input.area_venta) {
          return false;
        }
        return true;
      },
      "Debe asignarle un área de venta al vendedor."
    ),
    ["area_venta"]
  ),
  forward(
    partialCheck(
      [["rol"], ["almacen"]],
      (input) => {
        if (input.rol === ROLES.ALMACENERO && !input.almacen) {
          return false;
        }
        return true;
      },
      "Debe asignarle un almacén al almacenero."
    ),
    ["almacen"]
  )
);

export const LoginSchema = object({
  username: pipe(
    string("El nombre de ususario es requerido"),
    nonEmpty("El nombre de ususario es requerido")
  ),
  password: pipe(
    string("La contraseña es requerida"),
    nonEmpty("La contraseña es requerida")
  ),
});

export const ProductSchema = object({
  descripcion: pipe(
    string("La descripción debe ser una cadena de texto"),
    minLength(1, "La descripción es requerida")
  ),
  categoria: pipe(
    string("La categoría es requeriada"),
    nonEmpty("La categoría es requeriada")
  ),
  precio_costo: optional(
    pipe(
      number("El precio de costo es un número"),
      minValue(1, "El precio de costo es requerido")
    )
  ),
  precio_venta: optional(
    pipe(
      number("El precio de venta es un número"),
      minValue(1, "El precio de venta es requerido")
    )
  ),
  pago_trabajador: pipe(
    number("El pago del trabajador es un número"),
    minValue(0, "Debe ser un número positivo")
  ),
  deletePhoto: boolean("debe ser un booleano"),
});

export const SalidaRevoltosaSchema = object({
  zapatos_id: optional(
    pipe(
      array(string(), "Productos no puede estar vacio"),
      minLength(1, "Productos no puede estar vacio")
    )
  ),
  cantidad: optional(
    pipe(
      number("Debe introducir un número"),
      integer("Debe introducir un número entero"),
      minValue(1, "La cantidad debe ser mayor que 0")
    )
  ),
  producto_info: pipe(
    string("El producto es requerido."),
    nonEmpty("El producto es requerido.")
  ),
});

export const SearchSchema = pipe(
  object({
    codigo: string("Ingresa un código"),
    numero: string("Ingresa un número"),
  }),
  forward(
    partialCheck(
      [["codigo"], ["numero"]],
      (input) => {
        if (!input.codigo && !input.numero) {
          return false;
        }
        return true;
      },
      "Rellene el formulario."
    ),
    ["codigo"]
  )
);

export const FiltersSchema = object({
  modelo: pipe(
    string("Seleccione un modelo"),
    minLength(1, "Seleccione un modelo")
  ),
});

export const onlyNombreSchema = object({
  nombre: pipe(string("Campo requerido."), nonEmpty("Campo requerido.")),
});

export const EspecialWarningSchema = object({
  test: literal("BORRAR", "El campo debe ser igual a BORRAR"),
});

export const TransferenciaSchema = pipe(
  object({
    de: pipe(
      string("El área de origen es requerida."),
      nonEmpty("El área de origen es requerida.")
    ),
    para: pipe(
      string("El área de destino es requerida."),
      nonEmpty("El área de destino es requerida.")
    ),
    productos: array(
      object({
        producto: pipe(
          string("El producto es requerido."),
          nonEmpty("El producto es requerido.")
        ),
        cantidad: optional(
          pipe(
            string(),
            nonEmpty(),
            custom<string>((value) => {
              const parsedValue = parseInt(value as string, 10);
              return !isNaN(parsedValue) && parsedValue >= 1;
            }, "La cantidad debe ser > 0")
          )
        ),
        zapatos_id: optional(
          pipe(
            string("El ID de zapatos es requerido."),
            nonEmpty("El ID de zapatos es requerido."),
            custom((input: any) => {
              const ids = input.replace(/\s+/g, "").split(/[;,]/);
              const uniqueIds = new Set(ids);
              return (
                ids.every(
                  (id: string) => /^\d+$/.test(id) && parseInt(id) > 0
                ) && ids.length === uniqueIds.size
              );
            }, "Los IDs deben ser números enteros > 0, separados por coma (,) o punto y coma (;) y deben ser únicos.")
          )
        ),
      })
    ),
  }),
  forward(
    partialCheck(
      [["de"], ["para"]],
      (input) => {
        if (input.de === input.para) {
          return false;
        }
        return true;
      },
      "Las áreas de origen y destino no pueden ser iguales."
    ),
    ["de"]
  ),
  forward(
    partialCheck(
      ["productos"] as any[],
      (input) => {
        const productosIds = input.productos.map(
          (producto) => producto.producto
        );
        const uniqueProductos = new Set(productosIds);
        if (productosIds.length !== uniqueProductos.size) {
          return false;
        }
        return true;
      },
      "No se deben tener productos repetidos."
    ),
    ["productos"]
  )
);

export const AjusteSchema = object({
  motivo: pipe(
    string("El área de origen es requerida."),
    nonEmpty("El área de origen es requerida."),
    maxLength(100, "El motivo no debe tener más de 100 caracteres.")
  ),
  productos: array(
    object({
      producto: pipe(
        string("El producto es requerido."),
        nonEmpty("El producto es requerido.")
      ),
      cantidad: optional(
        pipe(
          string(),
          nonEmpty(),
          custom<string>((value) => {
            const parsedValue = parseInt(value as string, 10);
            return !isNaN(parsedValue) && parsedValue >= 1;
          }, "La cantidad debe ser > 0")
        )
      ),
      area_venta: optional(pipe(string(), nonEmpty("Localización requerida."))),
      zapatos_id: optional(
        pipe(
          string("El ID de zapatos es requerido."),
          nonEmpty("El ID de zapatos es requerido."),
          custom((input: any) => {
            const ids = input.replace(/\s+/g, "").split(/[;,]/);
            const uniqueIds = new Set(ids);
            return (
              ids.every((id: string) => /^\d+$/.test(id) && parseInt(id) > 0) &&
              ids.length === uniqueIds.size
            );
          }, "Los IDs deben ser números enteros > 0, separados por coma (,) o punto y coma (;) y deben ser únicos.")
        )
      ),
    })
  ),
});

export const ElaboracionesSchema = pipe(
  object({
    nombre: pipe(
      string("El nombre es requerido"),
      nonEmpty("El nombre es requerido")
    ),
    precio: pipe(
      string("El precio es requerido"),
      nonEmpty("El precio es requerido")
    ),
    mano_obra: pipe(
      string("La mano de obra es requerida"),
      nonEmpty("La mano de obra es requerida")
    ),
    ingredientes: array(
      object({
        producto: pipe(
          string("El producto es requerido"),
          nonEmpty("El producto es requerido")
        ),
        cantidad: pipe(
          string("La cantidad es requerida"),
          nonEmpty("La cantidad es requerida")
        ),
      })
    ),
  }),
  forward(
    partialCheck(
      ["ingredientes"] as any[],
      (input) => {
        const productosIds = input.ingredientes.map(
          (ingrediente) => ingrediente.producto
        );
        const uniqueProductos = new Set(productosIds);
        if (productosIds.length !== uniqueProductos.size) {
          return false;
        }
        return true;
      },
      "No se deben tener productos repetidos."
    ),
    ["ingredientes"]
  )
);

export const ProductosCafeteriaSchema = object({
  nombre: pipe(
    string("El nombre es requerido"),
    nonEmpty("El nombre es requerido")
  ),
  precio_costo: pipe(
    string("El precio de costo es requerido"),
    nonEmpty("El precio de costo es requerido")
  ),
  precio_venta: pipe(
    string("El precio de venta es requerido"),
    nonEmpty("El precio de venta es requerido")
  ),
});

export const SalidaAlmacenCafeteriaSchema = pipe(
  object({
    productos: array(
      object({
        producto: pipe(
          string("El producto es requerido"),
          nonEmpty("El producto es requerido")
        ),
        cantidad: pipe(
          string("La cantidad es requerida"),
          nonEmpty("La cantidad es requerida")
        ),
        isElaboracion: boolean(),
      })
    ),
  }),
  forward(
    partialCheck(
      ["productos"] as any[],
      (input) => {
        const productosIds = input.productos.map(
          (producto) => producto.producto
        );
        const uniqueProductos = new Set(productosIds);
        if (productosIds.length !== uniqueProductos.size) {
          return false;
        }
        return true;
      },
      "No se deben tener productos repetidos."
    ),
    ["productos"]
  )
);

export const MermaCafeteriaSchema = pipe(
  object({
    localizacion: enum_(LOCALACIONES, "La localización es requerida."),
    productos: array(
      object({
        producto: pipe(
          string("El producto es requerido"),
          nonEmpty("El producto es requerido")
        ),
        cantidad: pipe(
          string("La cantidad es requerida"),
          nonEmpty("La cantidad es requerida")
        ),
        isElaboracion: boolean(),
      })
    ),
  }),
  forward(
    partialCheck(
      ["productos"] as any[],
      (input) => {
        const productosIds = input.productos.map(
          (producto) => producto.producto
        );
        const uniqueProductos = new Set(productosIds);
        if (productosIds.length !== uniqueProductos.size) {
          return false;
        }
        return true;
      },
      "No se deben tener productos repetidos."
    ),
    ["productos"]
  )
);

export const CuentaCasaSchema = pipe(
  object({
    localizacion: enum_(LOCALACIONES, "La localización es requerida."),
    productos: array(
      object({
        producto: pipe(
          string("El producto es requerido"),
          nonEmpty("El producto es requerido")
        ),
        cantidad: pipe(
          string("La cantidad es requerida"),
          nonEmpty("La cantidad es requerida")
        ),
        isElaboracion: boolean(),
      })
    ),
  }),
  forward(
    partialCheck(
      ["productos"] as any[],
      (input) => {
        const productosIds = input.productos.map(
          (producto) => producto.producto
        );
        const uniqueProductos = new Set(productosIds);
        if (productosIds.length !== uniqueProductos.size) {
          return false;
        }
        return true;
      },
      "No se deben tener productos repetidos."
    ),
    ["productos"]
  )
);

export const ReferidoSchema = object({
  nombre: pipe(
    string("El nombre es requerido"),
    nonEmpty("El nombre es requerido")
  ),
  telefono: pipe(
    string("El telefono es requerido"),
    nonEmpty("El telefono es requerido")
  ),
});

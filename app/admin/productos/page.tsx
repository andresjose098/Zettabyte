"use client";

import { FormEvent, useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

type Producto = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  featured: boolean;
  offer: boolean;
  category: {
    id: number;
    name: string;
  };
};

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [featured, setFeatured] = useState(false);
  const [offer, setOffer] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  // =========================
  // PRECIO
  // =========================

  const formatearPrecio = (valor: string) => {
    const soloNumeros = valor.replace(/\D/g, "");

    if (!soloNumeros) return "";

    return Number(soloNumeros).toLocaleString("es-CO");
  };

  const obtenerPrecioNumerico = (valor: string) => {
    return Number(valor.replace(/\./g, ""));
  };

  // =========================
  // LEER RESPUESTAS API
  // =========================

  const leerRespuesta = async (respuesta: Response) => {
    const texto = await respuesta.text();

    if (!texto) {
      return {};
    }

    try {
      return JSON.parse(texto);
    } catch {
      console.error("Respuesta no JSON del servidor:", texto);

      return {
        error:
          "El servidor devolvió una respuesta inesperada. Revisa la terminal.",
      };
    }
  };

  // =========================
  // CARGAR PRODUCTOS
  // =========================

  const cargarProductos = async () => {
    try {
      const respuesta = await fetch("/api/admin/productos", {
        cache: "no-store",
      });

      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        setMensaje(
          datos.error || "No se pudieron cargar los productos"
        );
        return;
      }

      setProductos(datos);
    } catch (error) {
      console.error(error);
      setMensaje("No se pudieron cargar los productos");
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // =========================
  // SUBIR IMAGEN
  // =========================

 const subirImagen = async (
  archivo: File
) => {
  setMensaje("");

  if (!archivo.type.startsWith("image/")) {
    setMensaje(
      "Selecciona un archivo de imagen válido."
    );
    return;
  }

  if (archivo.size > 15 * 1024 * 1024) {
    setMensaje(
      "La imagen no puede superar los 15 MB."
    );
    return;
  }

  setSubiendoImagen(true);

  try {
    const nombreSeguro = archivo.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(
        /[^a-z0-9.\-_]/g,
        ""
      );

    const blob = await upload(
      `productos/${Date.now()}-${nombreSeguro}`,
      archivo,
      {
        access: "public",

        handleUploadUrl:
          "/api/admin/upload-client",

        multipart: true,

        onUploadProgress: ({
          percentage,
        }) => {
          setMensaje(
            `Subiendo imagen... ${Math.round(
              percentage
            )}%`
          );
        },
      }
    );

    setImage(blob.url);

    setMensaje(
      "Imagen subida correctamente ✅"
    );
  } catch (error) {
    console.error(
      "ERROR SUBIENDO IMAGEN:",
      error
    );

    setMensaje(
      error instanceof Error
        ? `No se pudo subir la imagen: ${error.message}`
        : "No se pudo subir la imagen"
    );
  } finally {
    setSubiendoImagen(false);
  }
};

  // =========================
  // LIMPIAR FORMULARIO
  // =========================

  const limpiarFormulario = () => {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory("");
    setImage("");
    setFeatured(false);
    setOffer(false);
    setEditandoId(null);
  };

  // =========================
  // EDITAR PRODUCTO
  // =========================

  const editarProducto = (producto: Producto) => {
    setEditandoId(producto.id);

    setName(producto.name);
    setDescription(producto.description || "");
    setPrice(producto.price.toLocaleString("es-CO"));
    setStock(String(producto.stock));
    setCategory(producto.category.name);
    setImage(producto.image || "");
    setFeatured(producto.featured);
    setOffer(producto.offer);

    setMensaje(`Editando: ${producto.name}`);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // CREAR / ACTUALIZAR
  // =========================

  const guardarProducto = async (e: FormEvent) => {
    e.preventDefault();

    setMensaje("");
    setCargando(true);

    try {
      const url = editandoId
        ? `/api/admin/productos/${editandoId}`
        : "/api/admin/productos";

      const metodo = editandoId ? "PUT" : "POST";

      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price: obtenerPrecioNumerico(price),
          stock: Number(stock),
          category,
          image,
          featured,
          offer,
        }),
      });

      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        setMensaje(
          datos.error || "No se pudo guardar el producto"
        );
        return;
      }

      setMensaje(
        editandoId
          ? "Producto actualizado correctamente ✅"
          : "Producto creado correctamente ✅"
      );

      limpiarFormulario();

      await cargarProductos();
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo guardar el producto");
    } finally {
      setCargando(false);
    }
  };

  // =========================
  // ELIMINAR PRODUCTO
  // =========================

  const eliminarProducto = async (
    id: number,
    nombre: string
  ) => {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar "${nombre}"?`
    );

    if (!confirmar) return;

    setMensaje("");
    setEliminandoId(id);

    try {
      const respuesta = await fetch(
        `/api/admin/productos/${id}`,
        {
          method: "DELETE",
        }
      );

      const datos = await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        setMensaje(
          datos.error ||
            "No se pudo eliminar el producto. Revisa la terminal."
        );
        return;
      }

      setMensaje("Producto eliminado correctamente ✅");

      setProductos((actuales) =>
        actuales.filter((producto) => producto.id !== id)
      );

      if (editandoId === id) {
        limpiarFormulario();
      }
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo eliminar el producto");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* CABECERA */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Productos
            </h1>

            <p className="mt-2 text-gray-400">
              Administra los productos de ZettaByte.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-xl border border-white/10 px-5 py-3 text-center transition hover:bg-white/5"
          >
            ← Volver al panel
          </a>
        </div>

        {/* MENSAJE */}

        {mensaje && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            {mensaje}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[420px_1fr]">
          {/* =====================================
              FORMULARIO
          ===================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">
                {editandoId
                  ? "Editar producto"
                  : "Agregar producto"}
              </h2>

              {editandoId && (
                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                  Modo edición
                </span>
              )}
            </div>

            <form
              onSubmit={guardarProducto}
              className="mt-6 space-y-4"
            >
              {/* NOMBRE */}

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Nombre
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 outline-none transition focus:border-cyan-400"
                  placeholder="Ej: Laptop Lenovo"
                />
              </div>

              {/* DESCRIPCIÓN */}

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Descripción
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 outline-none transition focus:border-cyan-400"
                  placeholder="Descripción del producto"
                />
              </div>

              {/* PRECIO Y STOCK */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Precio
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        formatearPrecio(e.target.value)
                      )
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 outline-none transition focus:border-cyan-400"
                    placeholder="1.400.000"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Stock
                  </label>

                  <input
                    type="number"
                    value={stock}
                    onChange={(e) =>
                      setStock(e.target.value)
                    }
                    min="0"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 outline-none transition focus:border-cyan-400"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* CATEGORÍA */}

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Categoría
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 outline-none transition focus:border-cyan-400"
                >
                  <option value="">
                    Selecciona una categoría
                  </option>

                  <option value="Computadores">
                    Computadores
                  </option>

                  <option value="Celulares">
                    Celulares
                  </option>

                  <option value="Audio">
                    Audio
                  </option>

                  <option value="Accesorios">
                    Accesorios
                  </option>

                  <option value="Monitores">
                    Monitores
                  </option>

                  <option value="Tablets">
                    Tablets
                  </option>

                  <option value="Impresoras">
                    Impresoras
                  </option>

                  <option value="Almacenamiento">
                    Almacenamiento
                  </option>

                  <option value="Redes">
                    Redes
                  </option>

                  <option value="Gaming">
                    Gaming
                  </option>
                </select>
              </div>

              {/* IMAGEN */}

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Imagen del producto
                </label>

               <input
  type="file"
  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
  onChange={async (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    await subirImagen(archivo);

    e.target.value = "";
  }}
  disabled={subiendoImagen}
  className="w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 text-sm text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
/>

{subiendoImagen && (
  <p className="mt-2 text-sm text-cyan-400">
    Subiendo imagen...
  </p>
)}

{image && (
  <div className="mt-4">
    <p className="mb-2 text-sm text-gray-400">
      Vista previa
    </p>

    <img
      src={image}
      alt="Vista previa del producto"
      className="h-48 w-full rounded-xl bg-white object-contain p-3"
    />
  </div>
)}
              </div>

              {/* DESTACADO */}

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) =>
                    setFeatured(e.target.checked)
                  }
                  className="h-4 w-4"
                />

                <span>Producto destacado</span>
              </label>

              {/* OFERTA */}

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={offer}
                  onChange={(e) =>
                    setOffer(e.target.checked)
                  }
                  className="h-4 w-4"
                />

                <span>Producto en oferta</span>
              </label>

              {/* BOTÓN PRINCIPAL */}

              <button
                type="submit"
                disabled={
                  cargando || subiendoImagen
                }
                className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cargando
                  ? "Guardando..."
                  : subiendoImagen
                    ? "Subiendo imagen..."
                    : editandoId
                      ? "Actualizar producto"
                      : "Guardar producto"}
              </button>

              {/* CANCELAR EDICIÓN */}

              {editandoId && (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario();
                    setMensaje("Edición cancelada");
                  }}
                  className="w-full rounded-xl border border-white/10 px-5 py-3 font-semibold transition hover:bg-white/5"
                >
                  Cancelar edición
                </button>
              )}
            </form>
          </section>

          {/* =====================================
              PRODUCTOS REGISTRADOS
          ===================================== */}

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">
                Productos registrados
              </h2>

              <span className="text-sm text-gray-400">
                {productos.length}{" "}
                {productos.length === 1
                  ? "producto"
                  : "productos"}
              </span>
            </div>

            {productos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
                Todavía no hay productos registrados.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {productos.map((producto) => (
                  <article
                    key={producto.id}
                    className={`rounded-2xl border p-5 transition ${
                      editandoId === producto.id
                        ? "border-cyan-400/70 bg-cyan-400/5"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      {/* IZQUIERDA */}

                      <div className="flex items-center gap-4">
                        {producto.image ? (
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                            <img
                              src={producto.image}
                              alt={producto.name}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 text-xs text-gray-500">
                            Sin imagen
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-cyan-400">
                            {producto.category.name}
                          </p>

                          <h3 className="mt-1 text-xl font-bold">
                            {producto.name}
                          </h3>

                          <p className="mt-2 text-gray-400">
                            Stock: {producto.stock}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {producto.featured && (
                              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">
                                Destacado
                              </span>
                            )}

                            {producto.offer && (
                              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-400">
                                Oferta
                              </span>
                            )}

                            {editandoId === producto.id && (
                              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                                Editando
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* DERECHA */}

                      <div className="flex flex-col gap-4 sm:items-end">
                        <div className="sm:text-right">
                          <p className="text-xl font-bold">
                            $
                            {producto.price.toLocaleString(
                              "es-CO"
                            )}
                          </p>

                          {producto.stock === 0 && (
                            <p className="mt-1 text-sm font-medium text-red-400">
                              Agotado
                            </p>
                          )}

                          {producto.stock > 0 &&
                            producto.stock <= 5 && (
                              <p className="mt-1 text-sm font-medium text-yellow-400">
                                Poco stock
                              </p>
                            )}

                          {producto.stock > 5 && (
                            <p className="mt-1 text-sm font-medium text-green-400">
                              Disponible
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          {/* EDITAR */}

                          <button
                            type="button"
                            onClick={() =>
                              editarProducto(producto)
                            }
                            className="rounded-xl border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500 hover:text-black"
                          >
                            Editar producto
                          </button>

                          {/* ELIMINAR */}

                          <button
                            type="button"
                            disabled={
                              eliminandoId === producto.id
                            }
                            onClick={() =>
                              eliminarProducto(
                                producto.id,
                                producto.name
                              )
                            }
                            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {eliminandoId === producto.id
                              ? "Eliminando..."
                              : "Eliminar producto"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Producto = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;

  images: {
    id: number;
    url: string;
    position: number;
  }[];

  stock: number;
  featured: boolean;
  offer: boolean;
  active?: boolean;

  category: {
    id: number;
    name: string;
  };
};
type ItemCarrito = {
  producto: Producto;
  cantidad: number;
};

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [cargandoProductos, setCargandoProductos] =
    useState(true);

  const [errorProductos, setErrorProductos] =
    useState("");

  const [nombreCliente, setNombreCliente] =
    useState("");

  const [telefonoCliente, setTelefonoCliente] =
    useState("");

  const [busqueda, setBusqueda] = useState("");

  const [paginaProductos, setPaginaProductos] =
    useState(1);

    const productosPorPagina = 12;

  const [paginaOfertas, setPaginaOfertas] = useState(1);
  const ofertasPorPagina = 5;


  const [imagenesSeleccionadas, setImagenesSeleccionadas] =
    useState<Record<number, string>>({});

  // =========================================
  // CARGAR PRODUCTOS
  // =========================================

  const cargarProductos = async () => {
    try {
      setCargandoProductos(true);
      setErrorProductos("");

      const respuesta = await fetch("/api/productos", {
        cache: "no-store",
      });

      if (!respuesta.ok) {
        throw new Error(
          "No se pudieron cargar los productos"
        );
      }

      const datos = await respuesta.json();

      setProductos(datos);
    } catch (error) {
      console.error(error);

      setErrorProductos(
        "No se pudieron cargar los productos. Intenta nuevamente."
      );
    } finally {
      setCargandoProductos(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // =========================================
  // AGREGAR AL CARRITO
  // =========================================

  const agregarAlCarrito = (
    producto: Producto
  ) => {
    if (producto.stock <= 0) {
      alert("Este producto está agotado");
      return;
    }

    setCarrito((actual) => {
      const existente = actual.find(
        (item) =>
          item.producto.id === producto.id
      );

      if (existente) {
        if (
          existente.cantidad >= producto.stock
        ) {
          alert(
            `Solo hay ${producto.stock} unidades disponibles de ${producto.name}`
          );

          return actual;
        }

        return actual.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad:
                  item.cantidad + 1,
              }
            : item
        );
      }

      return [
        ...actual,
        {
          producto,
          cantidad: 1,
        },
      ];
    });

    setTimeout(() => {
      const carritoSeccion =
        document.getElementById("carrito");

      carritoSeccion?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // =========================================
  // AUMENTAR CANTIDAD
  // =========================================

  const aumentarCantidad = (id: number) => {
    setCarrito((actual) =>
      actual.map((item) => {
        if (item.producto.id !== id) {
          return item;
        }

        if (
          item.cantidad >= item.producto.stock
        ) {
          alert(
            `Solo hay ${item.producto.stock} unidades disponibles`
          );

          return item;
        }

        return {
          ...item,
          cantidad: item.cantidad + 1,
        };
      })
    );
  };

  // =========================================
  // DISMINUIR CANTIDAD
  // =========================================

  const disminuirCantidad = (id: number) => {
    setCarrito((actual) =>
      actual
        .map((item) =>
          item.producto.id === id
            ? {
                ...item,
                cantidad:
                  item.cantidad - 1,
              }
            : item
        )
        .filter(
          (item) => item.cantidad > 0
        )
    );
  };

  // =========================================
  // ELIMINAR DEL CARRITO
  // =========================================

  const eliminarDelCarrito = (
    id: number
  ) => {
    setCarrito((actual) =>
      actual.filter(
        (item) =>
          item.producto.id !== id
      )
    );
  };

  // =========================================
  // VACIAR CARRITO
  // =========================================

  const vaciarCarrito = () => {
    const confirmar = window.confirm(
      "¿Seguro que quieres vaciar el carrito?"
    );

    if (!confirmar) return;

    setCarrito([]);
  };

  // =========================================
  // CANTIDAD TOTAL
  // =========================================

  const cantidadCarrito = carrito.reduce(
    (total, item) =>
      total + item.cantidad,
    0
  );

  // =========================================
  // TOTAL DEL PEDIDO
  // =========================================

  const total = carrito.reduce(
    (acumulado, item) =>
      acumulado +
      item.producto.price *
        item.cantidad,
    0
  );

  // =========================================
  // WHATSAPP
  // =========================================

  const enviarWhatsApp = async () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (!nombreCliente.trim()) {
      alert(
        "Por favor ingresa tu nombre"
      );
      return;
    }

    if (!telefonoCliente.trim()) {
      alert(
        "Por favor ingresa tu teléfono"
      );
      return;
    }

    try {
      const respuesta = await fetch(
        "/api/pedidos",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            customerName:
              nombreCliente.trim(),

            customerPhone:
              telefonoCliente.trim(),

            items: carrito.map(
              (item) => ({
                productId:
                  item.producto.id,

                quantity:
                  item.cantidad,
              })
            ),
          }),
        }
      );

      const texto =
        await respuesta.text();

      let datos;

      try {
        datos = JSON.parse(texto);
      } catch {
        console.error(
          "Respuesta no válida:",
          texto
        );

        alert(
          "El servidor devolvió una respuesta no válida."
        );

        return;
      }

      if (!respuesta.ok) {
        alert(
          datos.error ||
            "No se pudo crear el pedido"
        );

        return;
      }

      const pedidoId =
        datos.pedido.id;

      const productosTexto = carrito
        .map((item, index) => {
          const subtotal =
            item.producto.price *
            item.cantidad;

          return (
            `${index + 1}. ${item.producto.name}\n` +
            `Cantidad: ${item.cantidad}\n` +
            `Precio unitario: $${item.producto.price.toLocaleString(
              "es-CO"
            )}\n` +
            `Subtotal: $${subtotal.toLocaleString(
              "es-CO"
            )}`
          );
        })
        .join("\n\n");

      const mensaje =
        `Hola ZettaByte 👋\n\n` +
        `Pedido #${pedidoId}\n\n` +
        `Cliente: ${nombreCliente.trim()}\n` +
        `Teléfono: ${telefonoCliente.trim()}\n\n` +
        `Quiero realizar este pedido:\n\n` +
        `${productosTexto}\n\n` +
        `TOTAL: $${total.toLocaleString(
          "es-CO"
        )}\n\n` +
        `¿Me pueden confirmar disponibilidad?`;

     const numero = "573172934618";

const urlWhatsApp =
  `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

window.location.href = urlWhatsApp;
    } catch (error) {
      console.error(error);

      alert(
        "No se pudo registrar el pedido. Intenta nuevamente."
      );
    }
  };

  // =========================================
  // CATEGORÍAS
  // =========================================

  const categorias = Array.from(
    new Set(
      productos
        .map(
          (producto) =>
            producto.category?.name
        )
        .filter(Boolean)
    )
  );

  // =========================================
  // OFERTAS
  // =========================================

  const productosOferta =
    productos.filter(
      (producto) => producto.offer
    );

  const totalPaginasOfertas = Math.max(
    1,
    Math.ceil(productosOferta.length / ofertasPorPagina)
  );

  const paginaActualOfertas = Math.min(
    paginaOfertas,
    totalPaginasOfertas
  );

  const indiceInicialOfertas =
    (paginaActualOfertas - 1) * ofertasPorPagina;

  const productosOfertaPaginados = productosOferta.slice(
    indiceInicialOfertas,
    indiceInicialOfertas + ofertasPorPagina
  );

  const cambiarPaginaOfertas = (pagina: number) => {
    setPaginaOfertas(pagina);
    setTimeout(() => {
      document.getElementById("ofertas")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  // =========================================
  // BUSCADOR
  // =========================================

  const normalizarTexto = (
    texto: string
  ) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .trim();
  };

  const productosFiltrados =
    productos.filter((producto) => {
      const textoBusqueda =
        normalizarTexto(busqueda);

      if (!textoBusqueda) {
        return true;
      }

      const nombre =
        normalizarTexto(
          producto.name
        );

      const descripcion =
        normalizarTexto(
          producto.description ?? ""
        );

      const categoria =
        normalizarTexto(
          producto.category?.name ?? ""
        );

      return (
        nombre.includes(
          textoBusqueda
        ) ||
        descripcion.includes(
          textoBusqueda
        ) ||
        categoria.includes(
          textoBusqueda
        )
      );
    });

  // =========================================
  // PAGINACIÓN DE PRODUCTOS
  // =========================================

  const totalPaginasProductos = Math.max(1, Math.ceil(productosFiltrados.length / productosPorPagina));
  const paginaActualProductos = Math.min(paginaProductos, totalPaginasProductos);
  const indiceInicial = (paginaActualProductos - 1) * productosPorPagina;
  const indiceFinal = indiceInicial + productosPorPagina;
  const productosPaginados = productosFiltrados.slice(indiceInicial, indiceFinal);

  const cambiarPaginaProductos = (pagina: number) => {
    setPaginaProductos(pagina);
    setTimeout(() => {
      document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#070b14] text-white">
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
                <a
                href="#"
                className="flex flex-shrink-0 items-center"
                  >
                <Image
                src="/Zettabyte_1.jpeg"
                alt="ZettaByte"
                width={260}
                height={90}
                priority
                className="h-auto w-[150px] object-contain sm:w-[190px]"
                />
                </a>               

          <nav className="hidden items-center gap-6 md:flex lg:gap-8">
            <a
              href="#"
              className="transition hover:text-cyan-400"
            >
              Inicio
            </a>

            <a
              href="#productos"
              className="transition hover:text-cyan-400"
            >
              Productos
            </a>

            <a
              href="#categorias"
              className="transition hover:text-cyan-400"
            >
              Categorías
            </a>

            <a
              href="#ofertas"
              className="transition hover:text-cyan-400"
            >
              Ofertas
            </a>
          </nav>

          <div className="flex flex-shrink-0 items-center gap-2">
            <a
              href="#carrito"
              className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-cyan-400 sm:px-5 sm:text-base"
            >
              Carrito ({cantidadCarrito})
            </a>

            <button
              type="button"
              onClick={() =>
                setMenuAbierto(
                  !menuAbierto
                )
              }
              className="rounded-xl border border-white/10 px-3 py-2 md:hidden"
              aria-label="Abrir menú"
            >
              ☰
            </button>
          </div>
        </div>

        {menuAbierto && (
          <nav className="flex flex-col border-t border-white/10 bg-[#0a0f1c] px-4 py-4 md:hidden">
            <a
              href="#"
              onClick={() =>
                setMenuAbierto(false)
              }
              className="px-3 py-3"
            >
              Inicio
            </a>

            <a
              href="#productos"
              onClick={() =>
                setMenuAbierto(false)
              }
              className="px-3 py-3"
            >
              Productos
            </a>

            <a
              href="#categorias"
              onClick={() =>
                setMenuAbierto(false)
              }
              className="px-3 py-3"
            >
              Categorías
            </a>

            <a
              href="#ofertas"
              onClick={() =>
                setMenuAbierto(false)
              }
              className="px-3 py-3"
            >
              Ofertas
            </a>
          </nav>
        )}
      </header>

      {/* ========================================= */}
      {/* PORTADA */}
      {/* ========================================= */}

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 md:min-h-[75vh] md:grid-cols-2 lg:px-8">
        <div className="min-w-0">
          <p className="mb-4 text-sm text-cyan-400 sm:text-base">
            Tecnología en Jamundí,
            Valle del Cauca
          </p>

          <h1 className="break-words text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Lleva tu tecnología

            <span className="block text-cyan-400">
              al siguiente nivel
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-gray-400 sm:text-lg">
            Encuentra computadores,
            celulares, accesorios,
            audio y mucho más en
            ZettaByte.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="#productos"
              className="rounded-xl bg-cyan-500 px-7 py-3 text-center font-bold text-black transition hover:bg-cyan-400"
            >
              Ver productos
            </a>

            <a
              href="#ofertas"
              className="rounded-xl border border-white/20 px-7 py-3 text-center font-semibold transition hover:bg-white/5"
            >
              Ver ofertas
            </a>
          </div>
        </div>

        <div className="flex min-w-0 justify-center">
<div className="w-full max-w-xl overflow-hidden rounded-3xl p-4 sm:p-6">
    <Image
      src="/Zettabyte_1.jpeg"
      alt="ZettaByte - Venta de partes para computadores y celulares"
      width={1600}
      height={570}
      priority
      className="h-auto w-full object-contain"
    />
  </div>
</div>
      </section>

      {/* ========================================= */}
      {/* CATEGORÍAS */}
      {/* ========================================= */}

      <section
        id="categorias"
        className="border-t border-white/10 bg-[#0a0f1c] py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-cyan-400">
            Explora ZettaByte
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Categorías
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categorias.map(
              (categoria) => (
                <div
                  key={categoria}
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <p className="text-3xl">
                    ⚡
                  </p>

                  <h3 className="mt-4 break-words text-xl font-bold">
                    {categoria}
                  </h3>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* PRODUCTOS */}
      {/* ========================================= */}

      <section
        id="productos"
        className="border-t border-white/10 py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-3">
            <p className="text-cyan-400">
              Lo mejor de ZettaByte
            </p>

            <h2 className="break-words text-3xl font-bold sm:text-4xl">
              Nuestros productos
            </h2>

            <p className="max-w-2xl break-words text-gray-400">
              Busca computadores,
              portátiles, mouse,
              impresoras, celulares,
              accesorios y mucho más.
            </p>
          </div>

          {/* BUSCADOR */}

          <div className="mt-8 w-full max-w-3xl">
            <div className="relative w-full">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaProductos(1);
                }}
                placeholder="Buscar portátil, mouse, computador..."
                className="w-full min-w-0 rounded-2xl border border-white/10 bg-white/5 py-4 pl-14 pr-14 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-400 focus:bg-white/[0.07] sm:px-5 sm:pl-14 sm:pr-14 sm:text-base"
              />

              <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-cyan-400"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />

                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>

              {busqueda && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");
                    setPaginaProductos(1);
                  }}
                  className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {busqueda.trim() && (
              <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                <p className="break-words text-sm text-gray-400">
                  Resultados para{" "}
                  <span className="font-semibold text-cyan-400">
                    &quot;
                    {busqueda}
                    &quot;
                  </span>
                </p>

                <p className="text-sm text-gray-500">
                  {
                    productosFiltrados.length
                  }{" "}
                  {productosFiltrados.length ===
                  1
                    ? "producto encontrado"
                    : "productos encontrados"}
                </p>
              </div>
            )}
          </div>

          {/* CARGANDO */}

          {cargandoProductos && (
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-gray-400">
                Cargando productos...
              </p>
            </div>
          )}

          {/* ERROR */}

          {errorProductos && (
            <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <p className="text-red-400">
                {errorProductos}
              </p>
            </div>
          )}

          {/* SIN PRODUCTOS */}

          {!cargandoProductos &&
            !errorProductos &&
            productos.length ===
              0 && (
              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:p-10">
                <div className="text-5xl">
                  📦
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  No hay productos
                  disponibles
                </h3>

                <p className="mt-2 text-gray-400">
                  Próximamente tendremos
                  nuevos productos.
                </p>
              </div>
            )}

          {/* SIN RESULTADOS */}

          {!cargandoProductos &&
            !errorProductos &&
            productos.length > 0 &&
            productosFiltrados.length ===
              0 && (
              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:p-10">
                <div className="text-5xl">
                  🔎
                </div>

                <h3 className="mt-4 text-xl font-bold">
                  No encontramos ese
                  producto
                </h3>

                <p className="mx-auto mt-2 max-w-lg break-words text-gray-400">
                  No encontramos
                  resultados para{" "}
                  <span className="font-semibold text-white">
                    &quot;
                    {busqueda}
                    &quot;
                  </span>
                  . Intenta buscar con
                  otra palabra.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");
                    setPaginaProductos(1);
                  }}
                  className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-black transition hover:bg-cyan-400"
                >
                  Ver todos los productos
                </button>
              </div>
            )}

          {/* ========================================= */}
          {/* TARJETAS PRODUCTOS */}
          {/* ========================================= */}

          {!cargandoProductos &&
            !errorProductos &&
            productosFiltrados.length >
              0 && (
              <div className="mt-10 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {productosPaginados.map(
                  (producto) => (
                    <article
                      key={producto.id}
                      className="flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-cyan-400/30 sm:p-5"
                    >
                    {/* IMÁGENES DEL PRODUCTO */}

<div className="w-full">
  <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden rounded-xl bg-white">
    {(() => {
      const imagenPrincipal =
        imagenesSeleccionadas[producto.id] ||
        producto.images?.[0]?.url ||
        producto.image;

      return imagenPrincipal ? (
        <Image
          src={imagenPrincipal}
          alt={producto.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-contain p-3"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-500">
          Sin imagen
        </div>
      );
    })()}

    {producto.offer && (
      <span className="absolute left-3 top-3 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white">
        Oferta
      </span>
    )}

    {producto.stock === 0 && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <span className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white">
          Agotado
        </span>
      </div>
    )}
  </div>

  {producto.images && producto.images.length > 1 && (
    <div className="mt-3 flex flex-wrap gap-2">
      {producto.images.map((imagen, indice) => {
        const imagenActual =
          imagenesSeleccionadas[producto.id] ||
          producto.images[0]?.url ||
          producto.image;

        const seleccionada =
          imagenActual === imagen.url;

        return (
          <button
            key={imagen.id}
            type="button"
            onClick={() =>
              setImagenesSeleccionadas((actual) => ({
                ...actual,
                [producto.id]: imagen.url,
              }))
            }
            className={`relative h-16 w-16 overflow-hidden rounded-lg border bg-white transition ${
              seleccionada
                ? "border-cyan-400 ring-2 ring-cyan-400/30"
                : "border-white/10 hover:border-cyan-400/50"
            }`}
            aria-label={`Ver imagen ${indice + 1} de ${producto.name}`}
          >
            <Image
              src={imagen.url}
              alt={`${producto.name} - imagen ${indice + 1}`}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          </button>
        );
      })}
    </div>
  )}
</div>

                      {/* INFORMACIÓN */}

                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="mt-4 break-words text-sm text-cyan-400">
                          {
                            producto
                              .category
                              .name
                          }
                        </p>

                        <h3
                          className="mt-1 break-words text-xl font-bold"
                          style={{
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {producto.name}
                        </h3>

                        {producto.description && (
                          <p
                            className="mt-2 overflow-hidden text-sm leading-6 text-gray-400"
                            style={{
                              overflowWrap:
                                "anywhere",

                              wordBreak:
                                "break-word",

                              display:
                                "-webkit-box",

                              WebkitLineClamp: 4,

                              WebkitBoxOrient:
                                "vertical",
                            }}
                          >
                            {
                              producto.description
                            }
                          </p>
                        )}

                        <p className="mt-4 break-words text-2xl font-bold">
                          $
                          {producto.price.toLocaleString(
                            "es-CO"
                          )}
                        </p>

                        {producto.stock ===
                        0 ? (
                          <p className="mt-2 text-sm font-semibold text-red-400">
                            Agotado
                          </p>
                        ) : producto.stock <=
                          5 ? (
                          <p className="mt-2 text-sm font-semibold text-yellow-400">
                            Últimas{" "}
                            {
                              producto.stock
                            }{" "}
                            unidades
                          </p>
                        ) : (
                          <p className="mt-2 text-sm font-semibold text-green-400">
                            Disponible
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            agregarAlCarrito(
                              producto
                            )
                          }
                          disabled={
                            producto.stock ===
                            0
                          }
                          className="mt-auto w-full pt-5"
                        >
                          <span
                            className={`block w-full rounded-xl px-4 py-3 text-center font-bold transition ${
                              producto.stock ===
                              0
                                ? "cursor-not-allowed bg-gray-700 text-gray-400"
                                : "bg-cyan-500 text-black hover:bg-cyan-400"
                            }`}
                          >
                            {producto.stock ===
                            0
                              ? "Agotado"
                              : "Agregar al carrito"}
                          </span>
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}

          {!cargandoProductos && !errorProductos && productosFiltrados.length > 0 && totalPaginasProductos > 1 && (
            <div className="mt-10">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => cambiarPaginaProductos(paginaActualProductos - 1)} disabled={paginaActualProductos === 1} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">← Anterior</button>
                {Array.from({ length: totalPaginasProductos }, (_, index) => index + 1).map((numeroPagina) => (
                  <button key={numeroPagina} type="button" onClick={() => cambiarPaginaProductos(numeroPagina)} className={`rounded-lg border px-4 py-2 font-semibold transition ${numeroPagina === paginaActualProductos ? "border-cyan-500 bg-cyan-500 text-black" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`}>{numeroPagina}</button>
                ))}
                <button type="button" onClick={() => cambiarPaginaProductos(paginaActualProductos + 1)} disabled={paginaActualProductos === totalPaginasProductos} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Siguiente →</button>
              </div>
              <p className="mt-4 text-center text-sm text-gray-500">Página {paginaActualProductos} de {totalPaginasProductos}</p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================= */}
      {/* OFERTAS */}
      {/* ========================================= */}

      <section
        id="ofertas"
        className="border-t border-white/10 bg-[#0a0f1c] py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="break-words text-3xl font-bold">
            Productos en oferta
          </h2>

          {productosOferta.length ===
          0 ? (
            <p className="mt-6 text-gray-400">
              No tenemos ofertas en este
              momento.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productosOfertaPaginados.map(
                (producto) => (
                  <div
                    key={producto.id}
                    className="min-w-0 overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5"
                  >
                    <p className="text-purple-400">
                      Oferta
                    </p>

                    <h3
                      className="mt-1 break-words font-bold"
                      style={{
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {producto.name}
                    </h3>

                    <p className="mt-2 break-words font-bold">
                      $
                      {producto.price.toLocaleString(
                        "es-CO"
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {productosOferta.length > 0 && totalPaginasOfertas > 1 && (
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => cambiarPaginaOfertas(paginaActualOfertas - 1)} disabled={paginaActualOfertas === 1} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">← Anterior</button>
                {Array.from({ length: totalPaginasOfertas }, (_, index) => index + 1).map((numeroPagina) => (
                  <button key={numeroPagina} type="button" onClick={() => cambiarPaginaOfertas(numeroPagina)} className={`rounded-lg border px-4 py-2 font-semibold transition ${numeroPagina === paginaActualOfertas ? "border-purple-400 bg-purple-500 text-white" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`}>{numeroPagina}</button>
                ))}
                <button type="button" onClick={() => cambiarPaginaOfertas(paginaActualOfertas + 1)} disabled={paginaActualOfertas === totalPaginasOfertas} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Siguiente →</button>
              </div>
              <p className="mt-4 text-center text-sm text-gray-500">Página {paginaActualOfertas} de {totalPaginasOfertas}</p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================= */}
      {/* CARRITO */}
      {/* ========================================= */}

      <section
        id="carrito"
        className="border-t border-white/10 py-16"
      >
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <p className="text-cyan-400">
            Tu compra
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Carrito
          </h2>

          {carrito.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center sm:p-10">
              <p className="text-gray-400">
                Todavía no has agregado
                productos.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 space-y-4">
                {carrito.map(
                  (item) => (
                    <div
                      key={
                        item.producto.id
                      }
                      className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          {item.producto
                            .image && (
                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                              <Image
                                src={
                                  item
                                    .producto
                                    .image
                                }
                                alt={
                                  item
                                    .producto
                                    .name
                                }
                                fill
                                sizes="80px"
                                className="object-contain p-2"
                              />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3
                              className="break-words font-bold"
                              style={{
                                overflowWrap:
                                  "anywhere",
                              }}
                            >
                              {
                                item
                                  .producto
                                  .name
                              }
                            </h3>

                            <p className="text-sm text-gray-400">
                              $
                              {item.producto.price.toLocaleString(
                                "es-CO"
                              )}{" "}
                              cada uno
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Stock
                              disponible:{" "}
                              {
                                item
                                  .producto
                                  .stock
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 xs:flex-row sm:flex-row sm:items-center">
                          <div className="flex w-full items-center justify-between rounded-xl border border-white/10 sm:w-auto">
                            <button
                              type="button"
                              onClick={() =>
                                disminuirCantidad(
                                  item
                                    .producto
                                    .id
                                )
                              }
                              className="px-4 py-2 text-xl hover:bg-white/10"
                            >
                              −
                            </button>

                            <span className="min-w-10 text-center font-bold">
                              {
                                item.cantidad
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                aumentarCantidad(
                                  item
                                    .producto
                                    .id
                                )
                              }
                              disabled={
                                item.cantidad >=
                                item
                                  .producto
                                  .stock
                              }
                              className="px-4 py-2 text-xl hover:bg-white/10 disabled:cursor-not-allowed disabled:text-gray-600"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              eliminarDelCarrito(
                                item
                                  .producto
                                  .id
                              )
                            }
                            className="w-full rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500 hover:text-white sm:w-auto"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-4 text-right">
                        <span className="text-gray-400">
                          Subtotal:
                        </span>{" "}

                        <span className="text-lg font-bold">
                          $
                          {(
                            item.producto
                              .price *
                            item.cantidad
                          ).toLocaleString(
                            "es-CO"
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* TOTAL */}

              <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xl font-bold">
                  Total
                </p>

                <p className="break-words text-3xl font-bold text-cyan-400">
                  $
                  {total.toLocaleString(
                    "es-CO"
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={vaciarCarrito}
                className="mt-6 w-full rounded-xl border border-red-500/40 px-6 py-3 font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
              >
                Vaciar carrito
              </button>

              {/* DATOS CLIENTE */}

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
                <h3 className="text-xl font-bold">
                  Datos del cliente
                </h3>

                <p className="mt-2 text-sm text-gray-400">
                  Estos datos se
                  guardarán con el
                  pedido.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label className="mb-2 block text-sm text-gray-400">
                      Nombre
                    </label>

                    <input
                      type="text"
                      value={
                        nombreCliente
                      }
                      onChange={(e) =>
                        setNombreCliente(
                          e.target.value
                        )
                      }
                      placeholder="Tu nombre"
                      className="w-full min-w-0 rounded-xl border border-white/10 bg-[#070b14] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="mb-2 block text-sm text-gray-400">
                      Teléfono
                    </label>

                    <input
                      type="tel"
                      value={
                        telefonoCliente
                      }
                      onChange={(e) =>
                        setTelefonoCliente(
                          e.target.value
                        )
                      }
                      placeholder="Ej: 3001234567"
                      inputMode="tel"
                      className="w-full min-w-0 rounded-xl border border-white/10 bg-[#070b14] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  enviarWhatsApp
                }
                className="mt-4 w-full rounded-xl bg-green-500 px-5 py-4 text-base font-bold text-white transition hover:bg-green-400 sm:px-6 sm:text-lg"
              >
                Finalizar pedido por
                WhatsApp
              </button>
            </>
          )}
        </div>
      </section>

      {/* ========================================= */}
      {/* FOOTER */}
      {/* ========================================= */}

      <footer className="border-t border-white/10 bg-[#0a0f1c] px-4 py-10 text-center">
        <h2 className="text-2xl font-bold">
          Zetta
          <span className="text-cyan-400">
            Byte
          </span>
        </h2>

        <p className="mt-3 text-gray-400">
          Tecnología en Jamundí, Valle
          del Cauca
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Sector Belalcázar
        </p>
      </footer>
    </main>
  );
}
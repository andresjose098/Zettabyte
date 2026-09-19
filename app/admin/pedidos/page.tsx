import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    page?: string;
    buscar?: string;
  }>;
};

function formatearEstado(estado: string) {
  switch (estado) {
    case "PENDING":
      return "Pendiente";
    case "CONFIRMED":
      return "Confirmado";
    case "DELIVERED":
      return "Entregado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return estado;
  }
}

function claseEstado(estado: string) {
  switch (estado) {
    case "PENDING":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    case "CONFIRMED":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    case "DELIVERED":
      return "bg-green-500/10 text-green-400 border-green-500/30";
    case "CANCELLED":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    default:
      return "bg-white/5 text-gray-400 border-white/10";
  }
}

function formatearFechaColombia(fecha: Date) {
  return fecha.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default async function PedidosPage({
  searchParams,
}: Props) {
  const admin = await verificarAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  // ============================
  // BÚSQUEDA
  // ============================

  const buscar = (params.buscar ?? "").trim();

  const filtro = buscar
    ? {
        OR: [
          {
            customerName: {
              contains: buscar,
            },
          },
          {
            customerPhone: {
              contains: buscar,
            },
          },
        ],
      }
    : {};

  // ============================
  // PAGINACIÓN
  // ============================

  const paginaSolicitada = Number(params.page ?? "1");

  const pagina =
    Number.isInteger(paginaSolicitada) &&
    paginaSolicitada > 0
      ? paginaSolicitada
      : 1;

  const pedidosPorPagina = 10;

  const totalPedidos = await prisma.order.count({
    where: filtro,
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalPedidos / pedidosPorPagina)
  );

  const paginaActual = Math.min(
    pagina,
    totalPaginas
  );

  // ============================
  // CONSULTAR PEDIDOS
  // ============================

  const pedidos = await prisma.order.findMany({
    where: filtro,

    include: {
      items: {
        include: {
          product: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    skip:
      (paginaActual - 1) *
      pedidosPorPagina,

    take: pedidosPorPagina,
  });

  // ============================
  // PÁGINAS VISIBLES
  // ============================

  const maxPaginasVisibles = 7;

  let paginaInicial = Math.max(
    1,
    paginaActual -
      Math.floor(maxPaginasVisibles / 2)
  );

  let paginaFinal = Math.min(
    totalPaginas,
    paginaInicial + maxPaginasVisibles - 1
  );

  if (
    paginaFinal - paginaInicial + 1 <
    maxPaginasVisibles
  ) {
    paginaInicial = Math.max(
      1,
      paginaFinal - maxPaginasVisibles + 1
    );
  }

  const paginasVisibles = Array.from(
    {
      length:
        paginaFinal - paginaInicial + 1,
    },
    (_, index) => paginaInicial + index
  );

  // Conserva la búsqueda al cambiar de página
  function urlPagina(numeroPagina: number) {
    const query = new URLSearchParams();

    query.set(
      "page",
      numeroPagina.toString()
    );

    if (buscar) {
      query.set("buscar", buscar);
    }

    return `/admin/pedidos?${query.toString()}`;
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* CABECERA */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full">

            <h1 className="text-3xl font-bold">
              Pedidos
            </h1>

            <p className="mt-2 text-gray-400">
              Administra las ventas de ZettaByte.
            </p>

            {/* BUSCADOR */}

            <form
              action="/admin/pedidos"
              method="GET"
              className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                name="buscar"
                defaultValue={buscar}
                placeholder="Buscar por nombre o número de celular..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-cyan-500"
              />

              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-black transition hover:bg-cyan-400"
              >
                Buscar
              </button>

              {buscar && (
                <a
                  href="/admin/pedidos"
                  className="rounded-xl border border-white/10 px-6 py-3 text-center font-semibold transition hover:bg-white/5"
                >
                  Limpiar
                </a>
              )}
            </form>

            {/* RESULTADO DE BÚSQUEDA */}

            {buscar && (
              <p className="mt-4 text-sm text-gray-400">
                {totalPedidos === 0
                  ? `No se encontraron pedidos para "${buscar}".`
                  : `${totalPedidos} ${
                      totalPedidos === 1
                        ? "pedido encontrado"
                        : "pedidos encontrados"
                    } para "${buscar}".`}
              </p>
            )}

          </div>

          <a
            href="/admin"
            className="shrink-0 rounded-xl border border-white/10 px-5 py-3 text-center font-semibold transition hover:bg-white/5"
          >
            ← Volver al panel
          </a>
        </div>

        {/* SIN RESULTADOS */}

        {pedidos.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">

            <p className="text-gray-400">
              {buscar
                ? "No encontramos pedidos con ese nombre o número de celular."
                : "Todavía no hay pedidos registrados."}
            </p>

            {buscar && (
              <a
                href="/admin/pedidos"
                className="mt-5 inline-block rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black transition hover:bg-cyan-400"
              >
                Ver todos los pedidos
              </a>
            )}

          </div>
        ) : (
          <>

            {/* LISTA DE PEDIDOS */}

            <div className="mt-10 space-y-6">

              {pedidos.map((pedido) => (
                <article
                  key={pedido.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6"
                >

                  {/* DATOS PRINCIPALES */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                      <p className="text-sm text-gray-400">
                        Pedido
                      </p>

                      <h2 className="text-2xl font-bold">
                        #{pedido.id}
                      </h2>

                      <p className="mt-2 text-sm text-gray-400">
                        {formatearFechaColombia(
                          pedido.createdAt
                        )}
                      </p>

                      {/* CLIENTE */}

                      <div className="mt-4 space-y-1">

                        <p className="text-sm text-gray-400">
                          Cliente:{" "}
                          <span className="font-semibold text-white">
                            {pedido.customerName ||
                              "Sin nombre"}
                          </span>
                        </p>

                        <p className="text-sm text-gray-400">
                          Celular:{" "}
                          <span className="font-semibold text-white">
                            {pedido.customerPhone ||
                              "Sin número"}
                          </span>
                        </p>

                      </div>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-4 py-2 text-sm font-bold ${claseEstado(
                        pedido.status
                      )}`}
                    >
                      {formatearEstado(
                        pedido.status
                      )}
                    </span>

                  </div>

                  {/* PRODUCTOS */}

                  <div className="mt-6 space-y-4">

                    {pedido.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div>
                          <h3 className="font-semibold">
                            {item.product.name}
                          </h3>

                          <p className="text-sm text-gray-400">
                            Cantidad:{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <div className="sm:text-right">

                          <p className="text-sm text-gray-400">
                            $
                            {item.price.toLocaleString(
                              "es-CO"
                            )}{" "}
                            c/u
                          </p>

                          <p className="font-bold">
                            $
                            {(
                              item.price *
                              item.quantity
                            ).toLocaleString(
                              "es-CO"
                            )}
                          </p>

                        </div>

                      </div>
                    ))}

                  </div>

                  {/* TOTAL */}

                  <div className="mt-6 flex items-center justify-between">

                    <p className="text-gray-400">
                      Total
                    </p>

                    <p className="text-2xl font-bold text-cyan-400">
                      $
                      {pedido.total.toLocaleString(
                        "es-CO"
                      )}
                    </p>

                  </div>

                  {/* VER PEDIDO */}

                  <div className="mt-6">

                    <a
                      href={`/admin/pedidos/${pedido.id}`}
                      className="inline-block rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black transition hover:bg-cyan-400"
                    >
                      Ver pedido
                    </a>

                  </div>

                </article>
              ))}

            </div>

            {/* PAGINACIÓN */}

            {totalPaginas > 1 && (
              <div className="mt-10">

                <div className="flex flex-wrap items-center justify-center gap-2">

                  {/* ANTERIOR */}

                  {paginaActual > 1 && (
                    <a
                      href={urlPagina(
                        paginaActual - 1
                      )}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
                    >
                      ← Anterior
                    </a>
                  )}

                  {/* PRIMERA PÁGINA */}

                  {paginaInicial > 1 && (
                    <>
                      <a
                        href={urlPagina(1)}
                        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
                      >
                        1
                      </a>

                      {paginaInicial > 2 && (
                        <span className="px-2 text-gray-500">
                          ...
                        </span>
                      )}
                    </>
                  )}

                  {/* NÚMEROS */}

                  {paginasVisibles.map(
                    (numeroPagina) => (
                      <a
                        key={numeroPagina}
                        href={urlPagina(
                          numeroPagina
                        )}
                        className={`rounded-lg border px-4 py-2 font-semibold transition ${
                          numeroPagina ===
                          paginaActual
                            ? "border-cyan-500 bg-cyan-500 text-black"
                            : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {numeroPagina}
                      </a>
                    )
                  )}

                  {/* ÚLTIMA PÁGINA */}

                  {paginaFinal <
                    totalPaginas && (
                    <>

                      {paginaFinal <
                        totalPaginas - 1 && (
                        <span className="px-2 text-gray-500">
                          ...
                        </span>
                      )}

                      <a
                        href={urlPagina(
                          totalPaginas
                        )}
                        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
                      >
                        {totalPaginas}
                      </a>

                    </>
                  )}

                  {/* SIGUIENTE */}

                  {paginaActual <
                    totalPaginas && (
                    <a
                      href={urlPagina(
                        paginaActual + 1
                      )}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
                    >
                      Siguiente →
                    </a>
                  )}

                </div>

                <p className="mt-4 text-center text-sm text-gray-500">
                  Página {paginaActual} de{" "}
                  {totalPaginas}
                </p>

              </div>
            )}

          </>
        )}

      </div>
    </main>
  );
}
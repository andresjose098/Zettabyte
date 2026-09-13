import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

// ==========================================
// NOMBRE DEL ESTADO
// ==========================================

function nombreEstado(estado: string) {
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

// ==========================================
// COLORES DEL ESTADO
// ==========================================

function claseEstado(estado: string) {
  switch (estado) {
    case "PENDING":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

    case "CONFIRMED":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";

    case "DELIVERED":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "CANCELLED":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-white/10 bg-white/5 text-gray-400";
  }
}

// ==========================================
// FECHA DE HOY EN COLOMBIA
// ==========================================

function obtenerRangoHoyColombia() {
  const ahora = new Date();

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);

  const year = Number(
    partes.find((parte) => parte.type === "year")?.value
  );

  const month = Number(
    partes.find((parte) => parte.type === "month")?.value
  );

  const day = Number(
    partes.find((parte) => parte.type === "day")?.value
  );

  // Colombia es UTC -5
  const inicio = new Date(
    Date.UTC(year, month - 1, day, 5, 0, 0)
  );

  const fin = new Date(
    Date.UTC(year, month - 1, day + 1, 5, 0, 0)
  );

  return {
    inicio,
    fin,
  };
}

// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

// ==========================================
// FORMATEAR FECHA Y HORA
// ==========================================

function formatearFechaHora(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(fecha);
}

// ==========================================
// PÁGINA ADMIN
// ==========================================

export default async function AdminPage() {
  const admin = await verificarAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const { inicio, fin } = obtenerRangoHoyColombia();

  // ==========================================
  // PRODUCTOS
  // ==========================================

  const productos = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
    },
  });

  const totalProductos = productos.length;

  const stockTotal = productos.reduce(
    (total, producto) => total + producto.stock,
    0
  );

  const pocoStock = productos.filter(
    (producto) =>
      producto.stock > 0 && producto.stock <= 5
  ).length;

  const agotados = productos.filter(
    (producto) => producto.stock === 0
  ).length;

  // ==========================================
  // PEDIDOS GENERALES
  // ==========================================

  const [
    pedidosPendientes,
    pedidosConfirmados,
    pedidosEntregados,
    pedidosCancelados,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.order.count({
      where: {
        status: "CONFIRMED",
      },
    }),

    prisma.order.count({
      where: {
        status: "DELIVERED",
      },
    }),

    prisma.order.count({
      where: {
        status: "CANCELLED",
      },
    }),
  ]);

  // ==========================================
  // PEDIDOS DE HOY
  // Máximo 10
  // ==========================================

  const pedidosHoy = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: inicio,
        lt: fin,
      },
    },

    take: 10,

    orderBy: {
      createdAt: "desc",
    },

    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // ==========================================
  // TOTAL VENDIDO GENERAL
  // ==========================================

  const ventasGenerales = await prisma.order.aggregate({
    where: {
      status: {
        in: ["CONFIRMED", "DELIVERED"],
      },
    },

    _sum: {
      total: true,
    },
  });

  const totalVendido =
    ventasGenerales._sum.total ?? 0;

  // ==========================================
  // DATOS DEL DÍA
  // ==========================================

  const pedidosVendidosHoy = pedidosHoy.filter(
    (pedido) =>
      pedido.status === "CONFIRMED" ||
      pedido.status === "DELIVERED"
  );

  const pedidosNoVendidosHoy = pedidosHoy.filter(
    (pedido) => pedido.status === "CANCELLED"
  );

  const pedidosPendientesHoy = pedidosHoy.filter(
    (pedido) => pedido.status === "PENDING"
  );

  // ==========================================
  // CANTIDAD DE PRODUCTOS VENDIDOS HOY
  // ==========================================

  const productosVendidosHoy =
    pedidosVendidosHoy.reduce(
      (total, pedido) => {
        const cantidadPedido =
          pedido.items.reduce(
            (subtotal, item) =>
              subtotal + item.quantity,
            0
          );

        return total + cantidadPedido;
      },
      0
    );

  // ==========================================
  // PRODUCTOS NO VENDIDOS / CANCELADOS HOY
  // ==========================================

  const productosNoVendidosHoy =
    pedidosNoVendidosHoy.reduce(
      (total, pedido) => {
        const cantidadPedido =
          pedido.items.reduce(
            (subtotal, item) =>
              subtotal + item.quantity,
            0
          );

        return total + cantidadPedido;
      },
      0
    );

  // ==========================================
  // PRODUCTOS PENDIENTES HOY
  // ==========================================

  const productosPendientesHoy =
    pedidosPendientesHoy.reduce(
      (total, pedido) => {
        const cantidadPedido =
          pedido.items.reduce(
            (subtotal, item) =>
              subtotal + item.quantity,
            0
          );

        return total + cantidadPedido;
      },
      0
    );

  // ==========================================
  // DINERO VENDIDO HOY
  // ==========================================

  const totalVendidoHoy =
    pedidosVendidosHoy.reduce(
      (total, pedido) => total + pedido.total,
      0
    );

  // ==========================================
  // VISTA
  // ==========================================

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ================================= */}
        {/* CABECERA */}
        {/* ================================= */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Zetta
              <span className="text-cyan-400">
                Byte
              </span>
            </h1>

            <p className="mt-2 text-gray-400">
              Panel de administración
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/"
              className="rounded-xl border border-white/10 px-5 py-3 text-center font-semibold transition hover:bg-white/5"
            >
              Ver tienda
            </a>

            <LogoutButton />
          </div>
        </div>

        {/* ================================= */}
        {/* RESUMEN DE HOY */}
        {/* ================================= */}

        <section className="mt-10">
          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6 sm:p-8">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Resumen de hoy
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Actividad del día
                </h2>
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-[#070b14] px-5 py-3">
                <p className="text-sm text-gray-400">
                  Fecha
                </p>

                <p className="mt-1 font-bold text-cyan-400">
                  {formatearFecha(new Date())}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              {/* VENDIDOS HOY */}

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <p className="text-gray-400">
                  Productos vendidos hoy
                </p>

                <p className="mt-3 text-4xl font-bold text-green-400">
                  {productosVendidosHoy}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Pedidos confirmados o entregados
                </p>
              </div>

              {/* NO VENDIDOS */}

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <p className="text-gray-400">
                  No vendidos
                </p>

                <p className="mt-3 text-4xl font-bold text-red-400">
                  {productosNoVendidosHoy}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Productos de pedidos cancelados
                </p>
              </div>

              {/* PENDIENTES */}

              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <p className="text-gray-400">
                  Pendientes
                </p>

                <p className="mt-3 text-4xl font-bold text-yellow-400">
                  {productosPendientesHoy}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Esperando confirmación
                </p>
              </div>

              {/* VENTAS HOY */}

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                <p className="text-gray-400">
                  Vendido hoy
                </p>

                <p className="mt-3 text-2xl font-bold text-cyan-400 sm:text-3xl">
                  $
                  {totalVendidoHoy.toLocaleString(
                    "es-CO"
                  )}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Total de ventas del día
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* INVENTARIO */}
        {/* ================================= */}

        <section className="mt-12">

          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
            Inventario
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Resumen de productos
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-gray-400">
                Productos
              </p>

              <p className="mt-3 text-4xl font-bold">
                {totalProductos}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <p className="text-gray-400">
                Stock total
              </p>

              <p className="mt-3 text-4xl font-bold text-cyan-400">
                {stockTotal}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
              <p className="text-gray-400">
                Poco stock
              </p>

              <p className="mt-3 text-4xl font-bold text-yellow-400">
                {pocoStock}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                5 unidades o menos
              </p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-gray-400">
                Agotados
              </p>

              <p className="mt-3 text-4xl font-bold text-red-400">
                {agotados}
              </p>
            </div>

          </div>
        </section>

        {/* ================================= */}
        {/* PEDIDOS GENERALES */}
        {/* ================================= */}

        <section className="mt-12">

          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
            Pedidos
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Estado general
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
              <p className="text-gray-400">
                Pendientes
              </p>

              <p className="mt-3 text-4xl font-bold text-yellow-400">
                {pedidosPendientes}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
              <p className="text-gray-400">
                Confirmados
              </p>

              <p className="mt-3 text-4xl font-bold text-cyan-400">
                {pedidosConfirmados}
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
              <p className="text-gray-400">
                Entregados
              </p>

              <p className="mt-3 text-4xl font-bold text-green-400">
                {pedidosEntregados}
              </p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-gray-400">
                Cancelados
              </p>

              <p className="mt-3 text-4xl font-bold text-red-400">
                {pedidosCancelados}
              </p>
            </div>

          </div>
        </section>

        {/* ================================= */}
        {/* TOTAL VENDIDO HISTÓRICO */}
        {/* ================================= */}

        <section className="mt-8">
          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-6 sm:p-8">

            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
              Ventas
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Total vendido histórico
            </h2>

            <p className="mt-4 text-3xl font-bold text-cyan-400 sm:text-4xl">
              $
              {totalVendido.toLocaleString("es-CO")}
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Pedidos confirmados y entregados
            </p>

          </div>
        </section>

        {/* ================================= */}
        {/* ADMINISTRACIÓN */}
        {/* ================================= */}

        <section className="mt-12">

          <h2 className="text-2xl font-bold">
            Administración
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <a
              href="/admin/productos"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/50"
            >
              <h3 className="text-xl font-bold">
                Productos
              </h3>

              <p className="mt-2 text-gray-400">
                Administrar productos y stock.
              </p>

              <p className="mt-5 font-bold text-cyan-400">
                Administrar →
              </p>
            </a>

            <a
              href="/admin/pedidos"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/50"
            >
              <h3 className="text-xl font-bold">
                Pedidos
              </h3>

              <p className="mt-2 text-gray-400">
                Confirmar, entregar o cancelar.
              </p>

              <p className="mt-5 font-bold text-cyan-400">
                Ver pedidos →
              </p>
            </a>

            <a
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/50"
            >
              <h3 className="text-xl font-bold">
                Tienda pública
              </h3>

              <p className="mt-2 text-gray-400">
                Ver la tienda como cliente.
              </p>

              <p className="mt-5 font-bold text-cyan-400">
                Abrir tienda →
              </p>
            </a>

          </div>
        </section>

        {/* ================================= */}
        {/* PEDIDOS DE HOY - MÁXIMO 10 */}
        {/* ================================= */}

        <section className="mt-12">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                Actividad de hoy
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Pedidos de hoy
              </h2>

              <p className="mt-2 text-gray-400">
                Máximo 10 pedidos del día •{" "}
                {formatearFecha(new Date())}
              </p>
            </div>

            <a
              href="/admin/pedidos"
              className="font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              Ver todos los pedidos →
            </a>

          </div>

          {pedidosHoy.length === 0 ? (

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <p className="text-lg font-bold">
                No hay pedidos hoy
              </p>

              <p className="mt-2 text-gray-400">
                Los pedidos que entren hoy aparecerán aquí.
              </p>
            </div>

          ) : (

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">

              <div className="divide-y divide-white/10">

                {pedidosHoy.map((pedido) => {

                  const cantidadProductos =
                    pedido.items.reduce(
                      (total, item) =>
                        total + item.quantity,
                      0
                    );

                  return (
                    <a
                      key={pedido.id}
                      href={`/admin/pedidos/${pedido.id}`}
                      className="block bg-white/5 p-5 transition hover:bg-white/[0.08]"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* IZQUIERDA */}

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <h3 className="text-lg font-bold">
                              Pedido #{pedido.id}
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${claseEstado(
                                pedido.status
                              )}`}
                            >
                              {nombreEstado(
                                pedido.status
                              )}
                            </span>

                          </div>

                          {pedido.customerName ? (
                            <p className="mt-3 text-sm text-gray-300">
                              Cliente:{" "}
                              {pedido.customerName}
                            </p>
                          ) : (
                            <p className="mt-3 text-sm text-gray-500">
                              Cliente sin nombre
                            </p>
                          )}

                          {pedido.customerPhone && (
                            <p className="mt-1 text-sm text-gray-400">
                              Tel:{" "}
                              {pedido.customerPhone}
                            </p>
                          )}

                          {/* PRODUCTOS */}

                          <div className="mt-3 space-y-1">

                            {pedido.items.map((item) => (
                              <p
                                key={item.id}
                                className="text-sm text-gray-400"
                              >
                                {item.product.name} ×{" "}
                                {item.quantity}
                              </p>
                            ))}

                          </div>

                          <p className="mt-3 text-xs text-gray-500">
                            {formatearFechaHora(
                              pedido.createdAt
                            )}
                          </p>

                        </div>

                        {/* DERECHA */}

                        <div className="lg:text-right">

                          <p className="text-sm text-gray-400">
                            Total
                          </p>

                          <p className="mt-1 text-xl font-bold text-cyan-400">
                            $
                            {pedido.total.toLocaleString(
                              "es-CO"
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {cantidadProductos}{" "}
                            {cantidadProductos === 1
                              ? "unidad"
                              : "unidades"}
                          </p>

                        </div>

                      </div>

                    </a>
                  );
                })}

              </div>

            </div>

          )}

        </section>

        {/* ================================= */}
        {/* FOOTER */}
        {/* ================================= */}

        <footer className="mt-12 border-t border-white/10 py-8 text-center text-sm text-gray-500">
          Panel administrativo de ZettaByte
        </footer>

      </div>
    </main>
  );
}
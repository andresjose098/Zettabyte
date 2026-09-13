import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

export default async function PedidosPage() {
  const admin = await verificarAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const pedidos = await prisma.order.findMany({
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
  });

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Pedidos
            </h1>

            <p className="mt-2 text-gray-400">
              Administra las ventas de ZettaByte.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-xl border border-white/10 px-5 py-3 text-center font-semibold transition hover:bg-white/5"
          >
            ← Volver al panel
          </a>
        </div>

        {pedidos.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-gray-400">
              Todavía no hay pedidos registrados.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Pedido
                    </p>

                    <h2 className="text-2xl font-bold">
                      #{pedido.id}
                    </h2>

                    <p className="mt-2 text-sm text-gray-400">
                      {pedido.createdAt.toLocaleString("es-CO")}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-4 py-2 text-sm font-bold ${claseEstado(
                      pedido.status
                    )}`}
                  >
                    {formatearEstado(pedido.status)}
                  </span>
                </div>

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
                          Cantidad: {item.quantity}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm text-gray-400">
                          $
                          {item.price.toLocaleString("es-CO")} c/u
                        </p>

                        <p className="font-bold">
                          $
                          {(
                            item.price * item.quantity
                          ).toLocaleString("es-CO")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-gray-400">
                    Total
                  </p>

                  <p className="text-2xl font-bold text-cyan-400">
                    $
                    {pedido.total.toLocaleString("es-CO")}
                  </p>
                </div>

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
        )}
      </div>
    </main>
  );
}
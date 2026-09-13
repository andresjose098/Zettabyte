import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";
import PedidoAcciones from "./PedidoAcciones";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function PedidoDetallePage({
  params,
}: Props) {
  const admin = await verificarAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const pedidoId = Number(id);

  if (!Number.isInteger(pedidoId)) {
    notFound();
  }

  const pedido = await prisma.order.findUnique({
    where: {
      id: pedidoId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!pedido) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* CABECERA */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Pedido
            </p>

            <h1 className="text-3xl font-bold">
              #{pedido.id}
            </h1>

            <p className="mt-2 text-gray-400">
              {pedido.createdAt.toLocaleString("es-CO")}
            </p>
          </div>

          <a
            href="/admin/pedidos"
            className="rounded-xl border border-white/10 px-5 py-3 text-center font-semibold transition hover:bg-white/5"
          >
            ← Volver a pedidos
          </a>
        </div>

        {/* ESTADO Y TOTAL */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-gray-400">
                Estado
              </p>

              <span
                className={`mt-2 inline-block rounded-full border px-4 py-2 text-sm font-bold ${claseEstado(
                  pedido.status
                )}`}
              >
                {nombreEstado(pedido.status)}
              </span>
            </div>

            <div className="sm:text-right">
              <p className="text-gray-400">
                Total
              </p>

              <p className="mt-1 text-3xl font-bold text-cyan-400">
                ${pedido.total.toLocaleString("es-CO")}
              </p>
            </div>
          </div>
        </section>

        {/* PRODUCTOS */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold">
            Productos
          </h2>

          <div className="mt-5 space-y-4">
            {pedido.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      {item.product.name}
                    </h3>

                    <p className="mt-2 text-sm text-gray-400">
                      Cantidad:{" "}
                      <span className="font-semibold text-white">
                        {item.quantity}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Stock actual:{" "}
                      <span className="font-semibold text-green-400">
                        {item.product.stock}
                      </span>
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm text-gray-400">
                      $
                      {item.price.toLocaleString("es-CO")} c/u
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      $
                      {(
                        item.price * item.quantity
                      ).toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BOTONES */}
        <PedidoAcciones
          pedidoId={pedido.id}
          estado={pedido.status}
        />

      </div>
    </main>
  );
}
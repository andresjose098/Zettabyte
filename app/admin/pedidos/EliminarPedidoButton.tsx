"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  pedidoId: number;
};

export default function EliminarPedidoButton({
  pedidoId,
}: Props) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);

  async function eliminarPedido() {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el pedido #${pedidoId}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    try {
      setEliminando(true);

      const respuesta = await fetch(
        `/api/admin/pedidos/${pedidoId}`,
        {
          method: "DELETE",
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo eliminar el pedido."
        );
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el pedido."
      );
    } finally {
      setEliminando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={eliminarPedido}
      disabled={eliminando}
      className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {eliminando ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  pedidoId: number;
  estado: string;
};

async function leerRespuesta(
  respuesta: Response
) {
  const texto = await respuesta.text();

  try {
    return JSON.parse(texto);
  } catch {
    console.error(
      "Respuesta del servidor:",
      texto
    );

    return {
      error: `El servidor respondió con error ${respuesta.status}.`,
    };
  }
}

export default function PedidoAcciones({
  pedidoId,
  estado,
}: Props) {
  const router = useRouter();

  const [cargando, setCargando] =
    useState<string | null>(null);

  const ejecutarAccion = async (
    accion:
      | "CONFIRMAR"
      | "ENTREGAR"
      | "CANCELAR"
  ) => {
    let mensaje = "";

    if (accion === "CONFIRMAR") {
      mensaje =
        "¿Confirmar este pedido? Se descontará el stock.";
    }

    if (accion === "ENTREGAR") {
      mensaje =
        "¿Marcar este pedido como entregado?";
    }

    if (accion === "CANCELAR") {
      mensaje =
        "¿Seguro que deseas cancelar este pedido?";
    }

    if (!window.confirm(mensaje)) {
      return;
    }

    setCargando(accion);

    try {
      const respuesta = await fetch(
        `/api/admin/pedidos/${pedidoId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            accion,
          }),
        }
      );

      const datos =
        await leerRespuesta(respuesta);

      if (!respuesta.ok) {
        alert(
          datos.error ||
            "No se pudo actualizar el pedido."
        );

        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(null);
    }
  };

  if (
    estado === "DELIVERED" ||
    estado === "CANCELLED"
  ) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-bold">
        Acciones del pedido
      </h2>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {estado === "PENDING" && (
          <button
            type="button"
            onClick={() =>
              ejecutarAccion("CONFIRMAR")
            }
            disabled={cargando !== null}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando === "CONFIRMAR"
              ? "Confirmando..."
              : "Confirmar pedido"}
          </button>
        )}

        {estado === "CONFIRMED" && (
          <button
            type="button"
            onClick={() =>
              ejecutarAccion("ENTREGAR")
            }
            disabled={cargando !== null}
            className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando === "ENTREGAR"
              ? "Actualizando..."
              : "Marcar entregado"}
          </button>
        )}

        {(estado === "PENDING" ||
          estado === "CONFIRMED") && (
          <button
            type="button"
            onClick={() =>
              ejecutarAccion("CANCELAR")
            }
            disabled={cargando !== null}
            className="rounded-xl border border-red-500/40 px-5 py-3 font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando === "CANCELAR"
              ? "Cancelando..."
              : "Cancelar pedido"}
          </button>
        )}
      </div>
    </section>
  );
}
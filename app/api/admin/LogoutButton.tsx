"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const cerrarSesion = async () => {
    setCargando(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });

      router.push("/admin/login");
      router.refresh();
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      onClick={cerrarSesion}
      disabled={cargando}
      className="rounded-xl border border-red-500/40 px-5 py-3 font-semibold text-red-400 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
    >
      {cargando ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
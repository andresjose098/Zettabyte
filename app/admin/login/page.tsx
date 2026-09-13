"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setCargando(true);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      const respuesta = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
        signal: controller.signal,
      });

      const texto = await respuesta.text();

      let datos;

      try {
        datos = JSON.parse(texto);
      } catch {
        console.error("Respuesta no válida:", texto);

        setError(
          "El servidor devolvió una respuesta no válida."
        );

        return;
      }

      if (!respuesta.ok) {
        setError(
          datos.error || "No se pudo iniciar sesión"
        );

        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        setError(
          "La conexión con la base de datos está tardando demasiado. Intenta nuevamente."
        );
      } else {
        setError(
          "No se pudo conectar con el servidor."
        );
      }
    } finally {
      clearTimeout(timeout);
      setCargando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b14] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl sm:p-8">

        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Zetta
            <span className="text-cyan-400">
              Byte
            </span>
          </h1>

          <p className="mt-2 text-gray-400">
            Panel de administración
          </p>
        </div>

        <form
          onSubmit={iniciarSesion}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Correo electrónico
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 outline-none transition focus:border-cyan-400"
              placeholder="admin@zettabyte.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Contraseña
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 outline-none transition focus:border-cyan-400"
              placeholder="Tu contraseña"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>

        </form>

        <a
          href="/"
          className="mt-6 block text-center text-sm text-gray-400 hover:text-cyan-400"
        >
          ← Volver a la tienda
        </a>

      </div>
    </main>
  );
}
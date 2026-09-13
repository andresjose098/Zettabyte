import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verificarAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await verificarAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ninguna imagen" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 5 MB" },
        { status: 400 }
      );
    }

    const nombreSeguro = file.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.\-_]/g, "");

    const nombreArchivo = `productos/${Date.now()}-${nombreSeguro}`;

    const blob = await put(
      nombreArchivo,
      file,
      {
        access: "public",
        addRandomSuffix: true,
      }
    );

    return NextResponse.json({
      url: blob.url,
    });
  } catch (error) {
    console.error(
      "ERROR AL SUBIR IMAGEN A VERCEL BLOB:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo subir la imagen",
      },
      {
        status: 500,
      }
    );
  }
}
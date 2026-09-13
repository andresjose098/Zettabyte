import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { verificarAdmin } from "@/lib/auth";

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
    const file = formData.get("file") as File | null;

    if (!file) {
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

    // Máximo 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 5 MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = path.extname(file.name).toLowerCase();

    const nombre =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}${extension}`;

    const carpeta = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(carpeta, {
      recursive: true,
    });

    await writeFile(
      path.join(carpeta, nombre),
      buffer
    );

    return NextResponse.json({
      url: `/uploads/${nombre}`,
    });
  } catch (error) {
    console.error("Error subiendo imagen:", error);

    return NextResponse.json(
      { error: "No se pudo subir la imagen" },
      { status: 500 }
    );
  }
}
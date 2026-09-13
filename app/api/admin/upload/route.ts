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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = path.extname(file.name).toLowerCase();

    const nombreArchivo = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}${extension}`;

    const carpetaUploads = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(carpetaUploads, {
      recursive: true,
    });

    const rutaCompleta = path.join(
      carpetaUploads,
      nombreArchivo
    );

    await writeFile(rutaCompleta, buffer);

    console.log("Imagen guardada en:", rutaCompleta);

    return NextResponse.json({
      url: `/uploads/${nombreArchivo}`,
    });
  } catch (error) {
    console.error("ERROR AL SUBIR IMAGEN:", error);

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
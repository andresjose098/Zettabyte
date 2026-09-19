import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const productos = await prisma.product.findMany({
      where: {
        active: true,
      },

      include: {
        category: true,

        // Traer todas las imágenes del producto
        images: {
          orderBy: {
            position: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error(
      "ERROR CARGANDO PRODUCTOS DE LA TIENDA:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudieron cargar los productos",
      },
      {
        status: 500,
      }
    );
  }
}
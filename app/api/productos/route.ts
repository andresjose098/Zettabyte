import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const productos = await prisma.product.findMany({
      where: {
        active: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudieron cargar los productos" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await verificarAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const productos = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(productos);
}

export async function POST(request: Request) {
  const admin = await verificarAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      name,
      description,
      price,
      image,
      stock,
      category,
      featured,
      offer,
    } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Nombre, precio y categoría son obligatorios" },
        { status: 400 }
      );
    }

    const categoria = await prisma.category.upsert({
      where: {
        name: category.trim(),
      },
      update: {},
      create: {
        name: category.trim(),
      },
    });

    const producto = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        image: image?.trim() || null,
        stock: Number(stock) || 0,
        featured: Boolean(featured),
        offer: Boolean(offer),
        categoryId: categoria.id,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(producto, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo crear el producto" },
      { status: 500 }
    );
  }
}
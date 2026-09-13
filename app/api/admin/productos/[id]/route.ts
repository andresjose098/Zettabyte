import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await verificarAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        { error: "ID de producto inválido" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error eliminando producto:", error);

    return NextResponse.json(
      { error: "No se pudo eliminar el producto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await verificarAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

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
        {
          error:
            "Nombre, precio y categoría son obligatorios",
        },
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

    const productoActualizado =
      await prisma.product.update({
        where: {
          id: productId,
        },

        data: {
          name: name.trim(),
          description:
            description?.trim() || null,
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

    return NextResponse.json(productoActualizado);
  } catch (error) {
    console.error(
      "ERROR ACTUALIZANDO PRODUCTO:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo actualizar el producto",
      },
      { status: 500 }
    );
  }
}
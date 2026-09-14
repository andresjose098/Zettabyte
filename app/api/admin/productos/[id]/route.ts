import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    if (
      Number.isNaN(productId) ||
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return NextResponse.json(
        { error: "ID de producto inválido" },
        { status: 400 }
      );
    }

    const producto = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "El producto no existe" },
        { status: 404 }
      );
    }

    const pedidosRelacionados =
      await prisma.orderItem.count({
        where: {
          productId,
        },
      });

    // Si el producto está relacionado con pedidos,
    // no lo borramos para conservar el historial.
    if (pedidosRelacionados > 0) {
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          active: false,
        },
      });

      return NextResponse.json({
        success: true,
        deleted: false,
        deactivated: true,
        message:
          "El producto tenía pedidos asociados y fue retirado de la tienda.",
      });
    }

    // Si nunca estuvo en un pedido, sí puede borrarse.
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      deactivated: false,
      message: "Producto eliminado correctamente.",
    });
  } catch (error) {
    console.error(
      "ERROR ELIMINANDO PRODUCTO:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo eliminar el producto",
      },
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

    if (
      Number.isNaN(productId) ||
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
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

    const categoria =
      await prisma.category.upsert({
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

    return NextResponse.json(
      productoActualizado
    );
  } catch (error) {
    console.error(
      "ERROR ACTUALIZANDO PRODUCTO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el producto",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   ELIMINAR PRODUCTO
========================================================= */

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar que el usuario sea administrador
    const admin = await verificarAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener ID del producto
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

    // Comprobar que el producto exista
    const producto = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "El producto no existe" },
        { status: 404 }
      );
    }

    // Revisar si el producto pertenece a algún pedido
    const pedidosRelacionados = await prisma.orderItem.count({
      where: {
        productId: productId,
      },
    });

    /*
      IMPORTANTE:

      Si el producto ya fue comprado alguna vez,
      NO se elimina físicamente de Railway.

      Se coloca active = false para conservar
      correctamente el historial de pedidos.
    */
    if (pedidosRelacionados > 0) {
      await prisma.product.update({
        where: {
          id: productId,
        },
        data: {
          active: false,
          featured: false,
          offer: false,
        },
      });

      return NextResponse.json({
        success: true,
        deleted: false,
        deactivated: true,
        message:
          "Producto retirado correctamente de la tienda.",
      });
    }

    /*
      Si el producto nunca ha sido utilizado
      en un pedido, podemos eliminarlo
      definitivamente de Railway.
    */
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
    console.error("ERROR ELIMINANDO PRODUCTO:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el producto",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   ACTUALIZAR PRODUCTO
========================================================= */

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar administrador
    const admin = await verificarAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener ID
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

    // Comprobar que el producto exista
    const productoExistente = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        image: true,
      },
    });

    if (!productoExistente) {
      return NextResponse.json(
        { error: "El producto no existe" },
        { status: 404 }
      );
    }

    // Obtener información enviada por el administrador
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

    /* =====================================================
       VALIDACIONES
    ===================================================== */

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    if (
      typeof category !== "string" ||
      !category.trim()
    ) {
      return NextResponse.json(
        { error: "La categoría es obligatoria" },
        { status: 400 }
      );
    }

    const precioNumerico = Number(price);

    if (
      !Number.isFinite(precioNumerico) ||
      precioNumerico < 0
    ) {
      return NextResponse.json(
        { error: "El precio no es válido" },
        { status: 400 }
      );
    }

    const stockNumerico = Number(stock);

    if (
      !Number.isFinite(stockNumerico) ||
      stockNumerico < 0
    ) {
      return NextResponse.json(
        { error: "El stock no es válido" },
        { status: 400 }
      );
    }

    /* =====================================================
       CREAR O BUSCAR CATEGORÍA
    ===================================================== */

    const nombreCategoria = category.trim();

    const categoria = await prisma.category.upsert({
      where: {
        name: nombreCategoria,
      },
      update: {},
      create: {
        name: nombreCategoria,
      },
    });

    /* =====================================================
       CONSERVAR LA IMAGEN
    =====================================================

       Si el frontend envía una nueva URL de Vercel Blob,
       se guarda.

       Si por algún motivo no envía "image",
       conservamos la imagen que ya tenía el producto.
    */

    let imagenFinal = productoExistente.image;

    if (typeof image === "string") {
      const imagenLimpia = image.trim();

      if (imagenLimpia) {
        imagenFinal = imagenLimpia;
      }
    }

    /* =====================================================
       ACTUALIZAR PRODUCTO EN RAILWAY
    ===================================================== */

    const productoActualizado = await prisma.product.update({
      where: {
        id: productId,
      },

      data: {
        name: name.trim(),

        description:
          typeof description === "string" &&
          description.trim()
            ? description.trim()
            : null,

        price: Math.round(precioNumerico),

        image: imagenFinal,

        stock: Math.max(
          0,
          Math.floor(stockNumerico)
        ),

        featured: featured === true,

        offer: offer === true,

        categoryId: categoria.id,
      },

      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Producto actualizado correctamente.",
      product: productoActualizado,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZANDO PRODUCTO:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el producto",
      },
      { status: 500 }
    );
  }
}
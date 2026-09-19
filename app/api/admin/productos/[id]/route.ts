import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGENES = 5;

/* =========================================================
   ELIMINAR PRODUCTO
========================================================= */

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verificarAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

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
        active: true,
      },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "El producto no existe" },
        { status: 404 }
      );
    }

    const pedidosRelacionados = await prisma.orderItem.count({
      where: {
        productId,
      },
    });

    /*
      Si el producto pertenece a un pedido,
      no lo eliminamos físicamente para conservar
      correctamente el historial.
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
        message: "Producto retirado correctamente de la tienda.",
      });
    }

    /*
      Si nunca ha sido utilizado en un pedido,
      se elimina definitivamente.

      Las imágenes relacionadas en ProductImage
      se eliminan automáticamente por onDelete: Cascade.
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
    const admin = await verificarAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

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

    /* =====================================================
       BUSCAR PRODUCTO ACTUAL
    ===================================================== */

    const productoExistente = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        image: true,
        images: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!productoExistente) {
      return NextResponse.json(
        { error: "El producto no existe" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const {
      name,
      description,
      price,
      image,
      images,
      stock,
      category,
      featured,
      offer,
    } = body;

    /* =====================================================
       VALIDACIONES
    ===================================================== */

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    if (typeof category !== "string" || !category.trim()) {
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
       PROCESAR IMÁGENES
    ===================================================== */

    let imagenesFinales: string[];

    if (Array.isArray(images)) {
      imagenesFinales = images
        .filter(
          (url): url is string =>
            typeof url === "string" &&
            url.trim().length > 0
        )
        .map((url) => url.trim());

      // Evitar URLs duplicadas
      imagenesFinales = [...new Set(imagenesFinales)];

      if (imagenesFinales.length > MAX_IMAGENES) {
        return NextResponse.json(
          {
            error: `Solo puedes guardar hasta ${MAX_IMAGENES} imágenes por producto.`,
          },
          { status: 400 }
        );
      }
    } else {
      /*
        Compatibilidad con productos anteriores.

        Si el frontend todavía no envía "images",
        conservamos las imágenes actuales.
      */
      imagenesFinales = productoExistente.images.map(
        (img) => img.url
      );

      /*
        Si el producto es antiguo y solamente tiene
        Product.image, lo conservamos.
      */
      if (
        imagenesFinales.length === 0 &&
        productoExistente.image
      ) {
        imagenesFinales = [productoExistente.image];
      }

      /*
        Compatibilidad con el frontend antiguo que
        todavía envía solamente "image".
      */
      if (
        typeof image === "string" &&
        image.trim() &&
        !imagenesFinales.includes(image.trim())
      ) {
        imagenesFinales = [image.trim()];
      }
    }

    /*
      La primera imagen será siempre la principal.
    */
    const imagenPrincipal =
      imagenesFinales.length > 0
        ? imagenesFinales[0]
        : null;

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
       ACTUALIZAR PRODUCTO + GALERÍA
    ===================================================== */

    const productoActualizado = await prisma.$transaction(
      async (tx) => {
        /*
          Primero actualizamos los datos generales.
        */
        await tx.product.update({
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

            image: imagenPrincipal,

            stock: Math.max(
              0,
              Math.floor(stockNumerico)
            ),

            featured: featured === true,

            offer: offer === true,

            categoryId: categoria.id,
          },
        });

        /*
          Reemplazamos la galería del producto.
        */
        await tx.productImage.deleteMany({
          where: {
            productId,
          },
        });

        if (imagenesFinales.length > 0) {
          await tx.productImage.createMany({
            data: imagenesFinales.map((url, index) => ({
              url,
              position: index,
              productId,
            })),
          });
        }

        /*
          Devolvemos el producto actualizado
          con categoría e imágenes.
        */
        return tx.product.findUnique({
          where: {
            id: productId,
          },

          include: {
            category: true,

            images: {
              orderBy: {
                position: "asc",
              },
            },
          },
        });
      }
    );

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
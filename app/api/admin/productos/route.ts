import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGENES = 5;

/* =========================================================
   OBTENER PRODUCTOS ACTIVOS DEL ADMINISTRADOR
========================================================= */

export async function GET() {
  try {
    const admin = await verificarAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const productos = await prisma.product.findMany({
      where: {
        active: true,
      },

      include: {
        category: true,

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
      "ERROR OBTENIENDO PRODUCTOS:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudieron obtener los productos",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   CREAR PRODUCTO
========================================================= */

export async function POST(request: Request) {
  try {
    const admin = await verificarAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
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
       VALIDAR NOMBRE
    ===================================================== */

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          error: "El nombre del producto es obligatorio",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDAR CATEGORÍA
    ===================================================== */

    if (
      typeof category !== "string" ||
      !category.trim()
    ) {
      return NextResponse.json(
        {
          error: "La categoría es obligatoria",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDAR PRECIO
    ===================================================== */

    const precioNumerico = Number(price);

    if (
      !Number.isFinite(precioNumerico) ||
      precioNumerico < 0
    ) {
      return NextResponse.json(
        {
          error: "El precio no es válido",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDAR STOCK
    ===================================================== */

    const stockNumerico = Number(stock ?? 0);

    if (
      !Number.isFinite(stockNumerico) ||
      stockNumerico < 0
    ) {
      return NextResponse.json(
        {
          error: "El stock no es válido",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       PREPARAR IMÁGENES
    ===================================================== */

    let imagenesFinales: string[] = [];

    if (Array.isArray(images)) {
      imagenesFinales = images
        .filter(
          (url): url is string =>
            typeof url === "string" &&
            url.trim().length > 0
        )
        .map((url) => url.trim());

      // Eliminar URLs repetidas.
      imagenesFinales = [...new Set(imagenesFinales)];
    }

    /*
      Compatibilidad con el formulario anterior.

      Si todavía llega solamente "image",
      también podemos crear el producto normalmente.
    */
    if (
      imagenesFinales.length === 0 &&
      typeof image === "string" &&
      image.trim()
    ) {
      imagenesFinales = [image.trim()];
    }

    if (imagenesFinales.length > MAX_IMAGENES) {
      return NextResponse.json(
        {
          error: `Solo puedes guardar hasta ${MAX_IMAGENES} imágenes por producto.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
      La primera imagen de la galería
      será la imagen principal del producto.
    */
    const imagenPrincipal =
      imagenesFinales.length > 0
        ? imagenesFinales[0]
        : null;

    /* =====================================================
       CREAR O ENCONTRAR CATEGORÍA
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
       CREAR PRODUCTO + IMÁGENES
    ===================================================== */

    const producto = await prisma.product.create({
      data: {
        name: name.trim(),

        description:
          typeof description === "string" &&
          description.trim()
            ? description.trim()
            : null,

        price: Math.round(precioNumerico),

        /*
          Seguimos guardando la primera imagen aquí
          para mantener compatibilidad con la tienda.
        */
        image: imagenPrincipal,

        stock: Math.max(
          0,
          Math.floor(stockNumerico)
        ),

        featured: featured === true,

        offer: offer === true,

        active: true,

        categoryId: categoria.id,

        /*
          Aquí guardamos la galería completa
          en ProductImage.
        */
        images: {
          create: imagenesFinales.map(
            (url, index) => ({
              url,
              position: index,
            })
          ),
        },
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

    console.log(
      "PRODUCTO CREADO:",
      producto.id,
      producto.name,
      producto.image,
      `(${producto.images.length} imágenes)`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Producto creado correctamente.",
        product: producto,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ERROR CREANDO PRODUCTO:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el producto",
      },
      {
        status: 500,
      }
    );
  }
}
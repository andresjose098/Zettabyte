import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      // IMPORTANTE:
      // Los productos eliminados/desactivados
      // no deben volver a aparecer en el administrador.
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
       PREPARAR IMAGEN
    ===================================================== */

    let imagenFinal: string | null = null;

    if (
      typeof image === "string" &&
      image.trim()
    ) {
      imagenFinal = image.trim();
    }

    /*
      En producción imagenFinal debería contener
      una URL de Vercel Blob parecida a:

      https://xxxxx.public.blob.vercel-storage.com/imagen.webp
    */

    console.log(
      "URL DE IMAGEN RECIBIDA:",
      imagenFinal
    );

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
       CREAR PRODUCTO EN RAILWAY
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

        image: imagenFinal,

        stock: Math.max(
          0,
          Math.floor(stockNumerico)
        ),

        featured: featured === true,

        offer: offer === true,

        // Siempre crear el producto activo.
        active: true,

        categoryId: categoria.id,
      },

      include: {
        category: true,
      },
    });

    console.log(
      "PRODUCTO CREADO:",
      producto.id,
      producto.name,
      producto.image
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
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ItemPedido = {
  productId: number;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerPhone,
      items,
    }: {
      customerName?: string;
      customerPhone?: string;
      items: ItemPedido[];
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "El pedido no tiene productos" },
        { status: 400 }
      );
    }

    const productosIds = items.map((item) => item.productId);

    const productos = await prisma.product.findMany({
      where: {
        id: {
          in: productosIds,
        },
      },
    });

    if (productos.length !== productosIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no existen" },
        { status: 400 }
      );
    }

    let total = 0;

    const itemsPreparados = [];

    for (const item of items) {
      const producto = productos.find(
        (producto) => producto.id === item.productId
      );

      if (!producto) {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 400 }
        );
      }

      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: "La cantidad no es válida" },
          { status: 400 }
        );
      }

      if (item.quantity > producto.stock) {
        return NextResponse.json(
          {
            error: `No hay suficiente stock de ${producto.name}`,
          },
          { status: 400 }
        );
      }

      total += producto.price * item.quantity;

      itemsPreparados.push({
        productId: producto.id,
        quantity: item.quantity,
        price: producto.price,
      });
    }

    const pedido = await prisma.order.create({
      data: {
        customerName: customerName?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        total,
        status: "PENDING",
        items: {
          create: itemsPreparados,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        pedido,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando pedido:", error);

    return NextResponse.json(
      { error: "No se pudo crear el pedido" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: Props
) {
  const admin = await verificarAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const pedidoId = Number(id);

    if (!Number.isInteger(pedidoId)) {
      return NextResponse.json(
        { error: "Pedido no válido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const accion = body.accion as
      | "CONFIRMAR"
      | "ENTREGAR"
      | "CANCELAR";

    if (
      !["CONFIRMAR", "ENTREGAR", "CANCELAR"].includes(
        accion
      )
    ) {
      return NextResponse.json(
        { error: "Acción no válida" },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(
      async (tx) => {
        const pedido = await tx.order.findUnique({
          where: {
            id: pedidoId,
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!pedido) {
          throw new Error("PEDIDO_NO_EXISTE");
        }

        // ====================================
        // CONFIRMAR PEDIDO
        // ====================================
        if (accion === "CONFIRMAR") {
          if (pedido.status !== "PENDING") {
            throw new Error("PEDIDO_YA_PROCESADO");
          }

          for (const item of pedido.items) {
            const productoActualizado =
              await tx.product.updateMany({
                where: {
                  id: item.productId,
                  stock: {
                    gte: item.quantity,
                  },
                },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });

            if (productoActualizado.count === 0) {
              throw new Error(
                `STOCK_INSUFICIENTE:${item.product.name}`
              );
            }
          }

          return await tx.order.update({
            where: {
              id: pedidoId,
            },
            data: {
              status: "CONFIRMED",
            },
          });
        }

        // ====================================
        // MARCAR COMO ENTREGADO
        // ====================================
        if (accion === "ENTREGAR") {
          if (pedido.status !== "CONFIRMED") {
            throw new Error(
              "PEDIDO_NO_CONFIRMADO"
            );
          }

          return await tx.order.update({
            where: {
              id: pedidoId,
            },
            data: {
              status: "DELIVERED",
            },
          });
        }

        // ====================================
        // CANCELAR PEDIDO
        // ====================================
        if (accion === "CANCELAR") {
          if (pedido.status === "DELIVERED") {
            throw new Error(
              "PEDIDO_YA_ENTREGADO"
            );
          }

          if (pedido.status === "CANCELLED") {
            throw new Error(
              "PEDIDO_YA_CANCELADO"
            );
          }

          // Si el pedido estaba confirmado,
          // devolvemos el stock.
          if (pedido.status === "CONFIRMED") {
            for (const item of pedido.items) {
              await tx.product.update({
                where: {
                  id: item.productId,
                },
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }

          return await tx.order.update({
            where: {
              id: pedidoId,
            },
            data: {
              status: "CANCELLED",
            },
          });
        }

        throw new Error("ACCION_INVALIDA");
      }
    );

    return NextResponse.json({
      success: true,
      pedido: resultado,
    });
  } catch (error) {
    console.error(
      "ERROR ACTUALIZANDO PEDIDO:",
      error
    );

    if (error instanceof Error) {
      if (error.message === "PEDIDO_NO_EXISTE") {
        return NextResponse.json(
          {
            error: "El pedido no existe.",
          },
          { status: 404 }
        );
      }

      if (
        error.message === "PEDIDO_YA_PROCESADO"
      ) {
        return NextResponse.json(
          {
            error:
              "Este pedido ya fue procesado.",
          },
          { status: 400 }
        );
      }

      if (
        error.message.startsWith(
          "STOCK_INSUFICIENTE:"
        )
      ) {
        const producto =
          error.message.split(":")[1];

        return NextResponse.json(
          {
            error: `No hay suficiente stock de ${producto}.`,
          },
          { status: 400 }
        );
      }

      if (
        error.message === "PEDIDO_NO_CONFIRMADO"
      ) {
        return NextResponse.json(
          {
            error:
              "Primero debes confirmar el pedido.",
          },
          { status: 400 }
        );
      }

      if (
        error.message === "PEDIDO_YA_ENTREGADO"
      ) {
        return NextResponse.json(
          {
            error:
              "Un pedido entregado no se puede cancelar.",
          },
          { status: 400 }
        );
      }

      if (
        error.message === "PEDIDO_YA_CANCELADO"
      ) {
        return NextResponse.json(
          {
            error:
              "Este pedido ya está cancelado.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "No se pudo actualizar el pedido.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: Props
) {
  const admin = await verificarAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const pedidoId = Number(id);

    if (!Number.isInteger(pedidoId)) {
      return NextResponse.json(
        { error: "Pedido no válido" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const pedido = await tx.order.findUnique({
        where: {
          id: pedidoId,
        },
        include: {
          items: true,
        },
      });

      if (!pedido) {
        throw new Error("PEDIDO_NO_EXISTE");
      }

      // Si estaba confirmado, el stock ya había sido
      // descontado. Lo devolvemos antes de eliminar.
      if (pedido.status === "CONFIRMED") {
        for (const item of pedido.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Primero eliminamos los productos asociados
      // al pedido para evitar problemas de relación.
      await tx.orderItem.deleteMany({
        where: {
          orderId: pedidoId,
        },
      });

      // Ahora eliminamos el pedido.
      await tx.order.delete({
        where: {
          id: pedidoId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Pedido eliminado correctamente.",
    });
  } catch (error) {
    console.error(
      "ERROR ELIMINANDO PEDIDO:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "PEDIDO_NO_EXISTE"
    ) {
      return NextResponse.json(
        {
          error: "El pedido no existe.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "No se pudo eliminar el pedido.",
      },
      { status: 500 }
    );
  }
}
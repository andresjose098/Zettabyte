import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";

import { NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request
): Promise<NextResponse> {
  try {
    const body =
      (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async () => {
        const admin = await verificarAdmin();

        if (!admin) {
          throw new Error("No autorizado");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
          ],

          maximumSizeInBytes:
            15 * 1024 * 1024,

          addRandomSuffix: true,
        };
      },

      onUploadCompleted: async ({
        blob,
      }) => {
        console.log(
          "Imagen subida a Blob:",
          blob.url
        );
      },
    });

    return NextResponse.json(
      jsonResponse
    );
  } catch (error) {
    console.error(
      "ERROR GENERANDO SUBIDA BLOB:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir la imagen",
      },
      {
        status: 400,
      }
    );
  }
}
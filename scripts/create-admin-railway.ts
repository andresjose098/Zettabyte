import "dotenv/config";
import bcrypt from "bcryptjs";
import readline from "readline";
import { prisma } from "../lib/prisma";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function preguntar(texto: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta.trim());
    });
  });
}

async function main() {
  console.log("");
  console.log("=== Crear administrador en Railway ===");
  console.log("");

  console.log(
    `Base de datos objetivo: ${process.env.DB_HOST || "127.0.0.1"}`
  );

  console.log(
    `Nombre de base: ${process.env.DB_NAME || "zettabyte_db"}`
  );

  console.log("");

  if (
    process.env.DB_HOST !== "hopper.proxy.rlwy.net"
  ) {
    console.log(
      "ERROR: No estás conectado a Railway."
    );

    console.log(
      "Revisa el archivo .env antes de continuar."
    );

    return;
  }

  const nombre = await preguntar(
    "Nombre del administrador: "
  );

  const email = (
    await preguntar(
      "Correo del administrador: "
    )
  )
    .toLowerCase()
    .trim();

  const password = await preguntar(
    "Contraseña nueva: "
  );

  if (!nombre || !email || !password) {
    console.log("");
    console.log(
      "ERROR: Todos los campos son obligatorios."
    );
    return;
  }

  if (password.length < 8) {
    console.log("");
    console.log(
      "ERROR: La contraseña debe tener mínimo 8 caracteres."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  const usuarioExistente =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (usuarioExistente) {
    const usuarioActualizado =
      await prisma.user.update({
        where: {
          id: usuarioExistente.id,
        },
        data: {
          name: nombre,
          password: passwordHash,
          role: "ADMIN",
        },
      });

    console.log("");
    console.log(
      "Administrador actualizado correctamente."
    );

    console.log(
      `ID: ${usuarioActualizado.id}`
    );

    console.log(
      `Correo: ${usuarioActualizado.email}`
    );
  } else {
    const nuevoUsuario =
      await prisma.user.create({
        data: {
          name: nombre,
          email,
          password: passwordHash,
          role: "ADMIN",
        },
      });

    console.log("");
    console.log(
      "Administrador creado correctamente."
    );

    console.log(
      `ID: ${nuevoUsuario.id}`
    );

    console.log(
      `Correo: ${nuevoUsuario.email}`
    );
  }

  const totalUsuarios =
    await prisma.user.count();

  console.log("");
  console.log(
    `Usuarios actualmente en Railway: ${totalUsuarios}`
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "ERROR creando administrador:"
    );

    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    rl.close();

    await prisma.$disconnect();
  });
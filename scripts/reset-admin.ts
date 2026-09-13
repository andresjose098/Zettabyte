import "dotenv/config";
import bcrypt from "bcryptjs";
import readline from "readline";
import { prisma } from "../lib/prisma";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function preguntar(pregunta: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      resolve(respuesta.trim());
    });
  });
}

async function main() {
  console.log("");
  console.log("=== Actualizar administrador ZettaByte ===");
  console.log("");

  console.log(
    `Base de datos objetivo: ${
      process.env.DB_HOST || "127.0.0.1"
    }`
  );

  console.log("");

  const email = (
    await preguntar("Correo del administrador: ")
  )
    .toLowerCase()
    .trim();

  const password = await preguntar(
    "Nueva contraseña: "
  );

  if (!email || !password) {
    console.log(
      "Error: correo y contraseña son obligatorios."
    );

    return;
  }

  if (password.length < 8) {
    console.log(
      "Error: utiliza una contraseña de mínimo 8 caracteres."
    );

    return;
  }

  const usuario = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!usuario) {
    console.log("");
    console.log(
      "Error: no existe un administrador con ese correo."
    );

    return;
  }

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  await prisma.user.update({
    where: {
      id: usuario.id,
    },
    data: {
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("");
  console.log(
    "Administrador actualizado correctamente."
  );

  console.log(`Correo: ${email}`);
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "Error actualizando administrador:"
    );

    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
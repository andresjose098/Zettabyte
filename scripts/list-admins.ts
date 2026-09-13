import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("");
  console.log("=== Administradores en Railway ===");
  console.log("");

  console.log(
    `Base de datos objetivo: ${process.env.DB_HOST || "127.0.0.1"}`
  );

  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (usuarios.length === 0) {
    console.log("");
    console.log("No hay usuarios en la base de datos.");
    return;
  }

  console.log("");

  for (const usuario of usuarios) {
    console.log(
      `${usuario.id} | ${usuario.name} | ${usuario.email} | ${usuario.role}`
    );
  }
}

main()
  .catch((error) => {
    console.error("Error consultando usuarios:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
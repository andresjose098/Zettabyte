import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const adapter = new PrismaMariaDb({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "zettabyte_db",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("\n=== Crear administrador de ZettaByte ===\n");

  const name = await rl.question("Nombre del administrador: ");
  const email = await rl.question("Correo del administrador: ");
  const password = await rl.question("Contraseña: ");

  rl.close();

  if (!name || !email || !password) {
    throw new Error("Todos los campos son obligatorios.");
  }

  if (password.length < 8) {
    throw new Error("La contraseña debe tener mínimo 8 caracteres.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
    },
  });

  if (existingUser) {
    throw new Error("Ya existe un administrador con ese correo.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("\nAdministrador creado correctamente ✅");
  console.log(`Nombre: ${admin.name}`);
  console.log(`Correo: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
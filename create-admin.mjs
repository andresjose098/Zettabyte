import "dotenv/config";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const rl = readline.createInterface({ input, output });

async function main() {
  console.log("\n=== CREAR ADMINISTRADOR EN TURSO ===\n");

  const name = await rl.question("Nombre: ");
  const email = await rl.question("Correo: ");
  const password = await rl.question("Contraseña: ");

  if (!name || !email || !password) {
    throw new Error("Nombre, correo y contraseña son obligatorios.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.execute({
    sql: `
      INSERT INTO User
      (name, email, password, role, createdAt, updatedAt)
      VALUES (?, ?, ?, 'ADMIN', ?, ?)
    `,
    args: [
      name.trim(),
      email.trim().toLowerCase(),
      hashedPassword,
      new Date(),
      new Date(),
    ],
  });

  console.log("\n✅ Administrador creado correctamente en Turso.");
  console.log("Correo:", email.trim().toLowerCase());
}

main()
  .catch((error) => {
    console.error("\n❌ No se pudo crear el administrador:");
    console.error(error);
  })
  .finally(() => {
    rl.close();
  });
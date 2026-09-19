import "dotenv/config";
import { createClient } from "@libsql/client";
import fs from "node:fs";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Conectando con Turso...");

  const migrationPath =
    "./prisma/migrations/20260919034424_init/migration.sql";

  const sql = fs.readFileSync(migrationPath, "utf8");

  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  console.log(`Ejecutando ${statements.length} instrucciones...`);

  for (const statement of statements) {
    await client.execute(statement);
  }

  const result = await client.execute(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name;
  `);

  console.log("\n✅ TURSO CONFIGURADO");
  console.log("Tablas encontradas:");

  for (const row of result.rows) {
    console.log("-", row.name);
  }
}

main().catch((error) => {
  console.error("\n❌ Error configurando Turso:");
  console.error(error);
  process.exit(1);
});
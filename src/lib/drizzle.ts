import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const isServer = typeof window === "undefined";

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;

if (isServer) {
  client = postgres(connectionString, {
    prepare: false,
    max: 1,
  });
  db = drizzle(client, { schema });
} else {
  throw new Error(
    "Drizzle deve ser usado apenas no servidor. Use o cliente Supabase no frontend."
  );
}

export { db, client };
export * from "./schema";

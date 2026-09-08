// @ts-ignore
import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';

let pgInstance: EmbeddedPostgres | null = null;

export async function ensureEmbeddedDatabase(): Promise<EmbeddedPostgres> {
  if (pgInstance) {
    return pgInstance;
  }

  const dbDir = path.resolve(process.cwd(), '.pgdata');
  console.log(`[Embedded Postgres] Verificando clúster en: ${dbDir}`);

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'postgres',
    password: 'password',
    port: 5432,
    persistent: true,
  });

  try {
    await pg.initialise();
    console.log('[Embedded Postgres] Clúster de datos inicializado.');
  } catch (_err: unknown) {
    // Si ya está inicializado, el error es esperado
  }

  try {
    await pg.start();
    console.log('[Embedded Postgres] Servidor PostgreSQL iniciado y escuchando en el puerto 5432.');

    try {
      await pg.createDatabase('securelife_db');
      console.log('[Embedded Postgres] Base de datos "securelife_db" creada.');
    } catch (_err: unknown) {
      // Si la base de datos ya existe, continuar
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log('[Embedded Postgres] Nota al iniciar servidor (quizás ya está en ejecución):', message);
  }

  pgInstance = pg;
  return pg;
}

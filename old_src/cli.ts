import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';

// Asegurar que la base de datos exista
const dbPath = path.join(process.cwd(), 'data', 'monitor.db');
if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

// Crear tabla por si ejecutamos el CLI antes que el Agente
db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'UP',
    last_checked TEXT
  );
`);

const args = process.argv.slice(2);
const command = args[0];

if (command === 'add') {
  const name = args[1];
  const url = args[2];
  
  if (!name || !url) {
    console.error('❌ Uso incorrecto. Ejemplo: pnpm run cli add "Mi Cliente" "https://cliente.com"');
    process.exit(1);
  }

  try {
    db.prepare('INSERT INTO sites (name, url) VALUES (?, ?)').run(name, url);
    console.log(`✅ Sitio agregado correctamente: ${name} (${url})`);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.error(`⚠️ El sitio ${url} ya existe en la base de datos.`);
    } else {
      console.error('❌ Error al agregar sitio:', error.message);
    }
  }
} else if (command === 'list') {
  try {
    const sites = db.prepare('SELECT id, name, url, status, last_checked FROM sites').all();
    if (sites.length === 0) {
      console.log('📭 No hay sitios monitoreados actualmente.');
    } else {
      console.table(sites);
    }
  } catch (error: any) {
    console.log('📭 La base de datos está vacía o no inicializada.');
  }
} else {
  console.log('🛠️ Comandos disponibles:');
  console.log('  pnpm run cli add "Nombre" "URL"');
  console.log('  pnpm run cli list');
}
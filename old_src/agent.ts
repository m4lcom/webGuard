import { DatabaseSync } from 'node:sqlite';
import * as cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// ─── CONFIGURACIÓN E INYECCIÓN DE DEPENDENCIAS ───
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.MY_TELEGRAM_CHAT_ID!;
const GEMINI_KEY = process.env.GEMINI_API_KEY!;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// ─── BASE DE DATOS NATIVA (SQLite) ───
const dbPath = path.join(process.cwd(), 'data', 'monitor.db');
if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'UP',
    last_checked TEXT
  );
`);

interface Site {
  id: number;
  name: string;
  url: string;
  status: 'UP' | 'DOWN';
}

// ─── LÓGICA DEL AGENTE ───

async function analyzeErrorWithAI(siteName: string, statusCode: number, errorMsg: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `La web del cliente '${siteName}' acaba de caer. 
    Código HTTP: ${statusCode}. Mensaje interno: ${errorMsg}.
    Redactá un mensaje muy breve y técnico (1 párrafo) explicando qué suele significar este error para que yo pueda reenviárselo al cliente y darle tranquilidad de que lo estoy revisando.`;
    
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) {
    console.error("❌ Error de Gemini detallado:", e);
    return "No se pudo generar el diagnóstico con IA.";
  }
}

async function checkSites() {
  console.log(`[${new Date().toLocaleTimeString()}] 🔍 Iniciando ronda de monitoreo...`);
  
  const stmt = db.prepare('SELECT * FROM sites');
const sites = stmt.all() as unknown as Site[];

  if (sites.length === 0) {
    console.log("No hay sitios configurados para monitorear.");
    return;
  }

  for (const site of sites) {
    let isDown = false;
    let statusCode = 0;
    let errorDetail = "";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

      const response = await fetch(site.url, { 
        method: 'GET',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      statusCode = response.status;
      if (!response.ok) {
        isDown = true;
        errorDetail = `Respondió con status ${statusCode}`;
      }

    } catch (error: any) {
      isDown = true;
      errorDetail = error.name === 'AbortError' ? 'Timeout (tardó más de 10s)' : error.message;
    }

    // Actualizar DB y alertar si cambió el estado
    const now = new Date().toISOString();
    const currentStatus = isDown ? 'DOWN' : 'UP';

    db.prepare('UPDATE sites SET status = ?, last_checked = ? WHERE id = ?')
      .run(currentStatus, now, site.id);

    if (isDown && site.status === 'UP') {
      console.log(`🚨 CAÍDA DETECTADA: ${site.name} (${site.url})`);
      
      const diagnosis = await analyzeErrorWithAI(site.name, statusCode, errorDetail);
      
      const alertMsg = `🚨 *ALERTA DE CAÍDA* 🚨\n\n` +
                       `🌐 *Sitio:* ${site.name}\n` +
                       `🔗 *URL:* ${site.url}\n` +
                       `❌ *Error:* ${errorDetail}\n\n` +
                       `🤖 *Diagnóstico rápido:*\n_${diagnosis}_`;

      await bot.sendMessage(CHAT_ID, alertMsg, { parse_mode: 'Markdown' });
    } else if (!isDown && site.status === 'DOWN') {
      console.log(`✅ RECUPERADO: ${site.name} (${site.url})`);
      await bot.sendMessage(CHAT_ID, `✅ *SITIO RECUPERADO*\n\n🌐 ${site.name} vuelve a estar online.`, { parse_mode: 'Markdown' });
    }
  }
}

// ─── ORQUESTACIÓN ───
console.log('🛡️ WebGuard Agent iniciado (Modo TypeScript + SQLite Nativo)');

// Ejecutar cada 5 minutos
cron.schedule('*/5 * * * *', () => {
  checkSites().catch(console.error);
});

// Chequeo inicial al arrancar
checkSites();
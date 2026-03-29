import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Permitir hasta 60 segundos de ejecución en Vercel
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Asegurar que el cron de Vercel está autorizado o es una prueba local
  const authHeader = request.headers.get('authorization');
  const contextUrl = new URL(request.url);
  const secretQuery = contextUrl.searchParams.get('secret');

  const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader !== expectedHeader && secretQuery !== process.env.CRON_SECRET) {
    return NextResponse.json({ 
      error: 'Unauthorized', 
      recibido_header: authHeader, 
      recibido_query: secretQuery,
      esperado: expectedHeader 
    }, { status: 401 });
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.MY_TELEGRAM_CHAT_ID;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!TELEGRAM_TOKEN || !CHAT_ID || !GEMINI_KEY) {
    console.error("Faltan variables de entorno esenciales del bot.");
    return NextResponse.json({ error: "Falta configuración" }, { status: 500 });
  }

  const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);

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

  console.log(`[${new Date().toLocaleTimeString()}] 🔍 Iniciando ronda de monitoreo Vercel Cron...`);

  const { data: sites, error: dbError } = await supabase.from('sites').select('*');

  if (dbError) {
    console.error('Error al obtener sitios desde Supabase:', dbError);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!sites || sites.length === 0) {
    return NextResponse.json({ message: 'No hay sitios configurados para monitorear.' });
  }

  let checkedCount = 0;

  for (const site of sites) {
    let isDown = false;
    let statusCode = 0;
    let errorDetail = "";
    
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s de timeout

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

    const end = performance.now();
    const responseTimeMs = Math.round(end - start);
    const currentStatus = isDown ? 'DOWN' : 'UP';

    // 1. Actualizar Site en DB
    await supabase.from('sites').update({
      status: currentStatus,
      last_checked: new Date().toISOString()
    }).eq('id', site.id);

    // 2. Insertar log de métricas
    await supabase.from('checks').insert({
      site_id: site.id,
      status: currentStatus,
      response_time_ms: responseTimeMs
    });

    // 3. Alertar si hay cambio de estado
    if (isDown && site.status === 'UP') {
      console.log(`🚨 CAÍDA DETECTADA: ${site.name}`);
      const diagnosis = await analyzeErrorWithAI(site.name, statusCode, errorDetail);
      
      const alertMsg = `🚨 *ALERTA DE CAÍDA* 🚨\n\n` +
                       `🌐 *Sitio:* ${site.name}\n` +
                       `🔗 *URL:* ${site.url}\n` +
                       `❌ *Error:* ${errorDetail}\n\n` +
                       `🤖 *Diagnóstico rápido:*\n_${diagnosis}_`;

      await bot.sendMessage(CHAT_ID, alertMsg, { parse_mode: 'Markdown' }).catch(console.error);
    } else if (!isDown && site.status === 'DOWN') {
      console.log(`✅ RECUPERADO: ${site.name}`);
      await bot.sendMessage(CHAT_ID, `✅ *SITIO RECUPERADO*\n\n🌐 ${site.name} vuelve a estar online. Tardo: ${responseTimeMs}ms`, { parse_mode: 'Markdown' }).catch(console.error);
    }
    checkedCount++;
  }

  return NextResponse.json({ message: 'Cron job executed successfully', sitesChecked: checkedCount });
}

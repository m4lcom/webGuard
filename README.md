# 🛡️ Cloud WebGuard Agent

Un agente de monitoreo de disponibilidad (uptime) moderno, serverless y automatizado. Vigila el estado de tus sitios web de forma continua, diagnostica los motivos de una caída utilizando Inteligencia Artificial (Google Gemini), y te notifica instantáneamente a tu teléfono vía Telegram.

Cuenta además con un *Dashboard* privado y panel de métricas históricas, totalmente integrado y listo para ser desplegado en la nube.

---

## ✨ Características Principales

- **⏰ Monitoreo Continuo (Cron):** Audita el estado HTTP y calcula el tiempo de respuesta (*ping*) de URLs especificadas.
- **🤖 Diagnóstico por IA:** Ante una caída, el agente le pregunta a `gemini-1.5-flash` cuáles podrían ser los causantes del código de error HTTP para explicarte brevemente qué pasó.
- **📲 Alertas en Tiempo Real:** Se comunica de inmediato con vos a través de un Bot de Telegram.
- **📊 Dashboard Interactivo:** Panel administrativo web (protegido por contraseña) con diseño *glassmorphism* para gestionar qué plataformas monitorear y visualizar gráficos de rendimiento recientes.
- **📧 Reportes Mensuales (SLA):** Sistema de reportes automatizados en background (vía Resend) que te envía al correo las estadísticas globales de *Uptime* el día 1 de cada mes.
- **🌩️ Serverless & Edge:** Optimizado de pies a cabeza para funcionar en entornos sin servidor como Vercel y consumiendo APIs para no incurrir en gastos de 24/7 en servidores.

## 🛠️ Stack Tecnológico

- **Frontend & Backend (API):** Next.js (App Router / TypeScript)
- **Base de Datos:** Supabase (PostgreSQL)
- **Inteligencia Artificial:** SDK de Google Generative AI
- **Notificaciones:** Telegram Bot API & Resend API
- **Infraestructura Sugerida:** Vercel (Hosting) + cron-job.org (Automatización)

---

## 🚀 Guía de Instalación y Despliegue

### 1. Variables de Entorno
Copia el archivo base (si lo tienes) o crea un `.env.local` en tu entorno local, y eventualmente cópialas exactas en el administrador de **Environment Variables de Vercel (Producción)**:

```env
# SEGURIDAD DEL DASHBOARD
ADMIN_PASSWORD="super-contraseña-para-mi-panel"

# TELEGRAM BOT (Para alertas push en tiempo real)
TELEGRAM_BOT_TOKEN="tu-token-obtenido-del-botfather"
MY_TELEGRAM_CHAT_ID="tu-chat-id-numerico"

# GOOGLE GEMINI (Para análisis de errores)
GEMINI_API_KEY="tu-clave-de-google-ai-studio"

# SUPABASE (Base de datos PostgreSQL Serverless)
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu-secret-role-key-que-empieza-con-eyJ"

# RESEND (Para los emails mensuales automatizados)
RESEND_API_KEY="re_tu-clave-de-resend"
ADMIN_EMAIL="tu-email-de-informes@gmail.com"

# AUTENTICACIÓN AL API DEL AGENTE (Lo que le envías desde el cron)
CRON_SECRET="mi_secreto_super_largo_y_dificil"
```

### 2. Base de Datos (Supabase)
Dentro del panel de Supabase de tu proyecto, dirígete al **SQL Editor**, copia y ejecuta el contenido completo del archivo `supabase/schema.sql`. Esto creará automáticamente las tablas protegidas `sites` y `checks`.

### 3. Vercel & Automatización
Una vez que el proyecto esté subido a Vercel con sus variables asignadas:
1. Crea una cuenta gratuita en [cron-job.org](https://cron-job.org).
2. Crea un nuevo cron configurado para ejecutarse **Cada 5 Minutos**.
3. En la URL pon la ruta de tu API con el parámetro secreto:  
   `https://[tu-sitio-de-vercel]/api/cron?secret=mi_secreto_super_largo_y_dificil`
4. ¡Guarda el trabajo y el agente cobrará vida!

---

> Despliegue, estructura y base de código adaptada con cariño por M4lcom y Antigravity.

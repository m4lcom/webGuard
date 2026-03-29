# 🛡️ Cloud WebGuard Agent

A modern, serverless, and automated uptime monitoring agent. It continuously monitors your websites' health, diagnoses downtime reasons using Artificial Intelligence (Google Gemini), and instantly notifies you directly on your phone via Telegram.

It also features a private Dashboard and historical metrics panel, fully integrated and ready to be deployed to the cloud.

---

## ✨ Key Features

- **⏰ Continuous Monitoring (Cron):** Audits HTTP status and calculates response time (ping) of specified URLs.
- **🤖 AI Diagnostics:** Upon detecting downtime, the agent queries `gemini-1.5-flash` to analyze probable causes for the HTTP error code and explain what happened.
- **📲 Real-time Alerts:** Communicates immediately with you through a Telegram Bot.
- **📊 Interactive Dashboard:** Web-based admin panel (password protected) with a *glassmorphism* design to manage monitored platforms and visualize recent performance charts.
- **📧 Monthly SLA Reports:** Automated background reporting system (via Resend) that emails you global Uptime statistics on the 1st day of every month.
- **🌩️ Serverless & Edge:** Fully optimized to run on serverless environments like Vercel, consuming external APIs to avoid 24/7 server hosting costs.

## 🛠️ Technology Stack

- **Frontend & Backend (API):** Next.js (App Router / TypeScript)
- **Database:** Supabase (PostgreSQL)
- **Artificial Intelligence:** Google Generative AI SDK
- **Notifications:** Telegram Bot API & Resend API
- **Suggested Infrastructure:** Vercel (Hosting) + cron-job.org (Automation)

---

## 🚀 Installation & Deployment Guide

### 1. Environment Variables
Create a `.env.local` in your local environment, and match these exactly in **Vercel's Environment Variables (Production)**:

```env
# DASHBOARD SECURITY
ADMIN_PASSWORD="super-secure-dashboard-password"

# TELEGRAM BOT (For real-time push alerts)
TELEGRAM_BOT_TOKEN="your-botfather-token"
MY_TELEGRAM_CHAT_ID="your-numeric-chat-id"

# GOOGLE GEMINI (For error analysis)
GEMINI_API_KEY="your-google-ai-studio-key"

# SUPABASE (Serverless PostgreSQL database)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-secret-role-key-starting-with-eyJ"

# RESEND (For automated monthly emails)
RESEND_API_KEY="re_your-resend-key"
ADMIN_EMAIL="your-monitoring-report-email@gmail.com"

# AGENT API AUTHENTICATION (Sent from your cron job)
CRON_SECRET="my_super_long_and_hard_secret_key"
```

### 2. Database (Supabase)
Inside your Supabase project panel, go to the **SQL Editor**, copy and execute the entire contents of the `supabase/schema.sql` file. This will automatically create the secure `sites` and `checks` tables.

### 3. Vercel & Automation
Once the project is deployed to Vercel with its assigned variables:
1. Create a free account at [cron-job.org](https://cron-job.org).
2. Create a new cron job configured to run **Every 5 Minutes**.
3. For the URL, place your API route with the secret parameter:  
   `https://[your-vercel-site.app]/api/cron?secret=my_super_long_and_hard_secret_key`
4. Save the job and the agent will come to life!

---

> Deployment, structure, and codebase lovingly tailored by M4lcom and Antigravity.

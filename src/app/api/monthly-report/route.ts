import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const contextUrl = new URL(request.url);
  const secretQuery = contextUrl.searchParams.get('secret');

  const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader !== expectedHeader && secretQuery !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!resendApiKey || !adminEmail) {
    console.error('RESEND_API_KEY y ADMIN_EMAIL son requeridos.');
    return NextResponse.json({ error: 'Config missing' }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  // Obtener fecha hace 30 días
  const pastMonth = new Date();
  pastMonth.setMonth(pastMonth.getMonth() - 1);

  // Traer sitios
  const { data: sites } = await supabase.from('sites').select('id, name, url');
  if (!sites) return NextResponse.json({ error: 'No sites found' }, { status: 404 });

  let reportHtml = `<h2>Reporte Mensual de WebGuard (${new Date().toLocaleDateString()})</h2>`;
  reportHtml += `<p>Resumen de disponibilidad de los últimos 30 días:</p>`;
  reportHtml += `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr style="background: #f3f4f6;">
      <th>Sitio</th>
      <th>Uptime (%)</th>
      <th>Promedio de Carga (ms)</th>
    </tr>`;

  for (const site of sites) {
    const { data: checks } = await supabase
      .from('checks')
      .select('status, response_time_ms')
      .eq('site_id', site.id)
      .gte('created_at', pastMonth.toISOString());

    if (!checks || checks.length === 0) {
      reportHtml += `<tr><td>${site.name}</td><td colspan="2">Sin datos suficientes</td></tr>`;
      continue;
    }

    const upChecks = checks.filter(c => c.status === 'UP').length;
    const uptimePercent = ((upChecks / checks.length) * 100).toFixed(2);
    
    // Promedio de tiempo de respuesta solo cuando está UP
    const upChecksData = checks.filter(c => c.status === 'UP');
    const avgResponseTime = upChecksData.length > 0 
      ? Math.round(upChecksData.reduce((acc, c) => acc + c.response_time_ms, 0) / upChecksData.length)
      : 0;

    reportHtml += `
      <tr>
        <td><strong>${site.name}</strong><br><small>${site.url}</small></td>
        <td style="color: ${Number(uptimePercent) > 99 ? 'green' : 'red'};">${uptimePercent}%</td>
        <td>${avgResponseTime} ms</td>
      </tr>
    `;
  }

  reportHtml += `</table><br><p>Monitoreo automático generado por WebGuard en Vercel.</p>`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'WebGuard <onboarding@resend.dev>', // Usar tu dominio verificado si lo tienes
      to: [adminEmail],
      subject: `Resumen de Monitorización WebGuard - ${new Date().toLocaleDateString()}`,
      html: reportHtml,
    });

    if (error) {
      console.error('Error enviando correo Resend:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Report delivered', id: data?.id });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

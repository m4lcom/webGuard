import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('webguard_session', password, { 
      httpOnly: true, 
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    return response;
  }

  return NextResponse.json({ error: 'Contraseña inválida' }, { status: 401 });
}

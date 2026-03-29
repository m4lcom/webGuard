import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: sites, error } = await supabase.from('sites').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(sites);
}

export async function POST(request: Request) {
  try {
    const { name, url } = await request.json();
    
    if (!name || !url) return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });

    const { data, error } = await supabase
      .from('sites')
      .insert([{ name, url }])
      .select()
      .single();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

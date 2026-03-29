import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // get checks for the last 24h
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  
  const { data, error } = await supabase
    .from('checks')
    .select('created_at, response_time_ms, status')
    .eq('site_id', id)
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data);
}

-- Habilitar extensión para UUIDs (Supabase ya suele tenerla habilitada, pero por si acaso)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla principal de Sitios Web
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'UP',
  last_checked TIMESTAMP WITH TIME ZONE
);

-- Tabla de historial (Métricas de Tiempos de Carga y Disponibilidad)
CREATE TABLE checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS (Row Level Security) para mayor seguridad si la API de Supabase se usara desde el frontend.
-- En este caso usamos Supabase vía servidor de Next.js, por lo que las políticas pueden ser permisivas 
-- o usar la "Service Role Key" directamente en lugar de la "Anon Key".
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;

-- Política sencilla: Solo usuarios autenticados o Service Role Key tienen acceso.
CREATE POLICY "Enable all for authenticated users only" ON sites FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users only" ON checks FOR ALL USING (auth.role() = 'authenticated');

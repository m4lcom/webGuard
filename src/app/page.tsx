'use client';
import { useState, useEffect } from 'react';
import './dashboard.css';

interface Site {
  id: string;
  name: string;
  url: string;
  status: 'UP' | 'DOWN';
  last_checked: string;
}

interface Check {
  response_time_ms: number;
  created_at: string;
  status: string;
}

function SiteCard({ site, onDelete }: { site: Site, onDelete: (id: string) => void }) {
  const [history, setHistory] = useState<Check[]>([]);

  useEffect(() => {
    // Cargar historial solo cuando hay un chequeo válido
    if (site.id) {
      fetch(`/api/history/${site.id}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setHistory(data);
        })
        .catch(console.error);
    }
  }, [site.id, site.last_checked]);

  const latestPing = history[history.length - 1];
  const validPings = history.filter(h => h.status === 'UP');
  const avgPing = validPings.length > 0 
    ? Math.round(validPings.reduce((acc, curr) => acc + curr.response_time_ms, 0) / validPings.length) 
    : 0;

  return (
    <div className="site-card">
      <div className="site-info">
        <h3>{site.name}</h3>
        <a href={site.url} target="_blank" rel="noreferrer">{site.url}</a>
      </div>

      <div className="ping-stats">
        <div className="stat-box">
          <span className="stat-label">Promedio 24h</span>
          <span className="stat-value">{avgPing > 0 ? `${avgPing} ms` : 'N/A'}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Última Carga</span>
          <span className="stat-value">{latestPing ? `${latestPing.response_time_ms} ms` : 'N/A'}</span>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="ping-chart-container">
          <div className="ping-chart">
            {history.slice(-30).map((h, i) => {
              // Altura visual relativa (máximo 2000ms = 100%)
              const heightPercent = Math.max(10, Math.min(100, (h.response_time_ms / 2000) * 100));
              return (
                <div 
                  key={i} 
                  className={`ping-bar ${h.status.toLowerCase()}`} 
                  style={{ height: `${heightPercent}%` }} 
                  title={`${h.response_time_ms}ms - ${new Date(h.created_at).toLocaleTimeString()}`}
                ></div>
              );
            })}
          </div>
          <span className="chart-label">Últimas cargas (30)</span>
        </div>
      ) : (
        <div className="empty-chart">Esperando al primer chequeo (Cron)...</div>
      )}

      <div className="site-metrics">
        <div className={`status-badge ${site.status?.toLowerCase() || 'down'}`}>
          {site.status === 'UP' ? '✅ En línea' : (site.status === 'DOWN' ? '❌ Caído' : '⏳ Pendiente')}
        </div>
        <div className="meta">
          {site.last_checked ? new Date(site.last_checked).toLocaleTimeString() : 'Sin chequeos'}
        </div>
        <button onClick={() => onDelete(site.id)} className="btn-danger-sm">Eliminar</button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSite, setNewSite] = useState({ name: '', url: '' });

  const loadSites = async () => {
    const res = await fetch('/api/sites');
    if (res.ok) {
      setSites(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSites();
    const interval = setInterval(loadSites, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSite),
    });
    
    if (res.ok) {
      setNewSite({ name: '', url: '' });
      loadSites();
    } else {
      const data = await res.json().catch(() => ({}));
      alert('Error al añadir sitio: ' + (data.error || 'Error desconocido.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este sitio web del monitoreo?')) return;
    const res = await fetch(`/api/sites/${id}`, { method: 'DELETE' });
    if (res.ok) loadSites();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel">
        <div>
          <h1>🛡️ WebGuard</h1>
          <p>Métricas de Rendimiento y Disponibilidad</p>
        </div>
        <div className="header-status">
          <span className="live-badge">Live Monitor</span>
        </div>
      </header>

      <div className="grid">
        <aside className="sidebar">
          <form className="glass-panel add-site-form" onSubmit={handleAddSite}>
            <h3>Añadir Sitio</h3>
            <div className="input-group">
              <label>Nombre del Cliente</label>
              <input 
                placeholder="Ej. Tienda Online" 
                value={newSite.name}
                onChange={e => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="input-group">
              <label>URL (incluir https://)</label>
              <input 
                type="url"
                placeholder="https://ejemplo.com"
                value={newSite.url}
                onChange={e => setNewSite(prev => ({ ...prev, url: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn-primary">Registrar Monitor</button>
          </form>
        </aside>

        <main className="content glass-panel">
          <div className="content-header">
            <h2>Sitios Monitoreados ({sites.length})</h2>
            <button className="btn-secondary" onClick={loadSites}>↻ Actualizar</button>
          </div>

          {loading && sites.length === 0 ? (
            <div className="loading">Cargando métricas...</div>
          ) : sites.length === 0 ? (
            <div className="loading">Añade tu primer sitio web a la izquierda para comenzar el monitoreo.</div>
          ) : (
            <div className="sites-grid">
              {sites.map(site => (
                <SiteCard key={site.id} site={site} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

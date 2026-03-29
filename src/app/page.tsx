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

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSite, setNewSite] = useState({ name: '', url: '' });

  const loadSites = async () => {
    setLoading(true);
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
          <p>Service Status & Metrics Dashboard</p>
        </div>
        <div className="header-status">
          <span className="live-badge">Live</span>
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
          ) : (
            <div className="sites-grid">
              {sites.map(site => (
                <div key={site.id} className="site-card">
                  <div className="site-info">
                    <h3>{site.name}</h3>
                    <a href={site.url} target="_blank" rel="noreferrer">{site.url}</a>
                  </div>
                  <div className="site-metrics">
                    <div className={`status-badge ${site.status.toLowerCase()}`}>
                      {site.status === 'UP' ? '✅ En línea' : '❌ Caído'}
                    </div>
                    <div className="meta">
                      Ult. Chequeo: {site.last_checked ? new Date(site.last_checked).toLocaleTimeString() : 'N/A'}
                    </div>
                    <button onClick={() => handleDelete(site.id)} className="btn-danger-sm">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/');
    } else {
      setError('Contraseña incorrecta o denegado.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="glass-panel login-form">
        <h1 className="login-title">🛡️ WebGuard</h1>
        <p className="login-subtitle">Panel de Control</p>
        
        {error && <div className="error-box">{error}</div>}
        
        <input 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Contraseña Maestra" 
          required
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Acceder Seguro'}
        </button>
      </form>
    </div>
  );
}

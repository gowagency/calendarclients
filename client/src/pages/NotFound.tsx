import { Link } from 'wouter';
import { CalendarDays } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', color: 'var(--text-primary)',
      fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '12px', background: 'var(--bg-elevated)',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <CalendarDays size={20} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <h1 style={{ fontFamily: 'DM Sans, system-ui', fontSize: '3rem', fontWeight: 300, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
        404
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Página não encontrada
      </p>
      <Link href="/">
        <button style={{
          padding: '0.65rem 1.5rem', background: 'var(--text-primary)', color: 'var(--bg)',
          border: 'none', borderRadius: '10px', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.875rem',
        }}>
          Voltar ao início
        </button>
      </Link>
    </div>
  );
}

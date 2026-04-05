import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Search, TrendingUp,
  CalendarDays, CheckCircle2, Clock3,
  Sun, Moon, LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useTheme } from '@/contexts/ThemeContext';
import type { Post, ClientSlug } from '../../../drizzle/schema';
import PostSheet from '@/components/PostSheet';
import {
  NETWORKS, ACTIVE_NETWORKS, NETWORK_CONFIG, STATUS_CONFIG, STATUS_ORDER,
  FORMAT_OPTIONS, DIAS_SEMANA, FERIADOS_BR, formatDateKey, getFormatColor, PILARES,
} from '@/lib/config';
import { EditorialPage, PosicionamentoPage } from './EditorialPage';
import RichTextEditor from '@/components/RichTextEditor';

type PageView = 'calendario' | 'editorial' | 'posicionamento';

const CLIENT_LABELS: Record<ClientSlug, string> = {
  alinyrayze: 'Aliny Rayze',
  juniorlopes: 'Junior Lopes',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View = 'calendario' | 'agendados' | 'postados' | 'em_andamento';
type NetworkId = typeof NETWORKS[number]['id'];

// ─── NEW POST MODAL ────────────────────────────────────────────────────────────

function NewPostModal({
  onClose,
  onSave,
  isPending = false,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending?: boolean;
}) {
  const [form, setForm] = useState({
    socialNetwork: 'instagram' as NonNullable<Post['socialNetwork']>,
    titulo: '',
    formato: 'Post',
    conteudo: '',
    legenda: '',
    status: 'nao_iniciado' as NonNullable<Post['status']>,
    responsavel: '',
    scheduledDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) { toast.error('Título obrigatório'); return; }
    onSave({
      ...form,
      scheduledDate: form.scheduledDate
        ? new Date(form.scheduledDate + 'T12:00:00').getTime()
        : undefined,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      />
      <motion.form
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        onSubmit={handleSubmit}
        style={{
          position: 'relative', zIndex: 1, background: 'var(--bg)',
          borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '480px',
          border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}
      >
        <h3 style={{ fontFamily: 'DM Sans, system-ui', fontSize: '1.25rem', fontWeight: 400, color: 'var(--text-primary)' }}>
          Novo post
        </h3>

        {/* Network */}
        <div>
          <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Rede social</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {ACTIVE_NETWORKS.filter(n => n.id !== 'all').map(n => {
              const selected = form.socialNetwork === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    socialNetwork: n.id as NonNullable<Post['socialNetwork']>,
                    formato: FORMAT_OPTIONS[n.id][0],
                  }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.35rem 0.7rem', borderRadius: '20px', cursor: 'pointer',
                    border: selected ? `1.5px solid ${n.color}` : '1px solid var(--border)',
                    background: selected ? `${n.color}14` : 'var(--bg-elevated)',
                    color: selected ? n.color : 'var(--text-secondary)',
                    fontSize: '0.8rem', fontWeight: selected ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {'Icon' in n && <n.Icon size={13} />}
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Título *</span>
          <input
            type="text"
            placeholder="Título do post"
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            autoFocus
            style={{ width: '100%', fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Formato */}
          <div style={{ flex: 1 }}>
            <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Formato</span>
            <select
              value={form.formato}
              onChange={e => setForm(f => ({ ...f, formato: e.target.value }))}
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              {(FORMAT_OPTIONS[form.socialNetwork] || ['Post']).map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div style={{ flex: 1 }}>
            <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Status</span>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Responsável */}
          <div style={{ flex: 1 }}>
            <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Responsável</span>
            <input
              type="text"
              placeholder="Nome"
              value={form.responsavel}
              onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Data agendada */}
          <div style={{ flex: 1 }}>
            <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Data agendada</span>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div>
          <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Copy (opcional)</span>
          <textarea
            rows={2}
            placeholder="Escreva o copy do post..."
            value={form.conteudo}
            onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
            style={{ width: '100%', fontSize: '0.85rem', resize: 'none' }}
          />
        </div>

        {/* Legenda */}
        <div>
          <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Legenda</span>
          <textarea
            rows={2}
            placeholder="Legenda do post..."
            value={form.legenda}
            onChange={e => setForm(f => ({ ...f, legenda: e.target.value }))}
            style={{ width: '100%', fontSize: '0.85rem', resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '0.65rem', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '0.875rem',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            style={{
              flex: 2, padding: '0.65rem', background: 'var(--text-primary)',
              color: 'var(--bg)', border: 'none', borderRadius: '10px', cursor: isPending ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: '0.875rem', opacity: isPending ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {isPending ? 'Salvando…' : 'Criar post'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const sc = STATUS_CONFIG[post.status];
  const network = NETWORK_CONFIG[post.socialNetwork];
  const fc = getFormatColor(post.formato, post.socialNetwork);
  const pilar = PILARES.find(p => p.id === (post as any).pilar);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      onClick={onClick}
      style={{
        textAlign: 'left', width: '100%', cursor: 'pointer',
        background: 'var(--bg-elevated)', borderRadius: '12px',
        border: '1px solid var(--border)',
        overflow: 'hidden', display: 'flex',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* ── Left color accent (structural div, always visible) ── */}
      <div style={{ width: 4, flexShrink: 0, background: fc.color, borderRadius: '12px 0 0 12px' }} />

      {/* ── Card content ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Cover image */}
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt=""
            style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        <div style={{ padding: '0.7rem 0.85rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Format label */}
            <div style={{ marginBottom: '0.2rem' }}>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: fc.color,
              }}>
                {network?.Icon && <network.Icon size={8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />}
                {post.formato}
              </span>
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: 'DM Sans, system-ui', fontSize: '0.85rem', fontWeight: 500,
              color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.3rem',
              overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {post.titulo}
            </h3>

            {/* Pilar tag + date */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
              {pilar && (
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: pilar.color, background: `${pilar.color}15`, border: `1px solid ${pilar.color}30`,
                  padding: '0.1rem 0.45rem', borderRadius: '20px', whiteSpace: 'nowrap',
                }}>
                  {pilar.label}
                </span>
              )}
              {post.scheduledDate && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  {new Date(post.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '0.62rem', fontWeight: 600, color: sc.color,
            background: sc.bg, padding: '0.18rem 0.5rem', borderRadius: '20px',
            border: `1px solid ${sc.color}30`, flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {sc.icon} <span className="hidden sm:inline">{sc.label}</span>
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────

function getMonthWeekdayGrid(year: number, month: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [null, null, null, null, null];
  let hasContent = false;
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const col = dow - 1;
    week[col] = d;
    hasContent = true;
    if (dow === 5 || day === totalDays) {
      if (hasContent) { weeks.push([...week]); week = [null, null, null, null, null]; hasContent = false; }
    }
  }
  return weeks;
}

function CalendarView({ posts, onSelectPost, onNewPost, updatePost, search, onSearchChange }: { posts: Post[]; onSelectPost: (p: Post) => void; onNewPost: () => void; updatePost: any; search: string; onSearchChange: (v: string) => void; }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthGrid = useMemo(() => getMonthWeekdayGrid(year, month), [year, month]);

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthLabel = `${monthNames[month]} ${year}`;

  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {};
    posts.forEach(p => {
      if (p.scheduledDate) {
        const key = formatDateKey(new Date(p.scheduledDate));
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [posts]);

  const unscheduled = useMemo(() => posts.filter(p => !p.scheduledDate), [posts]);
  const navMonth = (dir: number) => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + dir); setCurrentMonth(d); };
  const todayKey = formatDateKey(new Date());

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* Left: month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => navMonth(-1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'DM Sans, system-ui', minWidth: '140px', textAlign: 'center' }}>{monthLabel}</span>
          <button onClick={() => navMonth(1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><ChevronRight size={16} /></button>
        </div>
        {/* Center: search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 120px', maxWidth: '260px', minWidth: '80px' }}>
          <Search size={13} style={{ position: 'absolute', left: '0.6rem', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar posts..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            style={{ width: '100%', paddingLeft: '1.85rem', paddingRight: '0.75rem', fontSize: '0.82rem' }}
          />
        </div>
        {/* Right: actions */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => setCurrentMonth(new Date())} style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Hoje</button>
          <button onClick={onNewPost} style={{ padding: '0.4rem 0.75rem', background: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--bg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Plus size={14} /> Novo</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', marginBottom: '0.3rem' }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '0.3rem 0' }}>{d}</div>
        ))}
      </div>

      {/* Month grid */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '700px' }}>
          {monthGrid.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
              {week.map((day, di) => {
                if (!day) return (
                  <div key={di} style={{ minHeight: '90px', borderRadius: '10px', background: 'var(--bg-secondary)', opacity: 0.3, border: '1px solid var(--border)' }} />
                );
                const key = formatDateKey(day);
                const dayPosts = postsByDate[key] || [];
                const feriado = FERIADOS_BR[key];
                const isToday = key === todayKey;
                return (
                  <div key={key} style={{ background: 'var(--bg-elevated)', border: isToday ? '2px solid #5c7aff' : '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.6rem', minHeight: '90px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: isToday ? 700 : 400, color: isToday ? '#5c7aff' : 'var(--text-secondary)', fontFamily: 'DM Sans, system-ui' }}>{day.getDate()}</span>
                    </div>
                    {feriado && (
                      <div style={{ fontSize: '0.55rem', color: '#e5a00d', background: 'rgba(229,160,13,0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px', marginBottom: '0.25rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{feriado}</div>
                    )}
                    {dayPosts.map(p => {
                      const fc = getFormatColor(p.formato, p.socialNetwork);
                      const sc = STATUS_CONFIG[p.status];
                      const pilarTag = PILARES.find(pl => pl.id === (p as any).pilar);
                      return (
                        <button key={p.id} onClick={() => onSelectPost(p)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: fc.bg, border: `1px solid ${fc.border}`, borderRadius: '6px', padding: '0 0.4rem 0.3rem 0', marginBottom: '0.25rem', display: 'flex', overflow: 'hidden' }}>
                          {/* color accent bar */}
                          <div style={{ width: 4, flexShrink: 0, background: fc.color, borderRadius: '6px 0 0 6px', alignSelf: 'stretch', minHeight: '100%' }} />
                          <div style={{ flex: 1, minWidth: 0, paddingLeft: '0.35rem', paddingTop: '0.3rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: fc.color, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>{p.formato}</span>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-primary)', lineHeight: 1.2, fontWeight: 500 }}>{p.titulo.length > 30 ? p.titulo.slice(0, 30) + '…' : p.titulo}</div>
                            <div style={{ marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                              {pilarTag && <span style={{ fontSize: '0.52rem', fontWeight: 700, color: pilarTag.color, background: `${pilarTag.color}15`, border: `1px solid ${pilarTag.color}30`, padding: '0.05rem 0.3rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>{pilarTag.label}</span>}
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.55rem', color: sc.color }}>{sc.icon} <span>{sc.label}</span></span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {dayPosts.length === 0 && !feriado && (
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>—</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Clock3 size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Aguardando agendamento ({unscheduled.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem' }}>
            {unscheduled.map(p => (
              <div key={p.id} style={{ position: 'relative' }}>
                <PostCard post={p} onClick={() => onSelectPost(p)} />
                <div style={{ marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem', paddingLeft: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Agendar:</span>
                  <input type="date" onClick={e => e.stopPropagation()} onChange={e => { if (e.target.value) { updatePost.mutate({ id: p.id, scheduledDate: new Date(e.target.value + 'T12:00:00').getTime() }); toast.success('Post agendado'); } }} style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', flex: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QUICK BLOCK ──────────────────────────────────────────────────────────────

type ProdStatus = 'nao_iniciado' | 'em_andamento' | 'em_aprovacao' | 'aprovado' | 'em_gravacao' | 'gravado' | 'postado';
type ProdType   = 'reels' | 'narracao' | 'carrossel';

type ProdTask = {
  id: string;
  type: ProdType;
  title: string;
  status: ProdStatus;
  dueDate: string;   // 'YYYY-MM-DD'
  obs: string;
  canvaUrl: string;
  createdAt: number;
};

// Pill style — paleta Aliny Rayze: terrosos, sage, camel
const PROD_STATUS_CONFIG: Record<ProdStatus, { label: string; bg: string; border: string; color: string }> = {
  nao_iniciado: { label: 'Não iniciado', bg: 'rgba(139,129,119,0.10)', border: 'rgba(139,129,119,0.25)', color: '#8B8177' }, // taupe
  em_andamento: { label: 'Em andamento', bg: 'rgba(160,120,72,0.12)',  border: 'rgba(160,120,72,0.28)',  color: '#A07848' }, // camel
  em_aprovacao: { label: 'Em aprovação', bg: 'rgba(164,115,94,0.12)',  border: 'rgba(164,115,94,0.28)',  color: '#A4735E' }, // terracotta
  aprovado:     { label: 'Aprovado',     bg: 'rgba(107,138,110,0.12)', border: 'rgba(107,138,110,0.28)', color: '#6B8A6E' }, // sage green
  em_gravacao:  { label: 'Em Gravação',  bg: 'rgba(123,58,18,0.10)',   border: 'rgba(123,58,18,0.25)',   color: '#7B3A12' }, // chocolate
  gravado:      { label: 'Gravado',      bg: 'rgba(107,138,110,0.18)', border: 'rgba(107,138,110,0.36)', color: '#4E7052' }, // sage escuro
  postado:      { label: 'Postado',      bg: 'rgba(123,58,18,0.16)',   border: 'rgba(123,58,18,0.32)',   color: '#5C2B0A' }, // chocolate escuro
};

const PROD_STATUS_ORDER: ProdStatus[] = [
  'nao_iniciado', 'em_andamento', 'em_aprovacao', 'aprovado', 'em_gravacao', 'gravado', 'postado',
];

const PROD_TYPE_CONFIG: Record<ProdType, { label: string; color: string }> = {
  reels:     { label: 'Reels',     color: '#7B3A12' }, // chocolate — destaque
  narracao:  { label: 'Narração',  color: '#8B8177' }, // taupe neutro
  carrossel: { label: 'Carrossel', color: '#A07848' }, // camel bege
};

const EMPTY_TASK: Omit<ProdTask, 'id' | 'createdAt'> = {
  type: 'reels', title: '', status: 'nao_iniciado', dueDate: '', obs: '', canvaUrl: '',
};

function QuickBlock({ client }: { client: string }) {
  const lsKey = (t: string) => `gow_${client}_${t}`;
  const load  = <T,>(t: string, def: T): T => { try { return JSON.parse(localStorage.getItem(lsKey(t)) || '') } catch { return def; } };
  const save  = (t: string, v: any) => localStorage.setItem(lsKey(t), JSON.stringify(v));

  const [tasks,      setTasks]      = useState<ProdTask[]>(() => load('prodTasks', []));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding,     setAdding]     = useState(false);
  const [newTask,    setNewTask]     = useState({ ...EMPTY_TASK });

  const persist = (updated: ProdTask[]) => { setTasks(updated); save('prodTasks', updated); };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const t: ProdTask = { ...newTask, id: Date.now().toString(), createdAt: Date.now() };
    persist([...tasks, t]);
    setNewTask({ ...EMPTY_TASK });
    setAdding(false);
  };

  const updateTask = (id: string, field: keyof ProdTask, value: string) => {
    persist(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteTask = (id: string) => persist(tasks.filter(t => t.id !== id));

  // Sort: tasks without date at bottom, others by date asc
  const sorted = [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const fmtDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const isOverdue = (d: string, status: ProdStatus) => {
    if (!d || status === 'postado' || status === 'gravado') return false;
    return d < new Date().toISOString().slice(0, 10);
  };

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="label">Produção</span>
          {tasks.length > 0 && (
            <span style={{ fontSize: '0.65rem', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '0.1rem 0.45rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {tasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setAdding(a => !a); setNewTask({ ...EMPTY_TASK }); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: adding ? 'var(--bg-secondary)' : 'var(--text-primary)', color: adding ? 'var(--text-secondary)' : 'var(--bg)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }}
        >
          {adding ? '✕ Cancelar' : '+ Nova tarefa'}
        </button>
      </div>

      {/* ── ADD FORM ── */}
      {adding && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Title */}
          <input
            type="text"
            placeholder="Nome da tarefa..."
            value={newTask.title}
            onChange={e => setNewTask(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            autoFocus
            style={{ width: '100%', fontSize: '0.875rem' }}
          />
          {/* Status + Type selects + Date */}
          {(() => {
            const sv = PROD_STATUS_CONFIG[newTask.status];
            const tv = PROD_TYPE_CONFIG[newTask.type];
            return (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={newTask.status}
                  onChange={e => setNewTask(f => ({ ...f, status: e.target.value as ProdStatus }))}
                  style={{ fontSize: '0.78rem', fontWeight: 700, color: sv.color, background: sv.bg, border: `1px solid ${sv.border}`, borderRadius: '100px', padding: '4px 10px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', letterSpacing: '0.04em' }}
                >
                  {PROD_STATUS_ORDER.map(k => (
                    <option key={k} value={k}>{PROD_STATUS_CONFIG[k].label}</option>
                  ))}
                </select>
                <select
                  value={newTask.type}
                  onChange={e => setNewTask(f => ({ ...f, type: e.target.value as ProdType }))}
                  style={{ fontSize: '0.78rem', fontWeight: 700, color: tv.color, background: `${tv.color}15`, border: `1px solid ${tv.color}35`, borderRadius: '100px', padding: '4px 10px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', letterSpacing: '0.04em' }}
                >
                  {(Object.entries(PROD_TYPE_CONFIG) as [ProdType, { label: string; color: string }][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask(f => ({ ...f, dueDate: e.target.value }))}
                  style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                />
              </div>
            );
          })()}
          {/* Obs */}
          <textarea
            placeholder="Observação (opcional)..."
            value={newTask.obs}
            rows={1}
            onChange={e => { setNewTask(f => ({ ...f, obs: e.target.value })); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            style={{ width: '100%', fontSize: '0.82rem', resize: 'none', overflow: 'hidden', minHeight: '2.2rem' }}
          />
          {/* Canva link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Link Canva</span>
            <input
              type="url"
              placeholder="https://www.canva.com/..."
              value={newTask.canvaUrl}
              onChange={e => setNewTask(f => ({ ...f, canvaUrl: e.target.value }))}
              style={{ flex: 1, fontSize: '0.8rem' }}
            />
            {newTask.canvaUrl && (
              <a href={newTask.canvaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#7C5CBF', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', padding: '0.2rem 0.6rem', border: '1px solid rgba(124,92,191,0.3)', borderRadius: '6px', background: 'rgba(124,92,191,0.08)' }}>
                Abrir ↗
              </a>
            )}
          </div>
          {/* Save */}
          <button onClick={addTask} style={{ alignSelf: 'flex-end', padding: '0.45rem 1.25rem', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            Adicionar
          </button>
        </div>
      )}

      {/* ── TASK LIST ── */}
      {sorted.length === 0 && !adding && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0' }}>
          Nenhuma tarefa. Clique em "+ Nova tarefa" para começar.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {sorted.map(task => {
          const sc   = PROD_STATUS_CONFIG[task.status];
          const tc   = PROD_TYPE_CONFIG[task.type];
          const open = expandedId === task.id;
          const over = isOverdue(task.dueDate, task.status);

          return (
            <div
              key={task.id}
              style={{
                background: open ? sc.bg : `${sc.color}08`,
                border: `1.5px solid ${open ? sc.border : sc.border}`,
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.15s',
              }}
            >
              {/* Card row */}
              <div
                onClick={() => setExpandedId(open ? null : task.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
              >
                {/* Left: colored status bar accent */}
                <div style={{ width: 3, height: 36, borderRadius: 4, background: sc.color, flexShrink: 0, opacity: 0.8 }} />

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Top row: date + title */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
                      color: over ? '#D85A30' : sc.color,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {task.dueDate ? (over ? '⚠ ' : '') + fmtDate(task.dueDate) : '—'}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontWeight: 400 }}>Sem título</span>}
                    </span>
                  </div>
                  {/* Bottom row: status select + type select (styled as pills) + canva badge */}
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={task.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateTask(task.id, 'status', e.target.value); }}
                      style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '2px 9px', borderRadius: '100px', border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      {PROD_STATUS_ORDER.map(k => (
                        <option key={k} value={k}>{PROD_STATUS_CONFIG[k].label}</option>
                      ))}
                    </select>
                    <select
                      value={task.type}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateTask(task.id, 'type', e.target.value); }}
                      style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '100px', border: `1px solid ${tc.color}35`, background: `${tc.color}15`, color: tc.color, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      {(Object.entries(PROD_TYPE_CONFIG) as [ProdType, { label: string; color: string }][]).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    {task.canvaUrl && (
                      <a
                        href={task.canvaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', fontWeight: 600, letterSpacing: '0.04em', background: 'rgba(124,92,191,0.10)', border: '1px solid rgba(124,92,191,0.28)', color: '#7C5CBF', textDecoration: 'none' }}
                      >
                        Canva ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <span style={{ color: sc.color, fontSize: '0.6rem', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.7 }}>▼</span>
              </div>

              {/* Expanded editing */}
              {open && (
                <div style={{ padding: '0 0.85rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--border)' }}>
                  {/* Title + Date row */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.65rem' }}>
                    <input type="text" value={task.title} onChange={e => updateTask(task.id, 'title', e.target.value)} style={{ flex: 1, fontSize: '0.875rem' }} />
                    <input type="date" value={task.dueDate} onChange={e => updateTask(task.id, 'dueDate', e.target.value)} style={{ fontSize: '0.78rem', padding: '0.2rem 0.45rem', flexShrink: 0 }} />
                  </div>

                  {/* Obs */}
                  <textarea
                    placeholder="Observação..."
                    value={task.obs}
                    rows={1}
                    ref={el => {
                      if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                    }}
                    onChange={e => { updateTask(task.id, 'obs', e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    style={{ width: '100%', fontSize: '0.82rem', resize: 'none', overflow: 'hidden', minHeight: '2.2rem' }}
                  />

                  {/* Canva link */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Link Canva</span>
                    <input
                      type="url"
                      placeholder="https://www.canva.com/..."
                      value={task.canvaUrl || ''}
                      onChange={e => updateTask(task.id, 'canvaUrl', e.target.value)}
                      style={{ flex: 1, fontSize: '0.8rem' }}
                    />
                    {task.canvaUrl && (
                      <a href={task.canvaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#7C5CBF', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', padding: '0.2rem 0.6rem', border: '1px solid rgba(124,92,191,0.3)', borderRadius: '6px', background: 'rgba(124,92,191,0.08)' }}>
                        Abrir ↗
                      </a>
                    )}
                  </div>

                  {/* Delete */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => deleteTask(task.id)} style={{ padding: '0.3rem 0.75rem', background: 'none', border: '1px solid rgba(216,90,48,0.3)', borderRadius: '7px', cursor: 'pointer', fontSize: '0.75rem', color: '#D85A30', fontWeight: 500 }}>
                      Remover tarefa
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Home({ client }: { client: ClientSlug }) {
  const { theme, toggleTheme } = useTheme();
  const [pageView, setPageView] = useState<PageView>('calendario');
  const [activeView, setActiveView] = useState<View>('calendario');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [search, setSearch] = useState('');
  const [progressMonth, setProgressMonth] = useState(() => new Date());

  const utils = trpc.useUtils();
  const postsQuery = trpc.posts.list.useQuery({ client });
  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => { utils.posts.invalidate(); toast.success('Post criado'); setShowNewPost(false); },
    onError: (err) => toast.error(`Erro ao criar post: ${err.message}`),
  });
  const updatePost = trpc.posts.update.useMutation({
    onSuccess: () => utils.posts.invalidate(),
  });

  const allPosts: Post[] = (postsQuery.data as Post[]) || [];

  // Keep selectedPost in sync with fresh data (e.g. after cover upload)
  useEffect(() => {
    if (selectedPost && allPosts.length > 0) {
      const fresh = allPosts.find(p => p.id === selectedPost.id);
      if (fresh && fresh.coverImageUrl !== selectedPost.coverImageUrl) {
        setSelectedPost(fresh);
      }
    }
  }, [allPosts]);

  // Filter by network
  const networkPosts = useMemo(() => {
    if (selectedNetwork === 'all') return allPosts;
    return allPosts.filter(p => p.socialNetwork === selectedNetwork);
  }, [allPosts, selectedNetwork]);

  // Filter by search
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return networkPosts;
    const q = search.toLowerCase();
    return networkPosts.filter(p =>
      p.titulo.toLowerCase().includes(q) ||
      p.formato.toLowerCase().includes(q) ||
      (p.conteudo || '').toLowerCase().includes(q)
    );
  }, [networkPosts, search]);

  // Stats
  const stats = useMemo(() => {
    const base = { total: networkPosts.length, postado: 0, agendado: 0, em_andamento: 0, em_aprovacao: 0, nao_iniciado: 0 };
    networkPosts.forEach(p => {
      if (p.status === 'postado') base.postado++;
      else if (p.scheduledDate && (p.status === 'aprovado' || p.status === 'nao_iniciado' || p.status === 'em_andamento')) base.agendado++;
      if (p.status === 'em_andamento') base.em_andamento++;
      if (p.status === 'em_aprovacao') base.em_aprovacao++;
      if (p.status === 'nao_iniciado') base.nao_iniciado++;
    });
    return base;
  }, [networkPosts]);

  // Views split
  const postados     = useMemo(() => filteredPosts.filter(p => p.status === 'postado').sort((a, b) => (b.scheduledDate || 0) - (a.scheduledDate || 0)), [filteredPosts]);
  const agendados    = useMemo(() => filteredPosts.filter(p => p.scheduledDate && p.status !== 'postado').sort((a, b) => (a.scheduledDate || 0) - (b.scheduledDate || 0)), [filteredPosts]);
  const emAndamento  = useMemo(() => filteredPosts.filter(p => p.status === 'em_andamento' || p.status === 'em_aprovacao').sort((a, b) => (a.scheduledDate || 0) - (b.scheduledDate || 0)), [filteredPosts]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ═══ HEADER ═══ */}
      <header style={{
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          padding: '0 1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          height: '56px',
          minWidth: 0,
        }}>
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '9px',
              background: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CalendarDays size={16} style={{ color: 'var(--bg)' }} />
            </div>
            <div>
              <span style={{ fontFamily: 'DM Sans, system-ui', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>
                {CLIENT_LABELS[client]}
              </span>
              <span className="label" style={{ display: 'block', fontSize: '0.52rem', letterSpacing: '0.1em' }}>
                Gow Agency
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0, margin: '0 0.25rem' }} />

          {/* Page tabs — inline in header */}
          <nav style={{ display: 'flex', alignItems: 'stretch', gap: 0, flex: 1, height: '100%', overflowX: 'auto' }}>
            {([
              { id: 'calendario'     as const, label: 'Calendário'     },
              { id: 'editorial'      as const, label: 'Linha Editorial' },
              { id: 'posicionamento' as const, label: 'Posicionamento'  },
            ] satisfies { id: PageView; label: string }[]).map(p => (
              <button
                key={p.id}
                onClick={() => setPageView(p.id)}
                style={{
                  padding: '0 0.85rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: pageView === p.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: pageView === p.id ? 600 : 400,
                  color: pageView === p.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.label}
              </button>
            ))}
          </nav>

          {/* Theme toggle — far right */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.4rem', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', flexShrink: 0,
            }}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.75rem 1rem', overflowX: 'hidden' }}>

        {pageView === 'calendario' && (
          <>

        {/* ═══ NETWORK SELECTOR ═══ */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {ACTIVE_NETWORKS.map(n => {
            const active = selectedNetwork === n.id;
            const color = n.id === 'all' ? 'var(--text-secondary)' : n.color;
            return (
              <button
                key={n.id}
                onClick={() => setSelectedNetwork(n.id as NetworkId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 0.9rem', borderRadius: '20px', cursor: 'pointer',
                  border: active ? `1.5px solid ${color}` : '1px solid var(--border)',
                  background: active ? `${n.id === 'all' ? 'var(--bg-elevated-hover)' : color + '14'}` : 'var(--bg-elevated)',
                  color: active ? (n.id === 'all' ? 'var(--text-primary)' : color) : 'var(--text-secondary)',
                  fontSize: '0.82rem', fontWeight: active ? 600 : 400,
                  flexShrink: 0, transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {'Icon' in n && <n.Icon size={13} />}
                {n.label}
                <span style={{
                  fontSize: '0.68rem', color: active ? color : 'var(--text-tertiary)',
                  background: 'var(--bg-elevated)', borderRadius: '10px',
                  padding: '0.05rem 0.35rem', fontWeight: 700,
                }}>
                  {n.id === 'all'
                    ? allPosts.length
                    : allPosts.filter(p => p.socialNetwork === n.id).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* ═══ STATS + PROGRESS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>

          {/* Stat cards — clickable to switch view */}
          {([
            { label: 'Total',         value: stats.total,                                    icon: <LayoutGrid size={15} />,   color: 'var(--text-secondary)', view: 'calendario'   as View },
            { label: 'Realizadas',    value: stats.postado,                                  icon: <CheckCircle2 size={15} />, color: '#22c55e',               view: 'postados'     as View },
            { label: 'Agendadas',     value: stats.agendado,                                 icon: <CalendarDays size={15} />, color: '#5c7aff',               view: 'agendados'    as View },
            { label: 'Em andamento',  value: stats.em_andamento + stats.em_aprovacao,        icon: <TrendingUp size={15} />,   color: '#e5a00d',               view: 'em_andamento' as View },
          ] as const).map(({ label, value, icon, color, view }) => {
            const isActive = activeView === view;
            return (
              <button
                key={label}
                onClick={() => setActiveView(view)}
                className="glass-sm"
                style={{
                  padding: '1rem 1.25rem', textAlign: 'left', cursor: 'pointer',
                  border: isActive ? `1.5px solid ${color}` : undefined,
                  background: isActive ? `${color === 'var(--text-secondary)' ? 'var(--bg-elevated)' : color + '08'}` : undefined,
                  outline: 'none', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="label" style={{ color: isActive ? color : undefined }}>{label}</span>
                  <span style={{ color, opacity: isActive ? 1 : 0.7 }}>{icon}</span>
                </div>
                <span style={{
                  fontFamily: 'DM Sans, system-ui', fontSize: '2rem', fontWeight: 300,
                  color: isActive ? color : 'var(--text-primary)', letterSpacing: '-0.02em',
                }}>
                  {value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Meta de dias úteis */}
        {(() => {
          const y = progressMonth.getFullYear(); const m = progressMonth.getMonth();
          const totalDays = new Date(y, m + 1, 0).getDate();
          let businessDays = 0;
          for (let d = 1; d <= totalDays; d++) {
            const dow = new Date(y, m, d).getDay();
            if (dow >= 1 && dow <= 5) businessDays++;
          }
          const goal = 22;
          const monthStart = new Date(y, m, 1).getTime();
          const monthEnd = new Date(y, m + 1, 0, 23, 59, 59).getTime();
          const posted = networkPosts.filter(p => p.status === 'postado' && p.scheduledDate && p.scheduledDate >= monthStart && p.scheduledDate <= monthEnd).length;
          const pct = Math.min((posted / goal) * 100, 100);
          const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
          const navMonth = (dir: number) => {
            const d = new Date(progressMonth); d.setMonth(d.getMonth() + dir); setProgressMonth(d);
          };
          const isCurrentMonth = y === new Date().getFullYear() && m === new Date().getMonth();
          return (
            <div className="glass-sm" style={{ padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', lineHeight: 1.3 }}>
                    {posted} de {goal} posts realizados
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    Objetivo: {goal} postagens · {businessDays} dias úteis
                  </span>
                </div>
                {/* Month navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button onClick={() => navMonth(-1)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.4rem', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                    <ChevronLeft size={13} />
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, minWidth: '110px', textAlign: 'center' }}>
                    {monthNames[m]} {y}
                  </span>
                  <button onClick={() => navMonth(1)} disabled={isCurrentMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.4rem', cursor: isCurrentMonth ? 'default' : 'pointer', color: isCurrentMonth ? 'var(--border-strong)' : 'var(--text-tertiary)', display: 'flex' }}>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative', height: '6px', background: 'var(--border-strong)', borderRadius: '6px' }}>
                <motion.div
                  key={`${y}-${m}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: '6px', position: 'absolute', background: pct >= 100 ? '#22c55e' : pct >= 60 ? '#5c7aff' : '#e5a00d' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {posted === 0 ? 'Nenhum post publicado neste mês' : `${goal - posted > 0 ? `Faltam ${goal - posted} posts` : '🎉 Meta atingida!'}`}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {Math.round(pct)}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* ═══ VIEWS ═══ */}
        <AnimatePresence mode="wait">
          {activeView === 'calendario' && (
            <motion.div
              key="calendario"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarView
                posts={filteredPosts}
                onSelectPost={setSelectedPost}
                onNewPost={() => setShowNewPost(true)}
                updatePost={updatePost}
                search={search}
                onSearchChange={setSearch}
              />
            </motion.div>
          )}

          {activeView === 'agendados' && (
            <motion.div
              key="agendados"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {agendados.length === 0 ? (
                <EmptyState
                  icon={<Clock3 size={28} style={{ color: 'var(--text-tertiary)' }} />}
                  title="Nenhum post agendado"
                  desc="Posts com data agendada aparecerão aqui."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {agendados.map(p => (
                    <PostCard key={p.id} post={p} onClick={() => setSelectedPost(p)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'postados' && (
            <motion.div
              key="postados"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {postados.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={28} style={{ color: 'var(--text-tertiary)' }} />}
                  title="Nenhum post publicado"
                  desc={selectedNetwork === 'all' ? 'Posts com status "Postado" aparecerão aqui.' : `Ainda sem posts publicados no ${NETWORK_CONFIG[selectedNetwork]?.label}.`}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {postados.map(p => (
                    <PostCard key={p.id} post={p} onClick={() => setSelectedPost(p)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'em_andamento' && (
            <motion.div
              key="em_andamento"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {emAndamento.length === 0 ? (
                <EmptyState
                  icon={<TrendingUp size={28} style={{ color: 'var(--text-tertiary)' }} />}
                  title="Nenhum post em andamento"
                  desc="Posts com status Em andamento ou Em aprovação aparecerão aqui."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {emAndamento.map(p => (
                    <PostCard key={p.id} post={p} onClick={() => setSelectedPost(p)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ BLOCO DE SUPORTE ═══ */}
        <QuickBlock client={client} />

        {/* Footer spacing */}
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
            Calendário Editorial · Gow Agency
          </span>
        </div>

          </>
        )}

        {pageView === 'editorial' && <EditorialPage client={client} />}
        {pageView === 'posicionamento' && <PosicionamentoPage client={client} />}

      </main>

      {/* ═══ POST SHEET ═══ */}
      <PostSheet post={selectedPost} onClose={() => setSelectedPost(null)} />

      {/* ═══ NEW POST MODAL ═══ */}
      <AnimatePresence>
        {showNewPost && (
          <NewPostModal
            onClose={() => setShowNewPost(false)}
            onSave={data => createPost.mutate({ ...data, client })}
            isPending={createPost.isPending}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '3rem 1rem',
      background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border)',
    }}>
      <div style={{ marginBottom: '0.75rem' }}>{icon}</div>
      <h3 style={{ fontFamily: 'DM Sans, system-ui', fontSize: '1rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{title}</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: '320px', margin: '0 auto' }}>{desc}</p>
    </div>
  );
}

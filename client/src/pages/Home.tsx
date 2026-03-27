import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Search, TrendingUp,
  Trophy, Flame, Target, CalendarDays, CheckCircle2, Clock3,
  Sun, Moon, LayoutGrid, List,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useTheme } from '@/contexts/ThemeContext';
import type { Post } from '../../../drizzle/schema';
import PostSheet from '@/components/PostSheet';
import {
  NETWORKS, NETWORK_CONFIG, STATUS_CONFIG, STATUS_ORDER,
  FORMAT_OPTIONS, DIAS_SEMANA, FERIADOS_BR, getWeekDays, formatDateKey, formatDateBR,
} from '@/lib/config';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View = 'calendario' | 'realizadas' | 'agendadas';
type NetworkId = typeof NETWORKS[number]['id'];

// ─── NEW POST MODAL ────────────────────────────────────────────────────────────

function NewPostModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    socialNetwork: 'instagram' as NonNullable<Post['socialNetwork']>,
    titulo: '',
    formato: 'Post',
    conteudo: '',
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
            {NETWORKS.filter(n => n.id !== 'all').map(n => {
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
          <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Briefing (opcional)</span>
          <textarea
            rows={2}
            placeholder="Descreva brevemente o conteúdo..."
            value={form.conteudo}
            onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
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
            style={{
              flex: 2, padding: '0.65rem', background: 'var(--text-primary)',
              color: 'var(--bg)', border: 'none', borderRadius: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem',
            }}
          >
            Criar post
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
        border: '1px solid var(--border)', padding: '0.9rem 1rem',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Network + format badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: network?.color, background: `${network?.color}14`,
              padding: '0.12rem 0.5rem', borderRadius: '20px',
            }}>
              {network?.Icon && <network.Icon size={10} />}
              {network?.label}
            </span>
            <span style={{
              fontSize: '0.65rem', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)',
              padding: '0.12rem 0.5rem', borderRadius: '20px',
            }}>
              {post.formato}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: 'DM Sans, system-ui', fontSize: '0.9rem', fontWeight: 400,
            color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '0.25rem',
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {post.titulo}
          </h3>

          {/* Date */}
          {post.scheduledDate && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {new Date(post.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Status badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.7rem', fontWeight: 600, color: sc.color,
          background: sc.bg, padding: '0.25rem 0.6rem', borderRadius: '20px',
          border: `1px solid ${sc.color}30`, flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          {sc.icon} <span className="hidden sm:inline">{sc.label}</span>
        </span>
      </div>
    </motion.button>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────

function CalendarView({
  posts,
  onSelectPost,
  onNewPost,
}: {
  posts: Post[];
  onSelectPost: (p: Post) => void;
  onNewPost: () => void;
}) {
  const [currentWeek, setCurrentWeek] = useState(() => new Date());
  const utils = trpc.useUtils();
  const updatePost = trpc.posts.update.useMutation({
    onSuccess: () => utils.posts.invalidate(),
  });

  const weekDays = useMemo(() => getWeekDays(currentWeek), [currentWeek]);

  const weekLabel = useMemo(() => {
    const first = weekDays[0];
    const last = weekDays[4];
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${first.getDate()} de ${months[first.getMonth()]} — ${last.getDate()} de ${months[last.getMonth()]} de ${last.getFullYear()}`;
  }, [weekDays]);

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

  const navWeek = (dir: number) => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + dir * 7);
    setCurrentWeek(d);
  };

  return (
    <div>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => navWeek(-1)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'DM Sans, system-ui', whiteSpace: 'nowrap' }}>
            {weekLabel}
          </span>
          <button
            onClick={() => navWeek(1)}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setCurrentWeek(new Date())}
            style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}
          >
            Hoje
          </button>
          <button
            onClick={onNewPost}
            style={{ padding: '0.4rem 0.75rem', background: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--bg)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Plus size={14} /> Novo
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {weekDays.map((day, i) => {
          const key = formatDateKey(day);
          const dayPosts = postsByDate[key] || [];
          const feriado = FERIADOS_BR[key];
          const isToday = key === formatDateKey(new Date());

          return (
            <div
              key={key}
              style={{
                background: isToday ? 'var(--bg-elevated-hover)' : 'var(--bg-elevated)',
                border: isToday ? '1.5px solid var(--border-strong)' : '1px solid var(--border)',
                borderRadius: '12px', padding: '0.65rem',
                minHeight: '120px',
              }}
            >
              {/* Day header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="label" style={{ fontSize: '0.6rem' }}>{DIAS_SEMANA[i]}</span>
                <span style={{
                  fontSize: '1rem', fontWeight: isToday ? 700 : 400,
                  fontFamily: 'DM Sans, system-ui',
                  color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                  {day.getDate()}
                </span>
              </div>

              {feriado && (
                <div style={{
                  fontSize: '0.6rem', color: '#e5a00d', background: 'rgba(229,160,13,0.08)',
                  padding: '0.15rem 0.35rem', borderRadius: '4px', marginBottom: '0.35rem',
                  fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {feriado}
                </div>
              )}

              {dayPosts.length === 0 && (
                <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '0.25rem' }}>—</p>
              )}

              {dayPosts.map(p => {
                const network = NETWORK_CONFIG[p.socialNetwork];
                const sc = STATUS_CONFIG[p.status];
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPost(p)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: `${network?.color}0d`,
                      border: `1px solid ${network?.color}25`,
                      borderRadius: '6px', padding: '0.35rem 0.45rem',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                      {network?.Icon && <network.Icon size={9} style={{ color: network.color, flexShrink: 0 }} />}
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: network?.color }}>
                        {p.formato}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', lineHeight: 1.3, fontWeight: 500 }}>
                      {p.titulo.length > 35 ? p.titulo.slice(0, 35) + '…' : p.titulo}
                    </div>
                    <div style={{
                      marginTop: '0.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                      fontSize: '0.58rem', color: sc.color,
                    }}>
                      {sc.icon} <span>{sc.label}</span>
                    </div>
                  </button>
                );
              })}

              {/* Quick date assign input */}
              <input
                type="date"
                title="Agendar post nesta data"
                onChange={e => {
                  if (e.target.value) {
                    const date = new Date(e.target.value + 'T12:00:00');
                    // find an unscheduled post to assign — or just show new post
                    toast.info('Selecione um post para agendar nesta data');
                    e.target.value = '';
                  }
                }}
                style={{
                  width: '100%', fontSize: '0.6rem', padding: '0.2rem',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', marginTop: '0.25rem', opacity: 0.5,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Unscheduled posts */}
      {unscheduled.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Clock3 size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Aguardando agendamento ({unscheduled.length})
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem' }}>
            {unscheduled.map(p => (
              <div key={p.id} style={{ position: 'relative' }}>
                <PostCard post={p} onClick={() => onSelectPost(p)} />
                <div style={{ marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem', paddingLeft: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Agendar:</span>
                  <input
                    type="date"
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      if (e.target.value) {
                        updatePost.mutate({ id: p.id, scheduledDate: new Date(e.target.value + 'T12:00:00').getTime() });
                        toast.success('Post agendado');
                      }
                    }}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', flex: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState<View>('calendario');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [search, setSearch] = useState('');

  const utils = trpc.useUtils();
  const postsQuery = trpc.posts.list.useQuery();
  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => { utils.posts.invalidate(); toast.success('Post criado'); setShowNewPost(false); },
  });
  const seedPosts = trpc.posts.seed.useMutation({
    onSuccess: () => utils.posts.invalidate(),
  });

  const allPosts: Post[] = (postsQuery.data as Post[]) || [];

  // Auto seed if empty
  useEffect(() => {
    if (postsQuery.data && (postsQuery.data as Post[]).length === 0) {
      seedPosts.mutate();
    }
  }, [postsQuery.data]);

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

  // Monthly gamification
  const monthly = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthPosts = networkPosts.filter(
      p => p.status === 'postado' && p.scheduledDate &&
        new Date(p.scheduledDate) >= monthStart && new Date(p.scheduledDate) <= monthEnd
    );
    const count = monthPosts.length;
    const meta = 12; const ideal = 16; const bonus = 20;
    const pct = Math.min((count / bonus) * 100, 100);
    let tier: 'abaixo' | 'meta' | 'ideal' | 'bonus' = 'abaixo';
    if (count >= bonus) tier = 'bonus';
    else if (count >= ideal) tier = 'ideal';
    else if (count >= meta) tier = 'meta';
    return { count, meta, ideal, bonus, pct, tier };
  }, [networkPosts]);

  // Views split
  const realizadas = useMemo(() => filteredPosts.filter(p => p.status === 'postado').sort((a, b) => (b.scheduledDate || 0) - (a.scheduledDate || 0)), [filteredPosts]);
  const agendadas = useMemo(() => filteredPosts.filter(p => p.scheduledDate && p.status !== 'postado').sort((a, b) => (a.scheduledDate || 0) - (b.scheduledDate || 0)), [filteredPosts]);

  const TIER_COLORS = {
    abaixo: 'var(--text-tertiary)',
    meta: '#22c55e',
    ideal: '#5c7aff',
    bonus: '#e5a00d',
  };

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
          padding: '0.875rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '8px',
              background: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarDays size={14} style={{ color: 'var(--bg)' }} />
            </div>
            <div>
              <span style={{
                fontFamily: 'DM Sans, system-ui', fontSize: '1rem', fontWeight: 600,
                color: 'var(--text-primary)', letterSpacing: '-0.02em',
              }}>
                Gow Calendar
              </span>
              <span className="label" style={{ display: 'block', fontSize: '0.55rem', marginTop: '-0.1rem' }}>
                Calendário editorial
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.6rem', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Buscar posts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  paddingLeft: '1.8rem', paddingRight: '0.75rem',
                  width: '180px', fontSize: '0.82rem',
                  background: 'var(--bg-elevated)',
                }}
              />
            </div>

            {/* New post */}
            <button
              onClick={() => setShowNewPost(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.45rem 0.9rem', background: 'var(--text-primary)',
                color: 'var(--bg)', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              }}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Novo post</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '0.45rem', cursor: 'pointer',
                color: 'var(--text-secondary)', display: 'flex',
              }}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>

        {/* ═══ NETWORK SELECTOR ═══ */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {NETWORKS.map(n => {
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>

          {/* Stat cards */}
          {[
            { label: 'Total', value: stats.total, icon: <LayoutGrid size={15} />, color: 'var(--text-secondary)' },
            { label: 'Realizadas', value: stats.postado, icon: <CheckCircle2 size={15} />, color: '#22c55e' },
            { label: 'Agendadas', value: stats.agendado, icon: <CalendarDays size={15} />, color: '#5c7aff' },
            { label: 'Em andamento', value: stats.em_andamento + stats.em_aprovacao, icon: <TrendingUp size={15} />, color: '#e5a00d' },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="glass-sm"
              style={{ padding: '1rem 1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="label">{label}</span>
                <span style={{ color, opacity: 0.7 }}>{icon}</span>
              </div>
              <span style={{
                fontFamily: 'DM Sans, system-ui', fontSize: '2rem', fontWeight: 300,
                color: 'var(--text-primary)', letterSpacing: '-0.02em',
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Monthly progress */}
        <div className="glass-sm" style={{ padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {monthly.tier === 'bonus' ? <Trophy size={15} color={TIER_COLORS.bonus} />
                : monthly.tier === 'ideal' ? <Flame size={15} color={TIER_COLORS.ideal} />
                : monthly.tier === 'meta' ? <Target size={15} color={TIER_COLORS.meta} />
                : <TrendingUp size={15} color={TIER_COLORS.abaixo} />}
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>
                  {monthly.tier === 'bonus' ? 'Autoridade consolidada'
                    : monthly.tier === 'ideal' ? 'Ritmo estratégico'
                    : monthly.tier === 'meta' ? 'Meta atingida'
                    : `${monthly.count} post${monthly.count !== 1 ? 's' : ''} este mês`}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                  {monthly.tier === 'bonus' ? 'Presença que gera confiança'
                    : monthly.tier === 'ideal' ? 'Consistência que constrói reputação'
                    : monthly.tier === 'meta' ? 'Base sólida de presença'
                    : 'Evolução do calendário mensal'}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              Mês de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ position: 'relative', height: '6px', background: 'var(--border-strong)', borderRadius: '6px', overflow: 'visible' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${monthly.pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: '6px', position: 'absolute',
                background: TIER_COLORS[monthly.tier],
              }}
            />
            {/* Markers */}
            <div title={`Meta: ${monthly.meta} posts`} style={{ position: 'absolute', left: `${(monthly.meta / monthly.bonus) * 100}%`, top: -3, width: 2, height: 12, background: TIER_COLORS.meta, borderRadius: 2, opacity: 0.5 }} />
            <div title={`Ideal: ${monthly.ideal} posts`} style={{ position: 'absolute', left: `${(monthly.ideal / monthly.bonus) * 100}%`, top: -3, width: 2, height: 12, background: TIER_COLORS.ideal, borderRadius: 2, opacity: 0.5 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            {[
              { icon: <Target size={10} />, label: `Meta: ${monthly.meta}`, color: TIER_COLORS.meta },
              { icon: <Flame size={10} />, label: `Ideal: ${monthly.ideal}`, color: TIER_COLORS.ideal },
              { icon: <Trophy size={10} />, label: `Bônus: ${monthly.bonus}+`, color: TIER_COLORS.bonus },
            ].map(({ icon, label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color }}>
                {icon}
                <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ VIEW TABS ═══ */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '0.25rem' }}>
          {([
            { id: 'calendario', label: 'Calendário', icon: <CalendarDays size={14} /> },
            { id: 'realizadas', label: `Realizadas (${realizadas.length})`, icon: <CheckCircle2 size={14} /> },
            { id: 'agendadas', label: `Agendadas (${agendadas.length})`, icon: <Clock3 size={14} /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0.55rem 0.75rem', borderRadius: '8px', cursor: 'pointer', border: 'none',
                background: activeView === tab.id ? 'var(--bg)' : 'transparent',
                color: activeView === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: '0.82rem', fontWeight: activeView === tab.id ? 600 : 400,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
                boxShadow: activeView === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

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
              />
            </motion.div>
          )}

          {activeView === 'realizadas' && (
            <motion.div
              key="realizadas"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {realizadas.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={28} style={{ color: 'var(--text-tertiary)' }} />}
                  title="Nenhum post realizado"
                  desc={selectedNetwork === 'all' ? 'Posts com status "Postado" aparecerão aqui.' : `Ainda sem posts publicados no ${NETWORK_CONFIG[selectedNetwork]?.label}.`}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {realizadas.map(p => (
                    <PostCard key={p.id} post={p} onClick={() => setSelectedPost(p)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'agendadas' && (
            <motion.div
              key="agendadas"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {agendadas.length === 0 ? (
                <EmptyState
                  icon={<Clock3 size={28} style={{ color: 'var(--text-tertiary)' }} />}
                  title="Nenhum post agendado"
                  desc="Posts com data agendada aparecerão aqui."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {agendadas.map(p => (
                    <PostCard key={p.id} post={p} onClick={() => setSelectedPost(p)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ═══ POST SHEET ═══ */}
      <PostSheet post={selectedPost} onClose={() => setSelectedPost(null)} />

      {/* ═══ NEW POST MODAL ═══ */}
      <AnimatePresence>
        {showNewPost && (
          <NewPostModal
            onClose={() => setShowNewPost(false)}
            onSave={data => createPost.mutate(data)}
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

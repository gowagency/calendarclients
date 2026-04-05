import { useState, useMemo } from 'react';
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
  NETWORKS, NETWORK_CONFIG, STATUS_CONFIG, STATUS_ORDER,
  FORMAT_OPTIONS, DIAS_SEMANA, FERIADOS_BR, formatDateKey,
} from '@/lib/config';
import { EditorialPage, PosicionamentoPage } from './EditorialPage';

type PageView = 'calendario' | 'editorial' | 'posicionamento';

const CLIENT_LABELS: Record<ClientSlug, string> = {
  alinyrayze: 'Aliny Rayze',
  juniorlopes: 'Junior Lopes',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View = 'calendario' | 'realizadas' | 'agendadas' | 'feed';
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

function CalendarView({ posts, onSelectPost, onNewPost, updatePost }: { posts: Post[]; onSelectPost: (p: Post) => void; onNewPost: () => void; updatePost: any; }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => navMonth(-1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'DM Sans, system-ui', minWidth: '160px', textAlign: 'center' }}>{monthLabel}</span>
          <button onClick={() => navMonth(1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><ChevronRight size={16} /></button>
        </div>
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
                      const network = NETWORK_CONFIG[p.socialNetwork];
                      const sc = STATUS_CONFIG[p.status];
                      return (
                        <button key={p.id} onClick={() => onSelectPost(p)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: `${network?.color}0d`, border: `1px solid ${network?.color}25`, borderRadius: '6px', padding: '0.3rem 0.4rem', marginBottom: '0.25rem', display: 'block' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.1rem' }}>
                            {network?.Icon && <network.Icon size={8} style={{ color: network.color, flexShrink: 0 }} />}
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: network?.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.formato}</span>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-primary)', lineHeight: 1.2, fontWeight: 500 }}>{p.titulo.length > 30 ? p.titulo.slice(0, 30) + '…' : p.titulo}</div>
                          <div style={{ marginTop: '0.15rem', display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.55rem', color: sc.color }}>{sc.icon} <span>{sc.label}</span></div>
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
  createdAt: number;
};

// Pill style: subtle fill + tinted border + colored text
const PROD_STATUS_CONFIG: Record<ProdStatus, { label: string; bg: string; border: string; color: string }> = {
  nao_iniciado: { label: 'Não iniciado', bg: 'rgba(136,135,128,0.10)', border: 'rgba(136,135,128,0.25)', color: '#888780' },
  em_andamento: { label: 'Em andamento', bg: 'rgba(239,159,39,0.12)',  border: 'rgba(239,159,39,0.25)',  color: '#EF9F27' },
  em_aprovacao: { label: 'Em aprovação', bg: 'rgba(160,132,92,0.12)',  border: 'rgba(160,132,92,0.25)',  color: '#A0845C' },
  aprovado:     { label: 'Aprovado',     bg: 'rgba(55,138,221,0.12)',  border: 'rgba(55,138,221,0.25)',  color: '#378ADD' },
  em_gravacao:  { label: 'Em Gravação',  bg: 'rgba(216,90,48,0.12)',   border: 'rgba(216,90,48,0.25)',   color: '#D85A30' },
  gravado:      { label: 'Gravado',      bg: 'rgba(99,153,34,0.12)',   border: 'rgba(99,153,34,0.25)',   color: '#639922' },
  postado:      { label: 'Postado',      bg: 'rgba(29,158,117,0.12)',  border: 'rgba(29,158,117,0.25)',  color: '#1D9E75' },
};

const PROD_STATUS_ORDER: ProdStatus[] = [
  'nao_iniciado', 'em_andamento', 'em_aprovacao', 'aprovado', 'em_gravacao', 'gravado', 'postado',
];

const PROD_TYPE_CONFIG: Record<ProdType, { label: string; color: string }> = {
  reels:     { label: 'Reels',     color: '#D85A30' },
  narracao:  { label: 'Narração',  color: '#378ADD' },
  carrossel: { label: 'Carrossel', color: '#A0845C' },
};

const EMPTY_TASK: Omit<ProdTask, 'id' | 'createdAt'> = {
  type: 'reels', title: '', status: 'nao_iniciado', dueDate: '', obs: '',
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
          {/* Type + Date row */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(Object.entries(PROD_TYPE_CONFIG) as [ProdType, { label: string; color: string }][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setNewTask(f => ({ ...f, type: k }))}
                style={{ padding: '3px 10px', borderRadius: '100px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', border: newTask.type === k ? `1px solid ${v.color}44` : '1px solid var(--border)', background: newTask.type === k ? `${v.color}18` : 'transparent', color: newTask.type === k ? v.color : 'var(--text-tertiary)', transition: 'all 0.15s' }}
              >
                {v.label}
              </button>
            ))}
            <input
              type="date"
              value={newTask.dueDate}
              onChange={e => setNewTask(f => ({ ...f, dueDate: e.target.value }))}
              style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
            />
          </div>
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
          {/* Status pills */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {PROD_STATUS_ORDER.map(k => {
              const v = PROD_STATUS_CONFIG[k];
              const active = newTask.status === k;
              return (
                <button key={k} onClick={() => setNewTask(f => ({ ...f, status: k }))} style={{ padding: '3px 10px', borderRadius: '100px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', border: `1px solid ${active ? v.border : 'rgba(0,0,0,0.08)'}`, background: active ? v.bg : 'transparent', color: active ? v.color : 'var(--text-tertiary)', opacity: active ? 1 : 0.55, transition: 'all 0.15s' }}>
                  {v.label}
                </button>
              );
            })}
          </div>
          {/* Obs */}
          <textarea rows={2} placeholder="Observação (opcional)..." value={newTask.obs} onChange={e => setNewTask(f => ({ ...f, obs: e.target.value }))} style={{ width: '100%', fontSize: '0.82rem', resize: 'none' }} />
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
              style={{ background: 'var(--bg-elevated)', border: `1px solid ${open ? sc.border : 'var(--border)'}`, borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.15s' }}
            >
              {/* Row */}
              <div
                onClick={() => setExpandedId(open ? null : task.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', cursor: 'pointer', userSelect: 'none' }}
              >
                {/* Type pill */}
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: `${tc.color}18`, border: `1px solid ${tc.color}40`, color: tc.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {tc.label}
                </span>

                {/* Title */}
                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.title}
                </span>

                {/* Date */}
                {task.dueDate && (
                  <span style={{ fontSize: '0.75rem', color: over ? '#D85A30' : 'var(--text-tertiary)', fontWeight: over ? 600 : 400, flexShrink: 0 }}>
                    {over ? '⚠ ' : ''}{fmtDate(task.dueDate)}
                  </span>
                )}

                {/* Status pill */}
                <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '100px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {sc.label}
                </span>

                {/* Chevron */}
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </div>

              {/* Expanded editing */}
              {open && (
                <div style={{ padding: '0 0.85rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--border)' }}>
                  {/* Type + Date */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.65rem', alignItems: 'center' }}>
                    {(Object.entries(PROD_TYPE_CONFIG) as [ProdType, { label: string; color: string }][]).map(([k, v]) => (
                      <button key={k} onClick={() => updateTask(task.id, 'type', k)} style={{ padding: '3px 9px', borderRadius: '100px', cursor: 'pointer', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', border: task.type === k ? `1px solid ${v.color}44` : '1px solid var(--border)', background: task.type === k ? `${v.color}18` : 'transparent', color: task.type === k ? v.color : 'var(--text-tertiary)', transition: 'all 0.15s' }}>
                        {v.label}
                      </button>
                    ))}
                    <input type="date" value={task.dueDate} onChange={e => updateTask(task.id, 'dueDate', e.target.value)} style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '0.2rem 0.45rem' }} />
                  </div>

                  {/* Title edit */}
                  <input type="text" value={task.title} onChange={e => updateTask(task.id, 'title', e.target.value)} style={{ width: '100%', fontSize: '0.875rem' }} />

                  {/* Status pills */}
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {PROD_STATUS_ORDER.map(k => {
                      const v = PROD_STATUS_CONFIG[k];
                      const active = task.status === k;
                      return (
                        <button key={k} onClick={() => updateTask(task.id, 'status', k)} style={{ padding: '3px 10px', borderRadius: '100px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', border: `1px solid ${active ? v.border : 'rgba(0,0,0,0.08)'}`, background: active ? v.bg : 'transparent', color: active ? v.color : 'var(--text-tertiary)', opacity: active ? 1 : 0.55, transition: 'all 0.15s' }}>
                          {v.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Obs */}
                  <textarea rows={2} placeholder="Observação..." value={task.obs} onChange={e => updateTask(task.id, 'obs', e.target.value)} style={{ width: '100%', fontSize: '0.82rem', resize: 'none' }} />

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

// ─── FEED VIEW ────────────────────────────────────────────────────────────────

function FeedView({ posts, onSelectPost }: { posts: Post[]; onSelectPost: (p: Post) => void }) {
  // Posts com capa, mais recentes primeiro
  const feedPosts = useMemo(() =>
    [...posts]
      .filter(p => p.coverImageUrl && p.scheduledDate)
      .sort((a, b) => (b.scheduledDate || 0) - (a.scheduledDate || 0))
      .slice(0, 9),
    [posts]
  );

  if (feedPosts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📸</div>
        <h3 style={{ fontFamily: 'DM Sans, system-ui', fontSize: '1rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Nenhum criativo no feed</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: '320px', margin: '0 auto' }}>
          Adicione uma capa nos posts do calendário para simular o feed do Instagram.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          Simulação do feed · {feedPosts.length} post{feedPosts.length !== 1 ? 's' : ''} mais recentes
        </span>
      </div>
      {/* Grid 3 colunas estilo Instagram */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', maxWidth: '600px' }}>
        {feedPosts.map(p => {
          const network = NETWORK_CONFIG[p.socialNetwork];
          return (
            <button
              key={p.id}
              onClick={() => onSelectPost(p)}
              style={{
                position: 'relative',
                aspectRatio: '4/5',
                background: 'var(--bg-elevated)',
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                padding: 0,
              }}
            >
              <img
                src={p.coverImageUrl!}
                alt={p.titulo}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Overlay on hover */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
              >
                <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 600, opacity: 0, transition: 'opacity 0.2s', textAlign: 'center', padding: '0.25rem' }}>
                  {p.titulo.length > 40 ? p.titulo.slice(0, 40) + '…' : p.titulo}
                </span>
              </div>
              {/* Network badge */}
              <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {network?.Icon && <network.Icon size={10} style={{ color: '#fff' }} />}
              </div>
            </button>
          );
        })}
      </div>
      {feedPosts.length < 9 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', fontStyle: 'italic' }}>
          {9 - feedPosts.length} slot{9 - feedPosts.length !== 1 ? 's' : ''} restante{9 - feedPosts.length !== 1 ? 's' : ''} · adicione capas nos posts para completar o feed
        </p>
      )}
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
  const realizadas = useMemo(() => filteredPosts.filter(p => p.status === 'postado').sort((a, b) => (b.scheduledDate || 0) - (a.scheduledDate || 0)), [filteredPosts]);
  const agendadas = useMemo(() => filteredPosts.filter(p => p.scheduledDate && p.status !== 'postado').sort((a, b) => (a.scheduledDate || 0) - (b.scheduledDate || 0)), [filteredPosts]);

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
          padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
          flexWrap: 'wrap',
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
                {CLIENT_LABELS[client]}
              </span>
              <span className="label" style={{ display: 'block', fontSize: '0.55rem', marginTop: '-0.1rem' }}>
                Calendário editorial · Gow Agency
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
                  width: 'min(180px, 120px)', fontSize: '0.82rem',
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

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem' }}>

        {/* ═══ PAGE NAVIGATION ═══ */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0rem' }}>
          {([
            { id: 'calendario'     as const, label: 'Calendário'      },
            { id: 'editorial'      as const, label: 'Linha Editorial'  },
            { id: 'posicionamento' as const, label: 'Posicionamento'   },
          ] satisfies { id: PageView; label: string }[]).map(p => (
            <button
              key={p.id}
              onClick={() => setPageView(p.id)}
              style={{
                padding: '0.6rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: pageView === p.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: pageView === p.id ? 600 : 400,
                color: pageView === p.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                marginBottom: '-1px',
                transition: 'all 0.15s',
                fontFamily: 'DM Sans, system-ui',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {pageView === 'calendario' && (
          <>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>

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

        {/* Meta de dias úteis */}
        {(() => {
          const now = new Date();
          const y = now.getFullYear(); const m = now.getMonth();
          const totalDays = new Date(y, m + 1, 0).getDate();
          let businessDays = 0;
          for (let d = 1; d <= totalDays; d++) {
            const dow = new Date(y, m, d).getDay();
            if (dow >= 1 && dow <= 5) businessDays++;
          }
          const monthStart = new Date(y, m, 1).getTime();
          const monthEnd = new Date(y, m + 1, 0, 23, 59, 59).getTime();
          const posted = networkPosts.filter(p => p.status === 'postado' && p.scheduledDate && p.scheduledDate >= monthStart && p.scheduledDate <= monthEnd).length;
          const pct = Math.min((posted / businessDays) * 100, 100);
          const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
          return (
            <div className="glass-sm" style={{ padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>
                    {posted} de {businessDays} posts realizados
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    Meta: 1 post por dia útil
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  {monthNames[m]} {y}
                </span>
              </div>
              <div style={{ position: 'relative', height: '6px', background: 'var(--border-strong)', borderRadius: '6px' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: '6px', position: 'absolute', background: pct >= 100 ? '#22c55e' : pct >= 60 ? '#5c7aff' : '#e5a00d' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {Math.round(pct)}% da meta mensal
                </span>
              </div>
            </div>
          );
        })()}

        {/* ═══ VIEW TABS ═══ */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '0.25rem' }}>
          {([
            { id: 'calendario' as View, label: 'Calendário', icon: <CalendarDays size={14} /> },
            { id: 'realizadas' as View, label: `Realizadas (${realizadas.length})`, icon: <CheckCircle2 size={14} /> },
            { id: 'agendadas' as View, label: `Agendadas (${agendadas.length})`, icon: <Clock3 size={14} /> },
            { id: 'feed' as View, label: 'Feed', icon: <LayoutGrid size={14} /> },
          ]).map(tab => (
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
                updatePost={updatePost}
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

          {activeView === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <FeedView posts={filteredPosts} onSelectPost={setSelectedPost} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ BLOCO DE SUPORTE ═══ */}
        <QuickBlock client={client} />

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

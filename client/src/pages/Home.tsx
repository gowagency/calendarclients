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

const CLIENT_LABELS: Record<ClientSlug, string> = {
  alinyrayze: 'Aliny Rayze',
  juniorlopes: 'Junior Lopes',
};

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

type NoteItem = { id: string; text: string; at: number };
type TaskItem = { id: string; text: string; done: boolean; at: number };
type RecItem = { id: string; label: string; url: string; at: number };

function QuickBlock({ client }: { client: string }) {
  const key = (t: string) => `gow_${client}_${t}`;
  const load = <T,>(t: string, def: T): T => { try { return JSON.parse(localStorage.getItem(key(t)) || '') } catch { return def; } };
  const save = (t: string, v: any) => localStorage.setItem(key(t), JSON.stringify(v));

  const [tab, setTab] = useState<'notas' | 'tarefas' | 'gravacoes'>('notas');
  const [notes, setNotes] = useState<NoteItem[]>(() => load('notes', []));
  const [tasks, setTasks] = useState<TaskItem[]>(() => load('tasks', []));
  const [recs, setRecs] = useState<RecItem[]>(() => load('recs', []));
  const [noteInput, setNoteInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [recLabel, setRecLabel] = useState('');
  const [recUrl, setRecUrl] = useState('');

  const addNote = () => { if (!noteInput.trim()) return; const n = [...notes, { id: Date.now().toString(), text: noteInput.trim(), at: Date.now() }]; setNotes(n); save('notes', n); setNoteInput(''); };
  const delNote = (id: string) => { const n = notes.filter(x => x.id !== id); setNotes(n); save('notes', n); };
  const addTask = () => { if (!taskInput.trim()) return; const t = [...tasks, { id: Date.now().toString(), text: taskInput.trim(), done: false, at: Date.now() }]; setTasks(t); save('tasks', t); setTaskInput(''); };
  const toggleTask = (id: string) => { const t = tasks.map(x => x.id === id ? { ...x, done: !x.done } : x); setTasks(t); save('tasks', t); };
  const delTask = (id: string) => { const t = tasks.filter(x => x.id !== id); setTasks(t); save('tasks', t); };
  const addRec = () => { if (!recLabel.trim()) return; const r = [...recs, { id: Date.now().toString(), label: recLabel.trim(), url: recUrl.trim(), at: Date.now() }]; setRecs(r); save('recs', r); setRecLabel(''); setRecUrl(''); };
  const delRec = (id: string) => { const r = recs.filter(x => x.id !== id); setRecs(r); save('recs', r); };

  const tabs = [
    { id: 'notas' as const, label: 'Anotações', count: notes.length },
    { id: 'tarefas' as const, label: 'Tarefas', count: tasks.filter(t => !t.done).length },
    { id: 'gravacoes' as const, label: 'Gravações', count: recs.length },
  ];

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '0.25rem', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '0.4rem 0.9rem', borderRadius: '7px', cursor: 'pointer', border: 'none', background: tab === t.id ? 'var(--bg)' : 'transparent', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: tab === t.id ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.15s' }}>
            {t.label}
            {t.count > 0 && <span style={{ fontSize: '0.65rem', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '0.05rem 0.35rem', fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'notas' && (
        <div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <input type="text" placeholder="Nova anotação..." value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} style={{ flex: 1, fontSize: '0.85rem' }} />
            <button onClick={addNote} style={{ padding: '0.5rem 0.9rem', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {notes.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Nenhuma anotação ainda</p>}
            {notes.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.text}</span>
                <button onClick={() => delNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.1rem', flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tarefas' && (
        <div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <input type="text" placeholder="Nova tarefa..." value={taskInput} onChange={e => setTaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} style={{ flex: 1, fontSize: '0.85rem' }} />
            <button onClick={addTask} style={{ padding: '0.5rem 0.9rem', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {tasks.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Nenhuma tarefa ainda</p>}
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', opacity: t.done ? 0.5 : 1 }}>
                <button onClick={() => toggleTask(t.id)} style={{ width: 18, height: 18, borderRadius: '4px', border: t.done ? '1px solid #22c55e' : '1px solid var(--border-strong)', background: t.done ? '#22c55e' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>
                  {t.done && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
                </button>
                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: t.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{t.text}</span>
                <button onClick={() => delTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.1rem', flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'gravacoes' && (
        <div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Nome da gravação" value={recLabel} onChange={e => setRecLabel(e.target.value)} style={{ flex: '1 1 150px', fontSize: '0.85rem' }} />
            <input type="url" placeholder="Link (opcional)" value={recUrl} onChange={e => setRecUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRec()} style={{ flex: '2 1 200px', fontSize: '0.85rem' }} />
            <button onClick={addRec} style={{ padding: '0.5rem 0.9rem', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {recs.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Nenhuma gravação ainda</p>}
            {recs.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem' }}>🎙</span>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener" style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>{r.label}</a>
                ) : (
                  <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.label}</span>
                )}
                <button onClick={() => delRec(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.1rem', flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Home({ client }: { client: ClientSlug }) {
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState<View>('calendario');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [search, setSearch] = useState('');

  const utils = trpc.useUtils();
  const postsQuery = trpc.posts.list.useQuery({ client });
  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => { utils.posts.invalidate(); toast.success('Post criado'); setShowNewPost(false); },
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
        </AnimatePresence>

        {/* ═══ BLOCO DE SUPORTE ═══ */}
        <QuickBlock client={client} />

      </main>

      {/* ═══ POST SHEET ═══ */}
      <PostSheet post={selectedPost} onClose={() => setSelectedPost(null)} />

      {/* ═══ NEW POST MODAL ═══ */}
      <AnimatePresence>
        {showNewPost && (
          <NewPostModal
            onClose={() => setShowNewPost(false)}
            onSave={data => createPost.mutate({ ...data, client })}
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

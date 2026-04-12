import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Trash2, MessageSquare, Paperclip, ExternalLink,
  Upload, Calendar, Send as SendIcon, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import type { Post, Comment, Attachment } from '@shared/types';
import { NETWORK_CONFIG, STATUS_CONFIG, FORMAT_OPTIONS, getPilares, CLIENT_CONFIG } from '@/lib/config';
import RichTextEditor from '@/components/RichTextEditor';

interface PostSheetProps {
  post: Post | null;
  onClose: () => void;
}

type HistoryEvent = {
  type: string;
  label: string;
  color: string;
  timestamp: number;
  note?: string;
};

const APPROVAL_ACTIONS = [
  { type: 'copy_ok',   label: 'Copy aprovado',        emoji: '✓', color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.30)'   },
  { type: 'arte_ok',   label: 'Arte aprovada',         emoji: '✓', color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.30)'   },
  { type: 'ajuste_ok', label: 'Ajuste aprovado',       emoji: '✓', color: '#6B8A6E', bg: 'rgba(107,138,110,0.12)', border: 'rgba(107,138,110,0.30)' },
  { type: 'postar',    label: 'Autorizado p/ postagem',emoji: '🚀', color: '#5c7aff', bg: 'rgba(92,122,255,0.10)', border: 'rgba(92,122,255,0.30)'  },
] as const;

function fmtTs(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function PostSheet({ post, onClose }: PostSheetProps) {
  const utils = trpc.useUtils();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [commentAuthor] = useState('Gow Agency');
  const [commentText, setCommentText] = useState('');
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [pedirAjuste, setPedirAjuste] = useState(false);
  const [ajusteNote, setAjusteNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (post) { setEditingPost({ ...post }); setCarouselIdx(0); }
  }, [post]);

  const updatePost = trpc.posts.update.useMutation({
    onSuccess: () => { utils.posts.invalidate(); toast.success('Alterações salvas'); },
  });
  const deletePost = trpc.posts.delete.useMutation({
    onSuccess: () => { utils.posts.invalidate(); toast.success('Post removido'); onClose(); },
  });
  const commentsQuery = trpc.comments.byPost.useQuery(
    { postId: post?.id ?? 0 }, { enabled: !!post }
  );
  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.byPost.invalidate({ postId: post?.id ?? 0 });
      toast.success('Comentário adicionado');
      setCommentText('');
    },
  });
  const attachmentsQuery = trpc.attachments.byPost.useQuery(
    { postId: post?.id ?? 0 }, { enabled: !!post }
  );
  const uploadAttachment = trpc.attachments.upload.useMutation({
    onSuccess: () => { utils.attachments.byPost.invalidate({ postId: post?.id ?? 0 }); toast.success('Arquivo anexado'); },
  });
  const deleteAttachment = trpc.attachments.delete.useMutation({
    onSuccess: () => utils.attachments.byPost.invalidate({ postId: post?.id ?? 0 }),
  });
  const uploadCover = trpc.posts.uploadCover.useMutation({
    onSuccess: (data) => {
      utils.posts.invalidate();
      toast.success('Capa atualizada');
      setEditingPost(prev => prev ? { ...prev, coverImageUrl: data.url } : null);
    },
    onError: (err) => toast.error(`Erro ao enviar capa: ${err.message}`),
  });

  const getHistory = (): HistoryEvent[] => {
    try { return JSON.parse((editingPost as any)?.approvalHistory || '[]'); } catch { return []; }
  };

  const handleSave = useCallback(() => {
    if (!editingPost) return;
    const { id, createdAt, updatedAt, sortOrder, checklist, pilar, obsAliny, obsAlinyRead, approvalHistory, ...rest } = editingPost as any;
    updatePost.mutate({
      id,
      ...rest,
      ...(sortOrder !== null ? { sortOrder } : {}),
      ...(pilar !== undefined ? { pilar } : {}),
      ...(obsAliny !== undefined ? { obsAliny: obsAliny || null } : {}),
      ...(obsAlinyRead !== undefined ? { obsAlinyRead } : {}),
      ...(approvalHistory !== undefined ? { approvalHistory: approvalHistory || null } : {}),
    });
  }, [editingPost, updatePost]);

  const handleFileUpload = useCallback((file: File) => {
    if (!post) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadAttachment.mutate({ postId: post.id, fileName: file.name, fileData: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }, [post, uploadAttachment]);

  const handleCoverUpload = useCallback((file: File) => {
    if (!post) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadCover.mutate({ postId: post.id, fileName: file.name, fileData: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }, [post, uploadCover]);

  const handleAddComment = useCallback(() => {
    if (!post || !commentText.trim()) return;
    createComment.mutate({ postId: post.id, authorName: commentAuthor, content: commentText.trim() });
  }, [post, commentAuthor, commentText, createComment]);

  const updateField = <K extends keyof Post>(field: K, value: Post[K]) => {
    setEditingPost(prev => prev ? { ...prev, [field]: value } : null);
  };
  const updateAny = (field: string, value: any) => {
    setEditingPost(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleApprovalAction = (action: typeof APPROVAL_ACTIONS[number]) => {
    if (!post || !editingPost) return;
    const hist = getHistory();
    const newEvent: HistoryEvent = { type: action.type, label: action.label, color: action.color, timestamp: Date.now() };
    const newHist = JSON.stringify([...hist, newEvent]);
    updatePost.mutate({ id: post.id, approvalHistory: newHist, obsAlinyRead: 0 });
    setEditingPost(prev => prev ? { ...prev, approvalHistory: newHist, obsAlinyRead: 0 } as any : null);
    toast.success(action.label + ' registrado');
    setShowHistory(true);
  };

  const handlePedirAjuste = () => {
    if (!post || !editingPost) return;
    const hist = getHistory();
    const newEvent: HistoryEvent = { type: 'ajuste', label: 'Ajuste solicitado', color: '#e5a00d', timestamp: Date.now(), note: ajusteNote.trim() || undefined };
    const newHist = JSON.stringify([...hist, newEvent]);
    updatePost.mutate({ id: post.id, approvalHistory: newHist, obsAlinyRead: 0, status: 'em_aprovacao' });
    setEditingPost(prev => prev ? { ...prev, approvalHistory: newHist, obsAlinyRead: 0, status: 'em_aprovacao' } as any : null);
    setPedirAjuste(false);
    setAjusteNote('');
    toast.success('Ajuste solicitado');
    setShowHistory(true);
  };

  const handleMarkRead = () => {
    if (!post) return;
    updatePost.mutate({ id: post.id, obsAlinyRead: 1 });
    setEditingPost(prev => prev ? { ...prev, obsAlinyRead: 1 } as any : null);
    toast.success('Marcado como lido');
  };

  if (!post || !editingPost) return null;

  const network = NETWORK_CONFIG[post.socialNetwork];
  const sc = STATUS_CONFIG[editingPost.status];
  const history = getHistory();
  const obsAliny = (editingPost as any).obsAliny || '';
  const obsAlinyRead = (editingPost as any).obsAlinyRead;
  const hasUnreadAliny = obsAliny.replace(/<[^>]*>/g, '').trim() || history.length > 0;
  const canvaLink = editingPost.canvaLink || '';
  const cc = CLIENT_CONFIG[(post as any).client || 'alinyrayze'] ?? CLIENT_CONFIG.alinyrayze;

  return (
    <AnimatePresence>
      {post && (
        <>
          {/* Lightbox */}
          <AnimatePresence>
            {lightbox && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setLightbox(null)}
                style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', cursor: 'zoom-out' }}
              >
                <img src={lightbox} alt="Capa completa" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 100 }} />

          {/* Panel */}
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '520px', background: 'var(--bg)', zIndex: 101, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: network?.color, flexShrink: 0 }} />
                  <span className="label">{network?.label}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: sc.color, background: sc.bg, padding: '0.15rem 0.5rem', borderRadius: '20px', border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                  {hasUnreadAliny && !obsAlinyRead && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4E7052', background: 'rgba(107,138,110,0.15)', border: '1px solid rgba(107,138,110,0.35)', padding: '0.1rem 0.45rem', borderRadius: '20px' }}>✎ {cc.firstName}</span>
                  )}
                </div>
                <h2 style={{ fontFamily: 'DM Sans, system-ui', fontSize: '1.1rem', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {post.titulo}
                </h2>
              </div>
              <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', flexShrink: 0, color: 'var(--text-secondary)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>

              {/* ── Cover image (all formats) ── */}
              {(() => {
                const imageAtts = ((attachmentsQuery.data as Attachment[] | undefined) || []).filter(a => a.mimeType?.startsWith('image/'));
                const isCarousel = editingPost.formato === 'Carrossel';

                if (isCarousel && imageAtts.length > 0) {
                  const safeIdx = Math.min(carouselIdx, imageAtts.length - 1);
                  const current = imageAtts[safeIdx];
                  return (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'zoom-in' }} onClick={() => setLightbox(current.fileUrl)}>
                        <img src={current.fileUrl} alt={current.fileName} style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        {imageAtts.length > 1 && (
                          <>
                            <button onClick={e => { e.stopPropagation(); setCarouselIdx(i => Math.max(0, i - 1)); }} disabled={safeIdx === 0} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: safeIdx === 0 ? 'not-allowed' : 'pointer', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safeIdx === 0 ? 0.35 : 1 }}>‹</button>
                            <button onClick={e => { e.stopPropagation(); setCarouselIdx(i => Math.min(imageAtts.length - 1, i + 1)); }} disabled={safeIdx === imageAtts.length - 1} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: safeIdx === imageAtts.length - 1 ? 'not-allowed' : 'pointer', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safeIdx === imageAtts.length - 1 ? 0.35 : 1 }}>›</button>
                          </>
                        )}
                        <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '5px' }}>
                          {imageAtts.map((_, i) => <button key={i} onClick={e => { e.stopPropagation(); setCarouselIdx(i); }} style={{ width: i === safeIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === safeIdx ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />)}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.4rem', textAlign: 'center' }}>{safeIdx + 1} / {imageAtts.length} · {current.fileName} · <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setLightbox(current.fileUrl)}>ver completa</span></p>
                    </div>
                  );
                }

                if (editingPost.coverImageUrl) {
                  return (
                    <div style={{ marginBottom: '0.75rem', cursor: 'zoom-in' }} onClick={() => setLightbox(editingPost.coverImageUrl!)}>
                      <img src={editingPost.coverImageUrl} alt={editingPost.titulo} style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', maxHeight: '220px', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '0.3rem', cursor: 'pointer' }}>clique para ver completa</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Upload cover — all formats */}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', cursor: uploadCover.isPending ? 'wait' : 'pointer', color: uploadCover.isPending ? 'var(--text-tertiary)' : 'var(--text-secondary)', fontSize: '0.78rem', opacity: uploadCover.isPending ? 0.6 : 1 }}>
                <Upload size={13} />
                {uploadCover.isPending ? 'Enviando...' : editingPost.coverImageUrl ? 'Trocar capa' : 'Adicionar capa'}
                <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadCover.isPending} onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              </label>

              {/* Fields */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {/* Status */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Status</span>
                  <select value={editingPost.status} onChange={e => updateField('status', e.target.value as Post['status'])} style={{ width: '100%', fontSize: '0.85rem', fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.color}30`, borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer' }}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>

                {/* Scheduled date */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Data agendada</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    <input type="date" value={editingPost.scheduledDate ? new Date(editingPost.scheduledDate).toISOString().split('T')[0] : ''} onChange={e => updateField('scheduledDate', e.target.value ? new Date(e.target.value + 'T12:00:00').getTime() : null)} style={{ flex: 1, fontSize: '0.85rem' }} />
                    {editingPost.scheduledDate && <button onClick={() => updateField('scheduledDate', null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.2rem' }}><X size={13} /></button>}
                  </div>
                </div>

                {/* Formato */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Formato</span>
                  <select value={editingPost.formato} onChange={e => updateField('formato', e.target.value)} style={{ width: '100%', fontSize: '0.85rem' }}>
                    {(FORMAT_OPTIONS[post.socialNetwork] || ['Post']).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Pilar */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Pilar de Conteúdo</span>
                  {(() => {
                    const postPilares = getPilares((post as any).client || 'alinyrayze');
                    const activePilar = postPilares.find(p => p.id === (editingPost as any).pilar);
                    return (
                      <select value={(editingPost as any).pilar || ''} onChange={e => (updateField as any)('pilar', e.target.value || null)} style={{ width: '100%', fontSize: '0.85rem', fontWeight: activePilar ? 600 : 400, color: activePilar ? activePilar.color : 'var(--text-secondary)', background: activePilar ? `${activePilar.color}10` : 'var(--bg-elevated)', border: activePilar ? `1px solid ${activePilar.color}40` : '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <option value="">— Nenhum pilar —</option>
                        {postPilares.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    );
                  })()}
                </div>

                {/* Responsavel */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Responsável</span>
                  <input type="text" placeholder="Nome do responsável" value={editingPost.responsavel || ''} onChange={e => updateField('responsavel', e.target.value)} style={{ width: '100%', fontSize: '0.85rem' }} />
                </div>

                {/* Título */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Título</span>
                  <input type="text" value={editingPost.titulo} onChange={e => updateField('titulo', e.target.value)} style={{ width: '100%', fontSize: '0.85rem' }} />
                </div>

                {/* Copy */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Copy</span>
                  <RichTextEditor value={editingPost.conteudo || ''} onChange={v => updateField('conteudo', v)} placeholder="Escreva o copy do post..." minHeight={100} />
                </div>

                {/* Legenda */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Legenda / Caption</span>
                  <RichTextEditor value={editingPost.legenda || ''} onChange={v => updateField('legenda', v)} placeholder="Escreva a legenda do post..." minHeight={120} />
                </div>

                {/* Link (renamed from Canva) */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Link</span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input type="url" placeholder="https://..." value={canvaLink} onChange={e => updateField('canvaLink', e.target.value)} style={{ flex: 1, fontSize: '0.82rem' }} />
                    {canvaLink && (
                      <a href={canvaLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#5c7aff', fontWeight: 600, textDecoration: 'none', padding: '0.3rem 0.65rem', border: '1px solid rgba(92,122,255,0.3)', borderRadius: '7px', background: 'rgba(92,122,255,0.07)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <ExternalLink size={11} /> Abrir
                      </a>
                    )}
                  </div>
                </div>

                {/* Metrics (postado) */}
                {post.status === 'postado' && (
                  <div>
                    <span className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Métricas</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                      {([{ key: 'alcance', label: 'Alcance' }, { key: 'curtidas', label: 'Curtidas' }, { key: 'compartilhamentos', label: 'Compartilhamentos' }, { key: 'comentariosCount', label: 'Comentários' }, { key: 'salvamentos', label: 'Salvamentos' }, { key: 'visualizacoes', label: 'Visualizações' }] as { key: keyof Post, label: string }[]).map(({ key, label }) => (
                        <div key={key} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem' }}>
                          <span className="label" style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.55rem' }}>{label}</span>
                          <input type="number" placeholder="—" value={(editingPost[key] as number) ?? ''} onChange={e => updateField(key, e.target.value ? parseInt(e.target.value) as any : null)} style={{ width: '100%', fontSize: '0.9rem', fontWeight: 600, border: 'none', background: 'transparent', padding: 0, color: 'var(--text-primary)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ── Observações Aliny ── */}
              <section style={{ marginTop: '1.25rem', borderRadius: '12px', border: '1.5px solid rgba(107,138,110,0.35)', background: 'rgba(107,138,110,0.04)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.85rem', background: 'rgba(107,138,110,0.10)', borderBottom: '1px solid rgba(107,138,110,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4E7052', letterSpacing: '0.05em', textTransform: 'uppercase' }}>✎ Observações {cc.firstName}</span>
                    <span style={{ fontSize: '0.64rem', color: '#6B8A6E', fontStyle: 'italic' }}>— sugestões e aprovações</span>
                  </div>
                  {hasUnreadAliny && !obsAlinyRead && (
                    <button onClick={handleMarkRead} style={{ fontSize: '0.65rem', color: '#6B8A6E', background: 'none', border: '1px solid rgba(107,138,110,0.35)', borderRadius: '6px', padding: '0.2rem 0.55rem', cursor: 'pointer', fontWeight: 600 }}>
                      ✓ Marcar como lido
                    </button>
                  )}
                  {obsAlinyRead === 1 && (
                    <span style={{ fontSize: '0.62rem', color: '#6B8A6E', fontStyle: 'italic', opacity: 0.7 }}>lido ✓</span>
                  )}
                </div>

                {/* RichTextEditor */}
                <div style={{ padding: '0.25rem 0.25rem 0' }}>
                  <RichTextEditor value={obsAliny} onChange={v => updateAny('obsAliny', v)} placeholder={`Espaço para anotações ${cc.preposition} ${cc.firstName}...`} minHeight={72} />
                </div>

                {/* Approval buttons */}
                <div style={{ padding: '0.6rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {APPROVAL_ACTIONS.map(a => (
                      <button key={a.type} onClick={() => handleApprovalAction(a)}
                        style={{ flex: '1 1 auto', padding: '0.45rem 0.5rem', background: a.bg, border: `1px solid ${a.border}`, borderRadius: '8px', cursor: 'pointer', color: a.color, fontWeight: 700, fontSize: '0.76rem', whiteSpace: 'nowrap', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        {a.emoji} {a.type === 'copy_ok' ? 'Aprovar Copy' : a.type === 'arte_ok' ? 'Aprovar Arte' : a.type === 'ajuste_ok' ? 'Aprovar Ajuste' : 'Autorizar Postagem'}
                      </button>
                    ))}
                    <button onClick={() => setPedirAjuste(v => !v)}
                      style={{ flex: '1 1 auto', padding: '0.45rem 0.5rem', background: pedirAjuste ? 'rgba(229,160,13,0.18)' : 'rgba(229,160,13,0.08)', border: '1px solid rgba(229,160,13,0.35)', borderRadius: '8px', cursor: 'pointer', color: '#e5a00d', fontWeight: 700, fontSize: '0.76rem', whiteSpace: 'nowrap' }}
                    >
                      ↩ Solicitar Ajuste
                    </button>
                  </div>

                  {/* Pedir ajuste form */}
                  {pedirAjuste && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <textarea rows={2} placeholder="Descreva o ajuste necessário (opcional)..." value={ajusteNote} onChange={e => setAjusteNote(e.target.value)} style={{ width: '100%', fontSize: '0.82rem', resize: 'none', borderRadius: '7px', border: '1px solid rgba(229,160,13,0.3)', padding: '0.45rem 0.6rem', background: 'rgba(229,160,13,0.04)' }} />
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => { setPedirAjuste(false); setAjusteNote(''); }} style={{ flex: 1, padding: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cancelar</button>
                        <button onClick={handlePedirAjuste} style={{ flex: 2, padding: '0.4rem', background: '#e5a00d', border: 'none', borderRadius: '7px', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>↩ Enviar solicitação</button>
                      </div>
                    </div>
                  )}

                  {/* History toggle + timeline */}
                  {history.length > 0 && (
                    <div>
                      <button onClick={() => setShowHistory(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6B8A6E', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0' }}>
                        {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        Histórico ({history.length})
                      </button>
                      {showHistory && (
                        <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {history.map((ev, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.4)', borderRadius: '6px', border: `1px solid ${ev.color}25` }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: '0.25rem' }} />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ev.color }}>{ev.label}</span>
                                {ev.note && <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>— {ev.note}</span>}
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{fmtTs(ev.timestamp)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Attachments */}
              <section style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Paperclip size={11} /> Anexos</span>
                  <label style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Upload size={12} /> Adicionar
                    <input type="file" multiple style={{ display: 'none' }} onChange={e => Array.from(e.target.files || []).forEach(f => handleFileUpload(f))} />
                  </label>
                </div>
                {(attachmentsQuery.data as Attachment[] | undefined)?.map(att => (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: '0.35rem' }}>
                    <a href={att.fileUrl} target="_blank" rel="noopener" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                      <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} /> {att.fileName}
                    </a>
                    <button onClick={() => deleteAttachment.mutate({ id: att.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.1rem' }}><X size={13} /></button>
                  </div>
                ))}
                {attachmentsQuery.data?.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Nenhum anexo</p>}
              </section>

              {/* Comments */}
              <section style={{ marginTop: '1.5rem' }}>
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem' }}>
                  <MessageSquare size={11} /> Comentários ({commentsQuery.data?.length || 0})
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 0.65rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Gow Agency
                  </div>
                  <input type="text" placeholder="Escreva um comentário..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} style={{ flex: 1, fontSize: '0.82rem' }} />
                  <button onClick={handleAddComment} disabled={!commentText.trim()} style={{ background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: commentText.trim() ? 1 : 0.4 }}>
                    <SendIcon size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(commentsQuery.data as Comment[] | undefined)?.map(c => (
                    <div key={c.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.authorName || 'Anônimo'}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.content}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div style={{ height: '2rem' }} />
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave} disabled={updatePost.isPending} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem 1rem', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: updatePost.isPending ? 0.7 : 1 }}>
                <Save size={14} /> {updatePost.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button onClick={() => { if (confirm('Remover este post?')) deletePost.mutate({ id: post.id }); }} style={{ padding: '0.65rem 0.75rem', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={15} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

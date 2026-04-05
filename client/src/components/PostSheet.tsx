import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Trash2, MessageSquare, Paperclip, ExternalLink,
  Check, Upload, Calendar,
  Send as SendIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import type { Post, Comment, Attachment } from '@shared/types';
import { NETWORK_CONFIG, STATUS_CONFIG, FORMAT_OPTIONS } from '@/lib/config';

interface PostSheetProps {
  post: Post | null;
  onClose: () => void;
}

export default function PostSheet({ post, onClose }: PostSheetProps) {
  const utils = trpc.useUtils();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [commentAuthor, setCommentAuthor] = useState(
    () => localStorage.getItem('gow_author') || ''
  );
  const [commentText, setCommentText] = useState('');
  const [showAjuste, setShowAjuste] = useState(false);
  const [ajusteText, setAjusteText] = useState('');

  useEffect(() => {
    if (post) setEditingPost({ ...post });
  }, [post]);

  useEffect(() => {
    if (commentAuthor) localStorage.setItem('gow_author', commentAuthor);
  }, [commentAuthor]);

  const updatePost = trpc.posts.update.useMutation({
    onSuccess: () => { utils.posts.invalidate(); toast.success('Alterações salvas'); },
  });
  const deletePost = trpc.posts.delete.useMutation({
    onSuccess: () => { utils.posts.invalidate(); toast.success('Post removido'); onClose(); },
  });
  const commentsQuery = trpc.comments.byPost.useQuery(
    { postId: post?.id ?? 0 },
    { enabled: !!post }
  );
  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.byPost.invalidate({ postId: post?.id ?? 0 });
      toast.success('Comentário adicionado');
      setCommentText('');
    },
  });
  const attachmentsQuery = trpc.attachments.byPost.useQuery(
    { postId: post?.id ?? 0 },
    { enabled: !!post }
  );
  const uploadAttachment = trpc.attachments.upload.useMutation({
    onSuccess: () => {
      utils.attachments.byPost.invalidate({ postId: post?.id ?? 0 });
      toast.success('Arquivo anexado');
    },
  });
  const deleteAttachment = trpc.attachments.delete.useMutation({
    onSuccess: () => utils.attachments.byPost.invalidate({ postId: post?.id ?? 0 }),
  });
  const uploadCover = trpc.posts.uploadCover.useMutation({
    onSuccess: () => { utils.posts.invalidate(); toast.success('Capa atualizada'); },
  });

  const handleSave = useCallback(() => {
    if (!editingPost) return;
    const { id, createdAt, updatedAt, sortOrder, checklist, ...rest } = editingPost;
    updatePost.mutate({
      id,
      ...rest,
      ...(sortOrder !== null ? { sortOrder } : {}),
      ...(checklist !== null ? { checklist } : {}),
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
    createComment.mutate({
      postId: post.id,
      authorName: commentAuthor || 'Anônimo',
      content: commentText.trim(),
    });
  }, [post, commentAuthor, commentText, createComment]);

  const updateField = <K extends keyof Post>(field: K, value: Post[K]) => {
    setEditingPost(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleAprovar = useCallback(() => {
    if (!post) return;
    createComment.mutate({ postId: post.id, authorName: commentAuthor || 'Cliente', content: '✓ Aprovado' });
    updatePost.mutate({ id: post.id, status: 'aprovado' });
    setEditingPost(prev => prev ? { ...prev, status: 'aprovado' } : null);
    toast.success('Post aprovado!');
  }, [post, commentAuthor, createComment, updatePost]);

  const handleAjuste = useCallback(() => {
    if (!post || !ajusteText.trim()) return;
    createComment.mutate({ postId: post.id, authorName: commentAuthor || 'Cliente', content: `↩ Ajuste: ${ajusteText.trim()}` });
    updatePost.mutate({ id: post.id, status: 'em_aprovacao' });
    setEditingPost(prev => prev ? { ...prev, status: 'em_aprovacao' } : null);
    setShowAjuste(false);
    setAjusteText('');
    toast.success('Solicitação de ajuste enviada');
  }, [post, ajusteText, commentAuthor, createComment, updatePost]);

  if (!post || !editingPost) return null;

  const network = NETWORK_CONFIG[post.socialNetwork];
  const sc = STATUS_CONFIG[editingPost.status];
  const checklist = editingPost.checklist || { legenda: false, arte: false, revisao: false, aprovacao: false };

  return (
    <AnimatePresence>
      {post && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)', zIndex: 100,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%',
              maxWidth: '520px', background: 'var(--bg)', zIndex: 101,
              display: 'flex', flexDirection: 'column',
              borderLeft: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: '1rem',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: network?.color, flexShrink: 0 }} />
                  <span className="label">{network?.label}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, color: sc.color,
                    background: sc.bg, padding: '0.15rem 0.5rem', borderRadius: '20px',
                    border: `1px solid ${sc.color}30`,
                  }}>{sc.label}</span>
                </div>
                <h2 style={{
                  fontFamily: 'DM Sans, system-ui', fontSize: '1.1rem', fontWeight: 400,
                  color: 'var(--text-primary)', lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {post.titulo}
                </h2>
              </div>
              <button onClick={onClose} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', flexShrink: 0,
                color: 'var(--text-secondary)', display: 'flex',
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>

              {/* Cover image */}
              {post.coverImageUrl && (
                <img
                  src={post.coverImageUrl}
                  alt={post.titulo}
                  style={{ width: '100%', borderRadius: '10px', marginBottom: '1rem', objectFit: 'cover', maxHeight: '200px' }}
                />
              )}

              {/* Upload cover */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem',
                cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.78rem',
              }}>
                <Upload size={13} />
                {post.coverImageUrl ? 'Trocar capa' : 'Adicionar capa'}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              </label>

              {/* Fields */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {/* Status */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Status</span>
                  <select
                    value={editingPost.status}
                    onChange={e => updateField('status', e.target.value as Post['status'])}
                    style={{
                      width: '100%', fontSize: '0.85rem', fontWeight: 600,
                      color: sc.color, background: sc.bg, border: `1px solid ${sc.color}30`,
                      borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer',
                    }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Scheduled date */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Data agendada</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    <input
                      type="date"
                      value={editingPost.scheduledDate
                        ? new Date(editingPost.scheduledDate).toISOString().split('T')[0]
                        : ''}
                      onChange={e => updateField('scheduledDate', e.target.value
                        ? new Date(e.target.value + 'T12:00:00').getTime()
                        : null)}
                      style={{ flex: 1, fontSize: '0.85rem' }}
                    />
                    {editingPost.scheduledDate && (
                      <button
                        onClick={() => updateField('scheduledDate', null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.2rem' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Formato */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Formato</span>
                  <select
                    value={editingPost.formato}
                    onChange={e => updateField('formato', e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    {(FORMAT_OPTIONS[post.socialNetwork] || ['Post']).map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Responsavel */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Responsável</span>
                  <input
                    type="text"
                    placeholder="Nome do responsável"
                    value={editingPost.responsavel || ''}
                    onChange={e => updateField('responsavel', e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Título */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Título</span>
                  <input
                    type="text"
                    value={editingPost.titulo}
                    onChange={e => updateField('titulo', e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Conteúdo */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Copy</span>
                  <textarea
                    rows={3}
                    placeholder="Escreva o copy do post..."
                    value={editingPost.conteudo || ''}
                    onChange={e => updateField('conteudo', e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>

                {/* Legenda */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Legenda / Caption</span>
                  <textarea
                    rows={4}
                    placeholder="Escreva a legenda do post..."
                    value={editingPost.legenda || ''}
                    onChange={e => updateField('legenda', e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>

                {/* Links */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Canva</span>
                    <input
                      type="url"
                      placeholder="Link do Canva"
                      value={editingPost.canvaLink || ''}
                      onChange={e => updateField('canvaLink', e.target.value)}
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Post publicado</span>
                    <input
                      type="url"
                      placeholder="Link do post"
                      value={editingPost.postUrl || ''}
                      onChange={e => updateField('postUrl', e.target.value)}
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <span className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Checklist</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {(['legenda', 'arte', 'revisao', 'aprovacao'] as const).map(key => {
                      const labels = { legenda: 'Legenda', arte: 'Arte', revisao: 'Revisão', aprovacao: 'Aprovação' };
                      const checked = checklist[key] || false;
                      return (
                        <button
                          key={key}
                          onClick={() => updateField('checklist', { ...checklist, [key]: !checked })}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.4rem 0.6rem', borderRadius: '8px', cursor: 'pointer',
                            background: checked ? 'rgba(34,197,94,0.08)' : 'var(--bg-elevated)',
                            border: checked ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                            color: checked ? '#22c55e' : 'var(--text-secondary)',
                            fontSize: '0.78rem', fontWeight: 500,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: '4px',
                            background: checked ? '#22c55e' : 'transparent',
                            border: checked ? '1px solid #22c55e' : '1px solid var(--border-strong)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                          </div>
                          {labels[key]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Metrics (for published posts) */}
                {post.status === 'postado' && (
                  <div>
                    <span className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Métricas</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                      {(
                        [
                          { key: 'alcance' as const, label: 'Alcance' },
                          { key: 'curtidas' as const, label: 'Curtidas' },
                          { key: 'compartilhamentos' as const, label: 'Compartilhamentos' },
                          { key: 'comentariosCount' as const, label: 'Comentários' },
                          { key: 'salvamentos' as const, label: 'Salvamentos' },
                          { key: 'visualizacoes' as const, label: 'Visualizações' },
                        ] as const
                      ).map(({ key, label }) => (
                        <div key={key} style={{
                          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                          borderRadius: '8px', padding: '0.5rem',
                        }}>
                          <span className="label" style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.55rem' }}>{label}</span>
                          <input
                            type="number"
                            placeholder="—"
                            value={editingPost[key] ?? ''}
                            onChange={e => updateField(key, e.target.value ? parseInt(e.target.value) : null)}
                            style={{
                              width: '100%', fontSize: '0.9rem', fontWeight: 600,
                              border: 'none', background: 'transparent', padding: 0,
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Aprovação */}
              <section style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(92,122,255,0.04)', border: '1px solid rgba(92,122,255,0.15)' }}>
                <span className="label" style={{ display: 'block', marginBottom: '0.75rem' }}>Aprovação</span>
                {!showAjuste ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleAprovar} style={{ flex: 1, padding: '0.6rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', cursor: 'pointer', color: '#22c55e', fontWeight: 600, fontSize: '0.85rem' }}>
                      ✓ Aprovar
                    </button>
                    <button onClick={() => setShowAjuste(true)} style={{ flex: 1, padding: '0.6rem', background: 'rgba(229,160,13,0.08)', border: '1px solid rgba(229,160,13,0.25)', borderRadius: '8px', cursor: 'pointer', color: '#e5a00d', fontWeight: 600, fontSize: '0.85rem' }}>
                      ↩ Solicitar ajuste
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <textarea rows={3} placeholder="Quais ajustes você quer?" value={ajusteText} onChange={e => setAjusteText(e.target.value)} style={{ width: '100%', fontSize: '0.85rem', resize: 'none' }} />
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => setShowAjuste(false)} style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Cancelar</button>
                      <button onClick={handleAjuste} disabled={!ajusteText.trim()} style={{ flex: 2, padding: '0.5rem', background: '#e5a00d', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: '0.82rem', opacity: ajusteText.trim() ? 1 : 0.5 }}>Enviar solicitação</button>
                    </div>
                  </div>
                )}
              </section>

              {/* Attachments */}
              <section style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Paperclip size={11} /> Anexos
                  </span>
                  <label style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Upload size={12} /> Adicionar
                    <input type="file" multiple style={{ display: 'none' }}
                      onChange={e => Array.from(e.target.files || []).forEach(f => handleFileUpload(f))} />
                  </label>
                </div>
                {(attachmentsQuery.data as Attachment[] | undefined)?.map(att => (
                  <div key={att.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', borderRadius: '8px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    marginBottom: '0.35rem',
                  }}>
                    <a href={att.fileUrl} target="_blank" rel="noopener"
                      style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                      <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} />
                      {att.fileName}
                    </a>
                    <button onClick={() => deleteAttachment.mutate({ id: att.id })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.1rem' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {attachmentsQuery.data?.length === 0 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Nenhum anexo</p>
                )}
              </section>

              {/* Comments */}
              <section style={{ marginTop: '1.5rem' }}>
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem' }}>
                  <MessageSquare size={11} /> Comentários ({commentsQuery.data?.length || 0})
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={commentAuthor}
                    onChange={e => setCommentAuthor(e.target.value)}
                    style={{ width: '120px', fontSize: '0.82rem', flexShrink: 0 }}
                  />
                  <input
                    type="text"
                    placeholder="Escreva um comentário..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    style={{ flex: 1, fontSize: '0.82rem' }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    style={{
                      background: 'var(--text-primary)', color: 'var(--bg)', border: 'none',
                      borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', opacity: commentText.trim() ? 1 : 0.4,
                    }}
                  >
                    <SendIcon size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(commentsQuery.data as Comment[] | undefined)?.map(c => (
                    <div key={c.id} style={{
                      padding: '0.6rem 0.75rem', borderRadius: '8px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.authorName || 'Anônimo'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          {new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.content}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div style={{ height: '2rem' }} />
            </div>

            {/* Footer actions */}
            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '0.5rem',
            }}>
              <button
                onClick={handleSave}
                disabled={updatePost.isPending}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.65rem 1rem', background: 'var(--text-primary)', color: 'var(--bg)',
                  border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                  opacity: updatePost.isPending ? 0.7 : 1,
                }}
              >
                <Save size={14} /> {updatePost.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button
                onClick={() => {
                  if (confirm('Remover este post?')) deletePost.mutate({ id: post.id });
                }}
                style={{
                  padding: '0.65rem 0.75rem', background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

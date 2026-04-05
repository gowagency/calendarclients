import React from 'react';
import {
  Instagram, Linkedin, Youtube, Music, Newspaper,
  Clock, Pencil, Eye, CheckCircle2, Send as SendIcon,
} from 'lucide-react';

// ─── SOCIAL NETWORKS ───────────────────────────────────────────────────────

export const NETWORKS = [
  { id: 'all', label: 'Todas', color: 'var(--text-secondary)' },
  { id: 'instagram', label: 'Instagram', Icon: Instagram, color: '#E1306C' },
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin, color: '#0A66C2' },
  { id: 'substack', label: 'Substack', Icon: Newspaper, color: '#FF6719' },
  { id: 'spotify', label: 'Spotify', Icon: Music, color: '#1DB954' },
  { id: 'youtube', label: 'YouTube', Icon: Youtube, color: '#FF0000' },
] as const;

/** Networks shown in the UI filter — only active ones for the current client setup */
export const ACTIVE_NETWORKS = NETWORKS.filter(n =>
  ['all', 'instagram', 'spotify'].includes(n.id)
);

export const NETWORK_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  instagram: { label: 'Instagram', color: '#E1306C', Icon: Instagram },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', Icon: Linkedin },
  substack: { label: 'Substack', color: '#FF6719', Icon: Newspaper },
  spotify: { label: 'Spotify', color: '#1DB954', Icon: Music },
  youtube: { label: 'YouTube', color: '#FF0000', Icon: Youtube },
};

// ─── STATUS ────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  nao_iniciado: {
    label: 'Não iniciado',
    color: 'var(--text-tertiary)',
    bg: 'var(--bg-elevated)',
    icon: React.createElement(Clock, { size: 12 }),
  },
  em_andamento: {
    label: 'Em andamento',
    color: '#5c7aff',
    bg: 'rgba(92,122,255,0.08)',
    icon: React.createElement(Pencil, { size: 12 }),
  },
  em_aprovacao: {
    label: 'Em aprovação',
    color: '#e5a00d',
    bg: 'rgba(229,160,13,0.08)',
    icon: React.createElement(Eye, { size: 12 }),
  },
  aprovado: {
    label: 'Aprovado',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    icon: React.createElement(CheckCircle2, { size: 12 }),
  },
  postado: {
    label: 'Postado',
    color: 'var(--text-secondary)',
    bg: 'var(--bg-secondary)',
    icon: React.createElement(SendIcon, { size: 12 }),
  },
};

export const STATUS_ORDER = ['nao_iniciado', 'em_andamento', 'em_aprovacao', 'aprovado', 'postado'] as const;

// ─── FORMATS ───────────────────────────────────────────────────────────────

export const FORMAT_OPTIONS: Record<string, string[]> = {
  instagram: ['Reels', 'Carrossel', 'Foto', 'Estático', 'Story', 'Post'],
  linkedin: ['Post', 'Artigo', 'Newsletter', 'Evento'],
  substack: ['Newsletter', 'Post'],
  spotify: ['Episódio', 'Trailer'],
  youtube: ['Vídeo', 'Short', 'Live', 'Podcast'],
};

/**
 * Color per format — used in calendar cards to visually distinguish content type.
 * Spotify posts always use spotify green regardless of formato.
 */
export const FORMAT_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  'Reels':    { color: '#E1306C', bg: 'rgba(225,48,108,0.13)',  border: 'rgba(225,48,108,0.35)' },
  'Carrossel':{ color: '#D97706', bg: 'rgba(217,119,6,0.13)',   border: 'rgba(217,119,6,0.35)'  },
  'Foto':     { color: '#0891B2', bg: 'rgba(8,145,178,0.13)',   border: 'rgba(8,145,178,0.35)'  },
  'Estático': { color: '#7C3AED', bg: 'rgba(124,58,237,0.13)',  border: 'rgba(124,58,237,0.35)' },
  'Story':    { color: '#DB2777', bg: 'rgba(219,39,119,0.13)',  border: 'rgba(219,39,119,0.35)' },
  // legacy "Post" maps to Foto color
  'Post':     { color: '#0891B2', bg: 'rgba(8,145,178,0.13)',   border: 'rgba(8,145,178,0.35)'  },
  // Spotify formats
  'Episódio': { color: '#16A34A', bg: 'rgba(22,163,74,0.13)',   border: 'rgba(22,163,74,0.35)'  },
  'Trailer':  { color: '#16A34A', bg: 'rgba(22,163,74,0.13)',   border: 'rgba(22,163,74,0.35)'  },
  // fallback
  '_default': { color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', border: 'var(--border)' },
};

export function getFormatColor(formato: string, socialNetwork?: string) {
  if (socialNetwork === 'spotify') return FORMAT_COLOR['Episódio'];
  return FORMAT_COLOR[formato] ?? FORMAT_COLOR['_default'];
}

// ─── PILARES DE CONTEÚDO ───────────────────────────────────────────────────

export const PILARES = [
  { id: 'estrutura',                 label: 'Estrutura',                  color: '#F59E0B' },
  { id: 'consciencia',               label: 'Consciência',                color: '#3B82F6' },
  { id: 'acolhimento_adulto',        label: 'Acolhimento Adulto',         color: '#22C55E' },
  { id: 'estetica_da_ordem',         label: 'Estética da Ordem',          color: '#EC4899' },
  { id: 'espiritualidade_implicita', label: 'Espiritualidade Implícita',  color: '#8B5CF6' },
] as const;

export type PilarId = typeof PILARES[number]['id'];

// ─── CALENDAR ──────────────────────────────────────────────────────────────

export const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

export const FERIADOS_BR: Record<string, string> = {
  '2026-01-01': 'Ano Novo',
  '2026-02-16': 'Carnaval',
  '2026-02-17': 'Carnaval',
  '2026-04-03': 'Sexta-feira Santa',
  '2026-04-21': 'Tiradentes',
  '2026-05-01': 'Dia do Trabalho',
  '2026-06-04': 'Corpus Christi',
  '2026-09-07': 'Independência',
  '2026-10-12': 'N. Sra. Aparecida',
  '2026-11-02': 'Finados',
  '2026-11-15': 'Proclamação da República',
  '2026-12-25': 'Natal',
};

// ─── HELPERS ───────────────────────────────────────────────────────────────

export function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 5 }, (_, i) => {
    const next = new Date(d);
    next.setDate(d.getDate() + i);
    return next;
  });
}

export function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateBR(d: Date): string {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${d.getDate()} de ${months[d.getMonth()]}`;
}

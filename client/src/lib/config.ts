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
// Paleta Aliny Rayze: chocolate • camel • taupe • sage green • terracotta
export const FORMAT_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  // Reels — destaque máximo: chocolate escuro
  'Reels':    { color: '#7B3A12', bg: 'rgba(123,58,18,0.14)',   border: 'rgba(123,58,18,0.32)'  },
  // Carrossel — bege camel
  'Carrossel':{ color: '#A07848', bg: 'rgba(160,120,72,0.14)',  border: 'rgba(160,120,72,0.32)' },
  // Foto — taupe claro/neutro quente
  'Foto':     { color: '#8B8177', bg: 'rgba(139,129,119,0.12)', border: 'rgba(139,129,119,0.28)'},
  // Estático — sage green suave
  'Estático': { color: '#6B8A6E', bg: 'rgba(107,138,110,0.13)', border: 'rgba(107,138,110,0.30)'},
  // Story — terracotta rosado
  'Story':    { color: '#A4735E', bg: 'rgba(164,115,94,0.13)',  border: 'rgba(164,115,94,0.30)' },
  // Post (legado) → mesmo que Foto
  'Post':     { color: '#8B8177', bg: 'rgba(139,129,119,0.12)', border: 'rgba(139,129,119,0.28)'},
  // Spotify — sage green (paleta da marca)
  'Episódio': { color: '#6B8A6E', bg: 'rgba(107,138,110,0.13)', border: 'rgba(107,138,110,0.30)'},
  'Trailer':  { color: '#6B8A6E', bg: 'rgba(107,138,110,0.13)', border: 'rgba(107,138,110,0.30)'},
  // fallback
  '_default': { color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', border: 'var(--border)' },
};

export function getFormatColor(formato: string, socialNetwork?: string) {
  if (socialNetwork === 'spotify') return FORMAT_COLOR['Episódio'];
  return FORMAT_COLOR[formato] ?? FORMAT_COLOR['_default'];
}

// ─── PILARES DE CONTEÚDO (por cliente) ────────────────────────────────────

// Aliny Rayze — paleta terrosa/sage
const PILARES_ALINY = [
  { id: 'estrutura',                 label: 'Estrutura',                  color: '#7B3A12' }, // chocolate
  { id: 'consciencia',               label: 'Consciência',                color: '#6B8A6E' }, // sage green
  { id: 'acolhimento_adulto',        label: 'Acolhimento Adulto',         color: '#A07848' }, // camel
  { id: 'estetica_da_ordem',         label: 'Estética da Ordem',          color: '#8B8177' }, // taupe
  { id: 'espiritualidade_implicita', label: 'Espiritualidade Implícita',  color: '#A4735E' }, // terracotta
] as const;

// Junior Lopes — paleta sóbria, verde musgo e terrosos
const PILARES_JUNIOR = [
  { id: 'gestao_empresarial',  label: 'Gestão Empresarial',  color: '#3D5C3A' }, // verde musgo profundo
  { id: 'lideranca',           label: 'Liderança',           color: '#5C7A5C' }, // verde musgo médio
  { id: 'consultoria',         label: 'Consultoria',         color: '#7A7A4A' }, // oliva terroso
  { id: 'humanizacao',         label: 'Humanização',         color: '#7A6B5A' }, // pedra quente
  { id: 'altus_contabilidade', label: 'Altus Contabilidade', color: '#4A5C4A' }, // musgo escuro
  { id: 'enjoy_educacao',      label: 'Enjoy Educação',      color: '#5C4A3A' }, // terra escura
] as const;

const PILARES_BY_CLIENT: Record<string, readonly { id: string; label: string; color: string }[]> = {
  alinyrayze:  PILARES_ALINY,
  juniorlopes: PILARES_JUNIOR,
};

/** Returns the pilares for a given client slug (falls back to Aliny's if unknown) */
export function getPilares(client: string): readonly { id: string; label: string; color: string }[] {
  return PILARES_BY_CLIENT[client] ?? PILARES_ALINY;
}

/** Per-client display config (name, pronouns) for dynamic labels */
export const CLIENT_CONFIG: Record<string, { firstName: string; pronoun: string; preposition: string }> = {
  alinyrayze:  { firstName: 'Aliny',  pronoun: 'dela', preposition: 'da'  },
  juniorlopes: { firstName: 'Junior', pronoun: 'dele', preposition: 'do'  },
};

/** @deprecated use getPilares(client) instead */
export const PILARES = PILARES_ALINY;

export type PilarId = typeof PILARES_ALINY[number]['id'];

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

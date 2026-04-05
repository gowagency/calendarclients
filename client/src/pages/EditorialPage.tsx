import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// ─── TOGGLE SECTION ────────────────────────────────────────────────────────────

function ToggleSection({ title, storageKey, placeholder }: { title: string; storageKey: string; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => localStorage.getItem(storageKey) || '');

  const handleChange = (val: string) => {
    setText(val);
    localStorage.setItem(storageKey, val);
  };

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.9rem 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {open
          ? <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          : <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'DM Sans, system-ui' }}>
          {title}
        </span>
        {text.trim() && (
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.1rem 0.4rem' }}>
            preenchido
          </span>
        )}
      </button>
      {open && (
        <div style={{ paddingBottom: '1rem' }}>
          <textarea
            rows={6}
            placeholder={placeholder}
            value={text}
            onChange={e => handleChange(e.target.value)}
            style={{
              width: '100%', fontSize: '0.875rem', resize: 'vertical',
              lineHeight: 1.7, borderRadius: '10px', padding: '0.75rem',
              border: '1px solid var(--border)', background: 'var(--bg-elevated)',
              color: 'var(--text-primary)', fontFamily: 'inherit',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── EDITORIAL PAGE ────────────────────────────────────────────────────────────

export function EditorialPage({ client }: { client: string }) {
  const k = (s: string) => `gow_${client}_editorial_${s}`;

  const sections = [
    { key: k('pilares'),      title: 'Pilares de Conteúdo',   placeholder: 'Quais são os pilares editoriais? Ex: Educação, Bastidores, Autoridade...' },
    { key: k('frequencia'),   title: 'Frequência e Cadência', placeholder: 'Quantos posts por semana/mês? Em quais dias e horários?' },
    { key: k('formatos'),     title: 'Formatos Prioritários', placeholder: 'Reels, Carrossel, Story, Newsletter... qual a prioridade e por quê?' },
    { key: k('tom'),          title: 'Tom e Linguagem',       placeholder: 'Como é o tom de comunicação? Formal, casual, técnico, inspiracional?' },
    { key: k('temas'),        title: 'Temas Recorrentes',     placeholder: 'Quais temas aparecem com frequência no calendário?' },
    { key: k('objetivos'),    title: 'Objetivos do Conteúdo', placeholder: 'Qual o objetivo principal? Autoridade, conversão, engajamento, alcance?' },
    { key: k('distribuicao'), title: 'Distribuição por Rede', placeholder: 'O que vai para cada plataforma? Instagram, LinkedIn, YouTube...' },
  ];

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'DM Sans, system-ui', fontSize: '1.25rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Linha Editorial
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          Estratégia de conteúdo. Cole ou escreva em cada seção — salva automaticamente.
        </p>
      </div>

      <div>
        {sections.map(s => (
          <ToggleSection key={s.key} title={s.title} storageKey={s.key} placeholder={s.placeholder} />
        ))}
      </div>
    </div>
  );
}

// ─── POSICIONAMENTO PAGE ───────────────────────────────────────────────────────

export function PosicionamentoPage({ client }: { client: string }) {
  const k = (s: string) => `gow_${client}_pos_${s}`;

  const sections = [
    {
      key: k('manifesto'),
      title: '1. Manifesto — visão de mundo',
      placeholder: 'Qual é a visão de mundo que fundamenta tudo? O que você acredita que a maioria não acredita?',
    },
    {
      key: k('narrativa'),
      title: '2. Narrativa Intelectual — sua filosofia',
      placeholder: 'Qual é a sua filosofia central? Como você lê o mundo e as pessoas?',
    },
    {
      key: k('identidade'),
      title: '3. Identidade Pessoal — quem é você',
      placeholder: 'Quem você é? Sua história, trajetória, o que te forma como pessoa e profissional.',
    },
    {
      key: k('voz'),
      title: '4. Guia de Voz — como você fala',
      placeholder: 'Como é sua voz? Palavras que usa, tom, ritmo, o que nunca diz, exemplos de frases.',
    },
    {
      key: k('frameworks'),
      title: '5. Frameworks — como você comunica',
      placeholder: 'Quais modelos mentais, estruturas ou métodos você usa para organizar e comunicar ideias?',
    },
    {
      key: k('posicionamento'),
      title: '6. Posicionamento — seu lugar no mercado',
      placeholder: 'Onde você se posiciona? Para quem? Contra o quê? O que te diferencia?',
    },
    {
      key: k('teses'),
      title: '7. Teses Centrais — o que você pensa',
      placeholder: 'Quais são suas grandes teses? Afirmações corajosas sobre o seu campo.',
    },
    {
      key: k('textos'),
      title: '8. Textos Autorais — suas obras',
      placeholder: 'Seus textos mais importantes. Cole aqui os que definem sua escrita e pensamento.',
    },
    {
      key: k('produtos'),
      title: '9. Arquitetura de Produtos — seu legado',
      placeholder: 'Quais produtos, serviços ou projetos compõem seu ecossistema e legado?',
    },
  ];

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'DM Sans, system-ui', fontSize: '1.25rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Posicionamento
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          Direcionamentos estratégicos. Cole ou escreva em cada seção — salva automaticamente.
        </p>
      </div>

      <div>
        {sections.map(s => (
          <ToggleSection key={s.key} title={s.title} storageKey={s.key} placeholder={s.placeholder} />
        ))}
      </div>
    </div>
  );
}

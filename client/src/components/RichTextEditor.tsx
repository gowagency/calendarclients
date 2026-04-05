import { useRef, useEffect, useCallback } from 'react';

// ─── TOOLBAR BUTTONS ──────────────────────────────────────────────────────────

const TOOLS: { cmd: string; arg?: string; label: string; title: string }[] = [
  { cmd: 'bold',          label: 'B',  title: 'Negrito (Ctrl+B)' },
  { cmd: 'italic',        label: 'I',  title: 'Itálico (Ctrl+I)' },
  { cmd: 'underline',     label: 'U',  title: 'Sublinhado (Ctrl+U)' },
  { cmd: 'formatBlock',   arg: 'h2',   label: 'H1', title: 'Título grande' },
  { cmd: 'formatBlock',   arg: 'h3',   label: 'H2', title: 'Título pequeno' },
  { cmd: 'formatBlock',   arg: 'p',    label: '¶',  title: 'Parágrafo' },
  { cmd: 'insertUnorderedList',        label: '•',  title: 'Lista' },
  { cmd: 'insertOrderedList',          label: '1.',  title: 'Lista numerada' },
  { cmd: 'formatBlock',   arg: 'blockquote', label: '"', title: 'Citação' },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Escreva aqui...', minHeight = 140 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external value → DOM only on mount or when value changes from outside
  const lastHtml = useRef(value);
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value && document.activeElement !== el) {
      el.innerHTML = value;
      lastHtml.current = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html !== lastHtml.current) {
      lastHtml.current = html;
      onChange(html);
    }
  }, [onChange]);

  const exec = (cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
  };

  const isActive = (cmd: string, arg?: string): boolean => {
    try {
      if (cmd === 'formatBlock') return document.queryCommandValue('formatBlock') === arg;
      return document.queryCommandState(cmd);
    } catch { return false; }
  };

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '10px',
      overflow: 'hidden',
      background: 'var(--bg-elevated)',
      transition: 'border-color 0.15s',
    }}
    onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
    onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: '1px', flexWrap: 'wrap',
        padding: '0.35rem 0.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        {TOOLS.map((t, i) => {
          const active = isActive(t.cmd, t.arg);
          const isSeparator = t.cmd === 'formatBlock' && t.arg === 'h2' || t.cmd === 'insertUnorderedList';
          return (
            <>
              {isSeparator && (
                <div key={`sep-${i}`} style={{ width: 1, height: 20, background: 'var(--border)', margin: '2px 3px', alignSelf: 'center' }} />
              )}
              <button
                key={t.cmd + (t.arg ?? '')}
                type="button"
                title={t.title}
                onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.arg); }}
                style={{
                  padding: '0.2rem 0.45rem',
                  minWidth: 28,
                  borderRadius: '5px',
                  border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
                  background: active ? 'var(--bg-elevated)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: t.label === 'B' ? '0.85rem' : t.label === 'I' ? '0.85rem' : '0.75rem',
                  fontWeight: t.label === 'B' ? 700 : t.label === '1.' ? 600 : 500,
                  fontStyle: t.label === 'I' ? 'italic' : 'normal',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: 1,
                  transition: 'all 0.1s',
                  textDecoration: t.label === 'U' ? 'underline' : 'none',
                }}
              >
                {t.label}
              </button>
            </>
          );
        })}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={e => {
          // Ctrl+B / I / U shortcuts
          if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') { e.preventDefault(); exec('bold'); }
            if (e.key === 'i') { e.preventDefault(); exec('italic'); }
            if (e.key === 'u') { e.preventDefault(); exec('underline'); }
          }
        }}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: '0.85rem 1rem',
          outline: 'none',
          fontSize: '0.875rem',
          lineHeight: 1.75,
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          overflowY: 'auto',
          maxHeight: 600,
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-tertiary);
          pointer-events: none;
          display: block;
        }
        [contenteditable] h2 {
          font-size: 1.15rem; font-weight: 600; margin: 0.75em 0 0.25em;
          font-family: 'DM Sans', system-ui; letter-spacing: -0.02em;
          color: var(--text-primary);
        }
        [contenteditable] h3 {
          font-size: 0.95rem; font-weight: 600; margin: 0.6em 0 0.2em;
          color: var(--text-primary);
        }
        [contenteditable] blockquote {
          border-left: 3px solid var(--border-strong);
          padding: 0.25rem 0.75rem;
          margin: 0.5rem 0;
          color: var(--text-secondary);
          font-style: italic;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.4rem; margin: 0.35rem 0;
        }
        [contenteditable] li { margin: 0.15rem 0; }
        [contenteditable] p { margin: 0.25rem 0; }
        [contenteditable] b, [contenteditable] strong { font-weight: 700; }
        [contenteditable] i, [contenteditable] em { font-style: italic; }
      `}</style>
    </div>
  );
}

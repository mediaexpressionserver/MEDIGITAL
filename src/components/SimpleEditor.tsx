// src/components/SimpleEditor.tsx
import React, { useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function SimpleEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Keep editor DOM in sync with incoming value prop
  useEffect(() => {
    if (!ref.current) return;
    if (value === '' && ref.current.innerHTML === '') return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  function ensureFocus() {
    if (!ref.current) return;
    ref.current.focus();
    ref.current.style.direction = 'ltr';
  }

  function exec(cmd: string, val?: string) {
    ensureFocus();
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {}

    try {
      if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
        try {
          document.execCommand(cmd, false, undefined);
        } catch {}

        if (ref.current) {
          const sel = window.getSelection();
          const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
          let anchorNode = sel && sel.anchorNode ? sel.anchorNode : null;
          let anchorElement: Element | null = null;
          if (anchorNode) anchorElement = anchorNode.nodeType === 3 ? (anchorNode.parentElement as Element) : (anchorNode as Element);
          const existingList = anchorElement ? anchorElement.closest('ul,ol') : null;

          if (!existingList) {
            const list = document.createElement(cmd === 'insertOrderedList' ? 'ol' : 'ul');
            list.setAttribute('dir', 'ltr');
            list.style.listStylePosition = 'outside';
            list.style.paddingLeft = '2rem';
            list.style.margin = '0.5rem 0';

            if (!range) {
              const li = document.createElement('li');
              li.innerHTML = '<br>';
              li.style.direction = 'ltr';
              li.style.unicodeBidi = 'isolate';
              li.style.textAlign = 'left';
              list.appendChild(li);
              ref.current.appendChild(list);

              const r = document.createRange();
              r.setStart(li, 0);
              r.collapse(true);
              sel && sel.removeAllRanges();
              sel && sel.addRange(r);
            } else {
              const frag = range.extractContents();
              const li = document.createElement('li');
              li.appendChild(frag);
              li.style.direction = 'ltr';
              li.style.unicodeBidi = 'isolate';
              li.style.textAlign = 'left';
              list.appendChild(li);
              range.insertNode(list);

              const r2 = document.createRange();
              r2.selectNodeContents(li);
              r2.collapse(false);
              sel && sel.removeAllRanges();
              sel && sel.addRange(r2);
            }
          }
        }
      } else {
        document.execCommand(cmd, false, val || undefined);
      }
    } catch (err) {
      console.warn('execCommand failed', cmd, err);
    }

    try {
      if (ref.current) {
        const lists = Array.from(ref.current.querySelectorAll('ul, ol')) as HTMLElement[];
        lists.forEach((list) => {
          list.setAttribute('dir', 'ltr');
          list.style.listStylePosition = 'outside';
          list.style.paddingLeft = '2rem';
          list.style.margin = '0.5rem 0';
          Array.from(list.children).forEach((li) => {
            (li as HTMLElement).style.direction = 'ltr';
            (li as HTMLElement).style.unicodeBidi = 'isolate';
            (li as HTMLElement).style.textAlign = 'left';
          });
        });
      }
    } catch (err) {
      console.warn('list normalization failed', err);
    }

    onChange(ref.current?.innerHTML || '');
  }

  function applyFontSize(token: string) {
    const map: Record<string, string> = {
      XS: '12px',
      S: '14px',
      M: '16px',
      L: '20px',
      XL: '24px',
    };
    const px = map[token] || '16px';
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement('span');
    span.style.fontSize = px;
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    onChange(ref.current?.innerHTML || '');
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      if (ref.current) {
        ref.current.innerText += text;
        onChange(ref.current.innerHTML);
      }
      return;
    }
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    onChange(ref.current?.innerHTML || '');
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mt-2 mb-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => exec('bold')} className="px-2 py-1 border rounded">B</button>
        <button type="button" onClick={() => exec('italic')} className="px-2 py-1 border rounded">I</button>
        <button type="button" onClick={() => exec('underline')} className="px-2 py-1 border rounded">U</button>
        <button type="button" onClick={() => exec('strikeThrough')} className="px-2 py-1 border rounded">S</button>

        <button type="button" onClick={() => exec('insertUnorderedList')} className="px-2 py-1 border rounded">• List</button>

        <select onChange={(e) => applyFontSize(e.target.value)} defaultValue={'M'} className="border rounded px-2 py-1">
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>

        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL (include https://)');
            if (url) exec('createLink', url);
          }}
          className="px-2 py-1 border rounded"
        >
          Link
        </button>

        <button type="button" onClick={() => exec('unlink')} className="px-2 py-1 border rounded">Unlink</button>

        <button
          type="button"
          onClick={() => {
            if (ref.current) {
              ref.current.innerHTML = '';
              onChange('');
              ref.current.focus();
            }
          }}
          className="px-2 py-1 border rounded"
        >
          Clear
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || '')}
        onPaste={handlePaste}
        className="w-full min-h-[160px] border rounded px-3 py-3 bg-white text-black max-w-full"
        style={{ direction: 'ltr', textAlign: 'left' }}
        dir="ltr"
        data-placeholder={placeholder || ''}
      />

      {/* Small internal styles: placeholder + consistent lists + enforce LTR */}
      <style>{`
        div[contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          display: block;
        }

        div[contenteditable] ul,
        div[contenteditable] ol {
          display: block;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
          direction: ltr;
          unicode-bidi: isolate;
          list-style-position: outside;
          list-style-type: disc;
        }

        div[contenteditable] li {
          display: list-item !important;
          list-style-position: outside !important;
          list-style-type: disc !important;
          margin: 0.25rem 0;
          line-height: 1.4;
          direction: ltr;
          unicode-bidi: isolate;
          text-align: left;
        }

        div[contenteditable] li::marker {
          font-size: 1em;
          color: inherit;
        }

        div[contenteditable] li > * {
          display: inline !important;
        }

        div[contenteditable] {
          direction: ltr !important;
          unicode-bidi: isolate !important;
        }
      `}</style>
    </div>
  );
}
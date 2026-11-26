// "Declare root cause": a command-palette-style overlay. The timer keeps running.
// Keys 1-4 pick a choice and Esc closes. They only work while this overlay is open.
// Focus goes to the dialog itself (not a choice), so a stray Enter/Space can't answer.
import { useEffect, useRef } from 'react';

export default function AnswerScreen({ choices, onAnswer, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= choices.length) {
        e.preventDefault();
        onAnswer(choices[n - 1]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices, onAnswer, onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="palette-head">
          <h2 id="palette-title">Declare root cause</h2>
          <span className="palette-hint">The clock is still running</span>
        </div>
        <ul className="palette-list">
          {choices.map((c, i) => (
            <li key={c}>
              <button className="palette-item" onClick={() => onAnswer(c)}>
                <kbd>{i + 1}</kbd>
                <span className="palette-svc">{c}</span>
                <span className="palette-go" aria-hidden="true">↵</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="palette-foot">
          <span>
            <kbd>1</kbd>–<kbd>{choices.length}</kbd> choose
          </span>
          <button className="link" onClick={onClose}>
            <kbd>Esc</kbd> back to alerts
          </button>
        </div>
      </div>
    </div>
  );
}

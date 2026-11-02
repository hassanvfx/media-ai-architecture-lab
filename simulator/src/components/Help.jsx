import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CircleHelp, Search, X } from "lucide-react";
import { HELP, TERMS } from "../helpContent.js";
import { splitTerms } from "../helpTokens.js";

const HelpContext = createContext(null);
export function explanation(label) {
  const entry = Object.entries(HELP).find(
    ([key]) => key.toLowerCase() === String(label).toLowerCase(),
  );
  return (
    entry?.[1] ||
    TERMS[label] ||
    splitTerms(String(label))
      .filter((part) => part.term)
      .map((part) => `${part.term}: ${TERMS[part.term]}`)
      .join(" ") ||
    null
  );
}
export function HelpProvider({ children }) {
  const [tip, setTip] = useState(null);
  const [glossary, setGlossary] = useState(false);
  const [query, setQuery] = useState("");
  const timer = useRef();
  const trigger = useRef();
  const search = useRef();
  const tipId = useId();
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") {
        setTip(null);
        if (glossary) {
          setGlossary(false);
          trigger.current?.focus();
        }
      }
    };
    const outside = (event) => {
      if (!event.target.closest(".explanation-trigger,.explanation-popover"))
        setTip(null);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
      clearTimeout(timer.current);
    };
  }, [glossary]);
  useEffect(() => {
    if (glossary) search.current?.focus();
  }, [glossary]);
  const hideSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTip(null), 220);
  };
  const show = (element, label, text) => {
    clearTimeout(timer.current);
    const rect = element.getBoundingClientRect();
    setTip({
      element,
      label,
      text,
      left: Math.max(
        12,
        Math.min(
          rect.left,
          window.innerWidth - Math.min(360, window.innerWidth - 24) - 12,
        ),
      ),
      top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 230)),
    });
  };
  const unique = new Map();
  for (const [label, text] of Object.entries({ ...HELP, ...TERMS }))
    if (!unique.has(label.toLowerCase()))
      unique.set(label.toLowerCase(), [label, text]);
  const entries = [...unique.values()].filter(([key, text]) =>
    `${key} ${text}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <HelpContext.Provider
      value={{
        show,
        hideSoon,
        tip,
        tipId,
        openGlossary: (element) => {
          trigger.current = element;
          setTip(null);
          setGlossary(true);
        },
      }}
    >
      {children}
      {tip &&
        createPortal(
          <div
            id={tipId}
            role="tooltip"
            className="explanation-popover"
            style={{
              left: tip.left,
              top: tip.top,
              maxHeight: `calc(100vh - ${tip.top + 12}px)`,
            }}
            onMouseEnter={() => clearTimeout(timer.current)}
            onMouseLeave={hideSoon}
          >
            <strong>{tip.label}</strong>
            <p>{tip.text}</p>
          </div>,
          document.body,
        )}
      {glossary &&
        createPortal(
          <div
            className="glossary-backdrop"
            onClick={() => {
              setGlossary(false);
              trigger.current?.focus();
            }}
          >
            <section
              className="glossary-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Terms and labels"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const items = [
                  ...event.currentTarget.querySelectorAll(
                    "button,input,a[href]",
                  ),
                ];
                const first = items[0],
                  last = items.at(-1);
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }}
            >
              <header>
                <div>
                  <span className="eyebrow">PLAIN-LANGUAGE REFERENCE</span>
                  <h2>Terms & labels</h2>
                </div>
                <button
                  aria-label="Close terms and labels"
                  onClick={() => {
                    setGlossary(false);
                    trigger.current?.focus();
                  }}
                >
                  <X size={20} />
                </button>
              </header>
              <p>
                Hover, focus or tap a dotted term or question-mark icon for its
                explanation. Search here for a full definition.
              </p>
              <label className="glossary-search">
                <Search size={17} />
                <input
                  ref={search}
                  aria-label="Search terms and labels"
                  placeholder="Try chunk, approval, Sync, cost…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="glossary-entries">
                {entries.map(([label, text]) => (
                  <article key={label}>
                    <h3>{label}</h3>
                    <p>{text}</p>
                  </article>
                ))}
                {!entries.length && (
                  <p>No definitions match. Try a shorter term.</p>
                )}
              </div>
            </section>
          </div>,
          document.body,
        )}
    </HelpContext.Provider>
  );
}
export function HelpLabel({ label, details, children, term = false }) {
  const context = useContext(HelpContext);
  const ref = useRef();
  const text = details || explanation(label);
  if (!text || !context) return children || label;
  const open = (event) => {
    event.preventDefault();
    event.stopPropagation();
    context.show(ref.current, label, text);
  };
  return (
    <span className={term ? "term-wrap" : "explained-label"}>
      {!term && (children || label)}
      <button
        type="button"
        ref={ref}
        className={`explanation-trigger ${term ? "term-trigger" : "label-help"}`}
        aria-label={`Explain ${label}`}
        aria-describedby={
          context.tip?.element === ref.current ? context.tipId : undefined
        }
        onClick={open}
        onMouseEnter={open}
        onMouseLeave={context.hideSoon}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) open(event);
        }}
        onBlur={context.hideSoon}
      >
        {term ? children || label : <CircleHelp size={13} />}
      </button>
    </span>
  );
}
export function Terms({ children }) {
  if (typeof children !== "string") return children;
  return splitTerms(children).map(({ text, term }, index) =>
    term ? (
      <HelpLabel term key={index} label={term}>
        {text}
      </HelpLabel>
    ) : (
      text
    ),
  );
}
export function GlossaryButton() {
  const context = useContext(HelpContext);
  return (
    <button
      className="small-outline glossary-button"
      onClick={(event) => context.openGlossary(event.currentTarget)}
    >
      <CircleHelp size={15} /> Terms & labels
    </button>
  );
}

import React, { useEffect, useRef } from "react";
import {
  Activity,
  AudioLines,
  Box,
  CheckCheck,
  Film,
  Globe2,
  Languages,
  Radio,
  Scan,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { HelpLabel } from "./Help.jsx";
import { $, timeLabel } from "../utils.js";
const ICONS = {
  upload: Upload,
  shield: ShieldCheck,
  film: Film,
  audio: AudioLines,
  scan: Scan,
  spark: Sparkles,
  search: Search,
  languages: Languages,
  wave: Radio,
  check: CheckCheck,
  users: Users,
  send: Send,
  activity: Activity,
  trending: TrendingUp,
  zap: Zap,
  dollar: Wallet,
  globe: Globe2,
};
export function Icon({ name, ...props }) {
  const C = ICONS[name] || Box;
  return <C {...props} />;
}
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
  hint,
}) {
  return (
    <label className="slider-field">
      <span>
        <HelpLabel label={label} />
        <strong>
          {$(value, value % 1 ? 1 : 0)}
          <small>{suffix}</small>
        </strong>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}
export function Toggle({ label, hint, value, onChange }) {
  return (
    <div className="toggle-row">
      <span>
        <HelpLabel label={label} />
        {hint && <small>{hint}</small>}
      </span>
      <button
        type="button"
        aria-label={label}
        className={`switch ${value ? "on" : ""}`}
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  );
}
export function Sparkline({ values, color = "#4e997b", fill = false }) {
  if (values.length < 2)
    return (
      <svg viewBox="0 0 150 34">
        <path d="M0 25H150" stroke="#35413e" />
      </svg>
    );
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 150},${30 - ((v - min) / (max - min || 1)) * 26}`,
    )
    .join(" ");
  return (
    <svg viewBox="0 0 150 34" preserveAspectRatio="none" aria-hidden="true">
      {fill && (
        <polygon points={`0,34 ${points} 150,34`} fill={color} opacity=".08" />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
export function Metric({ label, value, unit, note, values, accent, delta }) {
  return (
    <div className={"metric " + (accent || "")}>
      <div className="metric-heading">
        <HelpLabel label={label} />
        <span className="metric-dot" />
      </div>
      <div className="metric-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="metric-bottom">
        <span>{delta || note}</span>
        <Sparkline
          values={values || []}
          color={accent === "warning" ? "#b89a64" : "#4e997b"}
        />
      </div>
    </div>
  );
}
export function Chart({ history, field, color = "#4e997b", unit, label }) {
  const w = 620,
    h = 180;
  const vals = history.map((d) => d[field] || 0);
  const max = Math.max(...vals, 1) * 1.15;
  const points = vals
    .map(
      (v, i) =>
        `${42 + (i / Math.max(1, vals.length - 1)) * (w - 54)},${h - 28 - (v / max) * (h - 45)}`,
    )
    .join(" ");
  return (
    <div className="chart">
      <div className="chart-title">
        {label}
        <span>{unit}</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={label + " over simulated time"}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1="42"
              x2={w - 12}
              y1={h - 28 - f * (h - 45)}
              y2={h - 28 - f * (h - 45)}
              stroke="#e1e9e4"
              strokeDasharray="3 5"
            />
            <text
              x="30"
              y={h - 24 - f * (h - 45)}
              fill="#8ba397"
              textAnchor="end"
              fontSize="10"
            >
              {$(max * f, max < 5 ? 1 : 0)}
            </text>
          </g>
        ))}
        {points && (
          <>
            <polygon
              points={`42,${h - 28} ${points} ${w - 12},${h - 28}`}
              fill={color}
              opacity=".05"
            />
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
          </>
        )}
        <text x="42" y={h - 4} fill="#8ba397" fontSize="10">
          {history.length ? timeLabel(history[0].time) : "00:00"}
        </text>
        <text
          x={w - 12}
          y={h - 4}
          fill="#8ba397"
          fontSize="10"
          textAnchor="end"
        >
          {history.length ? timeLabel(history.at(-1).time) : "00:00"}
        </text>
      </svg>
    </div>
  );
}
export function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const before = document.activeElement;
    ref.current?.focus();
    function key(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = [
          ...ref.current.querySelectorAll(
            'button,a,input,select,[tabindex="0"]',
          ),
        ];
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
          e.preventDefault();
          els[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

import { DEFAULTS } from "./catalog.js";
import { normalizeConfig } from "./engine.js";
export const $ = (v, d = 0) =>
  v == null
    ? "—"
    : v.toLocaleString("en-US", {
        maximumFractionDigits: d,
        minimumFractionDigits: d,
      });
export const timeLabel = (t) =>
  `${String(Math.floor(t / 3600)).padStart(2, "0")}:${String(Math.floor(t / 60) % 60).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
export function readInitial() {
  try {
    const hash = location.hash.slice(1);
    if (hash.startsWith("run="))
      return normalizeConfig(
        JSON.parse(decodeURIComponent(atob(hash.slice(4)))),
      );
    const saved = localStorage.getItem("hassan-uriostegui-observatory-config");
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.modelVersion === 3 ? normalizeConfig(parsed) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}
export function download(name, data, type = "application/json") {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([data], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

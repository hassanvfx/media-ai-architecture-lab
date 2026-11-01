import { TERMS } from "./helpContent.js";
const keys = Object.keys(TERMS).sort((a, b) => b.length - a.length);
const lookup = new Map(keys.map((key) => [key.toLowerCase(), key]));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pattern = new RegExp(`\\b(${keys.map(escapeRegExp).join("|")})\\b`, "gi");
export function splitTerms(text) {
  return text
    .split(pattern)
    .map((text) => ({ text, term: lookup.get(text.toLowerCase()) || null }));
}

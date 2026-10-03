// Data-level sanity check for index.html. Run: node scripts/check.mjs
// Exits non-zero (and prints every problem) if a company entry would render
// broken or incomplete. Used by the add-company agent before every push and by
// the deploy workflow before every publish.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const m = html.match(/\n<script>\n([\s\S]*?)\n<\/script>/);
if (!m) { console.error("No inline <script> block found"); process.exit(1); }
const js = m[1];

// 1. Whole script must parse.
try { new vm.Script(js); } catch (e) { console.error("Script does not parse:", e.message); process.exit(1); }

// 2. Evaluate the data declarations only (no DOM needed).
const start = js.indexOf("const DATA = [");
const end = js.indexOf("function esc(s){ return s; }");
const cl = js.match(/const COMPANY_LIST = \[[\s\S]*?\n\];/);
if (start < 0 || end < 0 || !cl) { console.error("Could not locate data blocks (DATA ... function esc / COMPANY_LIST)"); process.exit(1); }
const D = vm.runInNewContext(js.slice(start, end) + "\n" + cl[0] +
  "\n;({DATA,CSUITE,EVENTS,REGION_OF,SECTOR_ORDER,SECTOR_BLURBS,FIN,ALT,COMPANY_LIST})");

const errs = [];
const err = (id, msg) => errs.push(`[${id}] ${msg}`);
const str = v => typeof v === "string" && v.trim().length > 0;
const url = v => typeof v === "string" && /^https?:\/\/\S+$/.test(v);

const ids = new Set();
for (const c of D.DATA) {
  const id = c.id || "(no id)";
  if (!/^[a-z0-9]{2,8}$/.test(c.id || "")) err(id, "id must be 2–8 lowercase letters/digits");
  if (ids.has(c.id)) err(id, "duplicate id");
  ids.add(c.id);
  for (const f of ["name", "sector", "rev", "hq", "tagline", "field", "problem", "ventureName", "venture"])
    if (!str(c[f])) err(id, `missing ${f}`);
  if (!D.SECTOR_ORDER.includes(c.sector)) err(id, `sector "${c.sector}" not in SECTOR_ORDER — the card would never render`);
  if (!D.SECTOR_BLURBS[c.sector]) err(id, `no SECTOR_BLURBS entry for "${c.sector}"`);
  const sm = String(c.hq || "").match(/,\s*([A-Z]{2})\b/); // same rule as stateOf() in the page
  if (!sm) err(id, `hq "${c.hq}" must be "City, ST"`);
  else if (!D.REGION_OF[sm[1]]) err(id, `hq state "${sm[1]}" not in REGION_OF (would land in "Other") — add the state to REGION_OF`);
  if (!Array.isArray(c.evidence) || c.evidence.length < 3) err(id, "needs ≥3 evidence items");
  (c.evidence || []).forEach((e, i) => {
    for (const f of ["src", "q", "why"]) if (!str(e[f])) err(id, `evidence[${i}] missing ${f}`);
    if (!url(e.link)) err(id, `evidence[${i}] link is not a URL`);
  });
  if (!Array.isArray(c.approach) || c.approach.length < 3) err(id, "needs ≥3 approach steps");
  if (!Array.isArray(c.people) || c.people.length < 2) err(id, "needs ≥2 people");
  (c.people || []).forEach((p, i) => { for (const f of ["n", "t", "w"]) if (!str(p[f])) err(id, `people[${i}] missing ${f}`); });

  const cs = D.CSUITE[c.id];
  if (!cs) { err(id, "no CSUITE entry"); }
  else {
    if (!url(cs.src)) err(id, "CSUITE.src must be the leadership/IR page URL");
    for (const r of ["CEO", "CFO", "COO", "CSO"]) {
      if (!(r in cs)) { err(id, `CSUITE.${r} missing — use null if nobody holds it`); continue; }
      const p = cs[r];
      if (p === null) continue;
      for (const f of ["n", "t"]) if (!str(p[f])) err(id, `CSUITE.${r}.${f} missing`);
      if (!["high", "med", "check"].includes(p.conf)) err(id, `CSUITE.${r}.conf must be high|med|check`);
    }
    if (!cs.CEO) err(id, "CSUITE.CEO is null — every company has a CEO");
    if (!str(cs.note)) err(id, "CSUITE.note missing — state what exists and what doesn't");
    (cs.others || []).forEach((p, i) => { for (const f of ["n", "t", "w"]) if (!str(p[f])) err(id, `CSUITE.others[${i}] missing ${f}`); });
  }
  if (!D.FIN[c.id]) err(id, "no FIN entry (use {m:\"—\",e:\"—\"} if unknown)");
  if (!str(D.ALT[c.id])) err(id, "no ALT entry");
  const li = D.COMPANY_LIST.find(x => x.n === c.name);
  if (!li) err(id, `name "${c.name}" has no exact match in COMPANY_LIST (ticker chip and quick-list dedupe rely on it)`);
}
for (const k of Object.keys(D.CSUITE)) if (!ids.has(k)) err(k, "CSUITE entry with no matching DATA company");
for (const e of D.EVENTS) {
  if (e.date && !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) err(e.id, "event date must be YYYY-MM-DD or empty");
  for (const co of e.cos || []) if (!ids.has(co)) err(e.id, `event references unknown company id "${co}"`);
}
const names = D.COMPANY_LIST.map(x => x.n);
names.forEach((n, i) => { if (names.indexOf(n) !== i) err("COMPANY_LIST", `duplicate "${n}"`); });

if (errs.length) { console.error(errs.join("\n")); console.error(`\n${errs.length} problem(s).`); process.exit(1); }
console.log(`OK — ${D.DATA.length} companies, ${Object.keys(D.CSUITE).length} C-suite entries, ${D.EVENTS.length} events, ${D.COMPANY_LIST.length} in quick list.`);

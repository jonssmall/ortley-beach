export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Dates are stored as YYYY-MM-DD and read as local dates, so a meeting on the
// 17th never shows as the 16th.
export function parseDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function today() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
export function fmtDate(iso, opts = { month: 'long', day: 'numeric', year: 'numeric' }) {
  return parseDate(iso).toLocaleDateString('en-US', opts);
}
export function fmtLong(iso) {
  return fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
export function fmtMonth(ym) {
  return fmtDate(ym + '-01', { month: 'long', year: 'numeric' });
}
export function daysUntil(iso) {
  return Math.round((parseDate(iso) - today()) / 86400000);
}
export function relDays(n) {
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 0) return `${-n} days ago`;
  if (n < 14) return `In ${n} days`;
  return `In ${Math.round(n / 7)} weeks`;
}
export function isoToday() {
  const t = today();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export function nextOnOrAfter(dates) {
  const t = today();
  return [...dates].sort().find((d) => parseDate(d) >= t) || null;
}

const ALLOWED = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'A', 'H2', 'H3', 'H4', 'BLOCKQUOTE']);

// Rich text from the editor is stored as HTML. Strip everything except a small
// set of formatting tags before it is shown.
export function sanitize(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const root = doc.body.firstChild;
  (function walk(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1 || !ALLOWED.has(child.tagName)) {
        if (child.nodeType === 1 && !['SCRIPT', 'STYLE', 'IFRAME'].includes(child.tagName)) {
          walk(child);
          child.replaceWith(...child.childNodes);
        } else {
          child.remove();
        }
        return;
      }
      [...child.attributes].forEach((a) => {
        if (child.tagName === 'A' && a.name === 'href' && !/^\s*javascript:/i.test(a.value)) return;
        child.removeAttribute(a.name);
      });
      if (child.tagName === 'A') {
        const href = child.getAttribute('href') || '';
        if (/^https?:/i.test(href)) { child.setAttribute('target', '_blank'); child.setAttribute('rel', 'noopener'); }
      }
      walk(child);
    });
  })(root);
  return root.innerHTML;
}

export function toast(msg, kind = 'ok') {
  let host = $('#toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    document.body.append(host);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${kind}`;
  t.textContent = msg;
  host.append(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}

export function icsFile({ title, date, start, end, location, description }) {
  const d = date.replace(/-/g, '');
  const t = (s) => {
    const m = /(\d+):(\d+)\s*(am|pm)/i.exec(s || '');
    if (!m) return '090000';
    let h = +m[1] % 12;
    if (m[3].toLowerCase() === 'pm') h += 12;
    return String(h).padStart(2, '0') + m[2] + '00';
  };
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OBVTA//Site//EN', 'BEGIN:VEVENT',
    `UID:${d}-${Math.random().toString(36).slice(2)}@ortleybeach.org`,
    `DTSTART;TZID=America/New_York:${d}T${t(start)}`,
    `DTEND;TZID=America/New_York:${d}T${t(end)}`,
    `SUMMARY:${title}`, `LOCATION:${(location || '').replace(/,/g, '\\,')}`,
    `DESCRIPTION:${(description || '').replace(/,/g, '\\,')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'obvta-meeting.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function initials(name) {
  return String(name).replace(/^the\s+/i, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

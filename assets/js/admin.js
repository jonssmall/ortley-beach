import { load, save, reset, invalidate, session, activity, uid, PHOTOS, STORAGE_KEY } from './store.js';
import {
  $, $$, esc, fmtDate, fmtLong, fmtMonth, daysUntil, relDays, nextOnOrAfter, parseDate, today,
  sanitize, toast, isoToday,
} from './util.js';

const app = $('#app');

// Every screen edits a working copy. Nothing reaches the live site until Save.
let draft = null;
let dirty = false;
let lastHash = location.hash;
let skipGuard = false;

const clone = (o) => JSON.parse(JSON.stringify(o));
const fresh = () => { invalidate(); draft = clone(load()); dirty = false; };

const SECTIONS = [
  ['dashboard', 'Dashboard', 'M3 12l9-8 9 8M5 10v10h14V10'],
  ['home', 'Home page', 'M4 5h16v6H4zM4 15h7v4H4zM13 15h7v4h-7z'],
  ['posts', 'News & events', 'M5 4h11l3 3v13H5zM8 9h8M8 13h8M8 17h5'],
  ['meetings', 'Meetings', 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5'],
  ['officers', 'Officers', 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 11a3 3 0 100-6M21 20a6 6 0 00-4-5.6'],
  ['pages', 'About pages', 'M6 3h9l4 4v14H6zM9 12h7M9 16h7'],
  ['documents', 'Documents', 'M7 3h7l5 5v13H7zM14 3v5h5'],
  ['links', 'Useful links', 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1'],
  ['inbox', 'Inbox', 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 2h6l1-2h5'],
  ['settings', 'Settings', 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .3-1.5-1.5L17 5l-3-1-1 2h-2l-1-2-3 1 .5 1.8L6 8.3 4 8 3 11l2 1v0l-2 1 1 3 2-.3 1.5 1.5L7 19l3 1 1-2h2l1 2 3-1-.5-1.8 1.5-1.5 2 .3 1-3z'],
];

const icon = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

/* ---------- Paths: inputs are named like "settings.stats.0.value" ---------- */

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, val) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = val;
}

/* ---------- Field builders ---------- */

function field(label, path, { type = 'text', help = '', placeholder = '', rows = 3, list = '', full = false } = {}) {
  const v = getPath(draft, path) ?? '';
  const input = type === 'textarea'
    ? `<textarea name="${path}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(v)}</textarea>`
    : `<input name="${path}" type="${type}" value="${esc(v)}" placeholder="${esc(placeholder)}" ${list ? `list="${list}"` : ''} ${type === 'number' ? 'data-num' : ''}>`;
  return `<label class="f ${full ? 'f-full' : ''}"><span>${esc(label)}</span>${input}${help ? `<small>${help}</small>` : ''}</label>`;
}
function toggle(label, path, help = '') {
  return `<label class="tgl"><input type="checkbox" name="${path}" ${getPath(draft, path) ? 'checked' : ''}><i></i><span>${esc(label)}${help ? `<small>${esc(help)}</small>` : ''}</span></label>`;
}
function rte(label, path) {
  return `
    <div class="f f-full">
      <span>${esc(label)}</span>
      <div class="rte">
        <div class="rte-bar" role="toolbar" aria-label="Formatting">
          <button type="button" data-cmd="bold" title="Bold"><b>B</b></button>
          <button type="button" data-cmd="italic" title="Italic"><i>I</i></button>
          <button type="button" data-cmd="formatBlock" data-val="H3" title="Heading">H</button>
          <button type="button" data-cmd="formatBlock" data-val="P" title="Paragraph">&para;</button>
          <button type="button" data-cmd="insertUnorderedList" title="Bulleted list">&bull; List</button>
          <button type="button" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
          <button type="button" data-cmd="createLink" title="Add link">Link</button>
          <button type="button" data-cmd="unlink" title="Remove link">Unlink</button>
        </div>
        <div class="rte-body prose" contenteditable="true" data-rte="${path}">${sanitize(getPath(draft, path))}</div>
      </div>
    </div>`;
}
function imagePicker(path) {
  const cur = getPath(draft, path) || '';
  return `
    <div class="f f-full">
      <span>Image</span>
      <div class="imgpick" data-imgpick="${path}">
        <button type="button" class="imgopt none ${!cur ? 'on' : ''}" data-img="">No image</button>
        ${PHOTOS.map((p) => `<button type="button" class="imgopt ${cur === p.src ? 'on' : ''}" data-img="${p.src}" title="${esc(p.label)}"><img src="${p.src}" alt="${esc(p.label)}"></button>`).join('')}
        ${cur && !PHOTOS.some((p) => p.src === cur) ? `<button type="button" class="imgopt on" data-img="${esc(cur)}" title="Uploaded"><img src="${esc(cur)}" alt="Uploaded image"></button>` : ''}
        <label class="imgopt upload"><input type="file" accept="image/*" data-upload-img="${path}" hidden>+ Upload</label>
      </div>
    </div>`;
}
function fileOrLink(label, path) {
  const v = getPath(draft, path) || '';
  const isData = v.startsWith('data:');
  return `
    <label class="f"><span>${esc(label)}</span>
      <div class="fileurl">
        <input name="${path}" type="${isData ? 'hidden' : 'url'}" value="${esc(v)}" placeholder="Paste a link or upload">
        ${isData ? `<span class="uploaded">Uploaded file <button type="button" class="linkbtn" data-clear="${path}">Remove</button></span>` : ''}
        <label class="btn-mini">Upload<input type="file" accept="application/pdf,image/*,.doc,.docx" data-upload-file="${path}" hidden></label>
      </div>
    </label>`;
}

/* ---------- Shell ---------- */

function shell(active, body) {
  const d = draft;
  const unread = d.inbox.filter((x) => !x.read).length;
  let used = 0;
  try { used = (localStorage.getItem(STORAGE_KEY) || '').length; } catch (e) { /* ignore */ }
  const pct = Math.min(100, Math.round((used / (4.5 * 1024 * 1024)) * 100));
  return `
    <div class="demo-strip">
      <span><strong>Demo mode.</strong> Edits are saved in this browser only, so feel free to try anything.</span>
      <button type="button" class="linkbtn" data-reset>Reset demo content</button>
    </div>
    <div class="adm">
      <aside class="side">
        <a class="side-brand" href="index.html"><img src="assets/img/logo-mark.png" alt="" width="40"><span><strong>${esc(d.settings.shortName)}</strong><small>Site admin</small></span></a>
        <nav class="side-nav">
          ${SECTIONS.map(([k, label, ic]) => `<a href="#${k}" class="${active === k ? 'on' : ''}">${icon(ic)}<span>${label}</span>${k === 'inbox' && unread ? `<em>${unread}</em>` : ''}</a>`).join('')}
        </nav>
        <div class="side-foot">
          <div class="meter" title="Storage used by this demo"><i style="width:${Math.max(2, pct)}%"></i></div>
          <small>${(used / 1024).toFixed(0)} KB of demo storage used</small>
        </div>
      </aside>
      <div class="adm-main">
        <header class="topbar">
          <button type="button" class="menu-btn" data-menu aria-label="Menu">${icon('M4 6h16M4 12h16M4 18h16')}</button>
          <div class="topbar-r">
            <a class="btn btn-ghost btn-sm" href="index.html" target="_blank" rel="noopener">View site &nearr;</a>
            <span class="me"><span class="avatar sm">SA</span><span>Site Admin</span></span>
            <button type="button" class="linkbtn" data-logout>Sign out</button>
          </div>
        </header>
        <div class="content">${body}</div>
        <div class="savebar ${dirty ? 'show' : ''}" data-savebar>
          <span>You have unsaved changes</span>
          <button type="button" class="btn btn-ghost btn-sm" data-discard>Discard</button>
          <button type="button" class="btn btn-coral btn-sm" data-save>Save &amp; publish</button>
        </div>
      </div>
    </div>`;
}

function head(title, sub = '', actions = '') {
  return `<div class="phead"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="phead-r">${actions}</div></div>`;
}

/* ---------- Views ---------- */

const VIEWS = {
  dashboard() {
    const d = draft;
    const next = nextOnOrAfter(d.meetings.schedule);
    const t = today();
    const missing = d.meetings.schedule.filter((x) => parseDate(x) < t && !d.meetings.archive.some((a) => a.month === x.slice(0, 7) && a.minutes));
    const drafts = d.posts.filter((p) => p.status !== 'published');
    const unread = d.inbox.filter((x) => !x.read);
    const joins = d.inbox.filter((x) => x.type === 'membership');
    const log = activity();
    const todo = [
      ...missing.map((x) => ({ text: `Post minutes for the ${fmtDate(x, { month: 'long', day: 'numeric' })} meeting`, href: '#meetings/archive' })),
      ...(!next ? [{ text: 'Add next season\'s meeting dates', href: '#meetings' }] : []),
      ...drafts.map((p) => ({ text: `Finish draft: ${p.title}`, href: `#posts/${p.id}` })),
      ...unread.map((m) => ({ text: `${m.type === 'membership' ? 'New membership' : 'Message'} from ${m.name}`, href: '#inbox' })),
    ];
    return head(`Good ${greeting()}, admin`, 'Here is what needs attention on the site.') + `
      <div class="tiles">
        <a class="tile" href="#meetings"><span>Next meeting</span><strong>${next ? fmtDate(next, { month: 'short', day: 'numeric' }) : 'None set'}</strong><small>${next ? relDays(daysUntil(next)) : 'Add dates for next season'}</small></a>
        <a class="tile" href="#posts"><span>Published posts</span><strong>${d.posts.filter((p) => p.status === 'published').length}</strong><small>${drafts.length} draft${drafts.length === 1 ? '' : 's'}</small></a>
        <a class="tile" href="#inbox"><span>Unread inbox</span><strong>${unread.length}</strong><small>${d.inbox.length} total</small></a>
        <a class="tile" href="#inbox"><span>Online sign-ups</span><strong>${joins.length}</strong><small>$${joins.length * d.settings.fee} in dues</small></a>
      </div>
      <div class="dash-grid">
        <section class="panel">
          <h2>To do</h2>
          ${todo.length ? `<ul class="todo">${todo.map((x) => `<li><a href="${x.href}">${esc(x.text)}</a></li>`).join('')}</ul>` : '<p class="muted">All caught up.</p>'}
        </section>
        <section class="panel">
          <h2>Quick actions</h2>
          <div class="quick">
            <a href="#posts/new">${icon('M12 5v14M5 12h14')}<span>Write a news post</span></a>
            <a href="#meetings/archive">${icon('M7 3h7l5 5v13H7zM12 12v6M9 15h6')}<span>Upload minutes</span></a>
            <a href="#home">${icon('M4 7h16v10H4zM8 11h8')}<span>Change the announcement</span></a>
            <a href="#officers">${icon('M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0')}<span>Update officers</span></a>
          </div>
        </section>
        <section class="panel panel-wide">
          <h2>Recent activity</h2>
          ${log.length ? `<ul class="log">${log.slice(0, 8).map((x) => `<li><span>${esc(x.text)}</span><time>${timeAgo(x.at)}</time></li>`).join('')}</ul>` : '<p class="muted">Changes you save will show up here.</p>'}
        </section>
      </div>`;
  },

  home() {
    return head('Home page', 'The banner, headline and sections visitors see first.', viewLink('index.html')) + `
      <section class="panel">
        <h2>Announcement banner</h2>
        <p class="muted">Shows across the top of every page. Use it for urgent notices.</p>
        ${toggle('Show the announcement', 'settings.announcement.on')}
        <div class="fgrid">
          ${field('Message', 'settings.announcement.text', { type: 'textarea', rows: 2, full: true })}
          ${field('Link text', 'settings.announcement.linkLabel')}
          ${field('Link to', 'settings.announcement.link', { list: 'dl-pages', help: 'A page, a post or any web address.' })}
        </div>
      </section>
      <section class="panel">
        <h2>Hero</h2>
        <div class="fgrid">
          ${field('Small heading', 'settings.heroEyebrow')}
          ${field('Headline', 'settings.heroTitle')}
          ${field('Intro text', 'settings.heroText', { type: 'textarea', rows: 3, full: true })}
          ${imagePicker('settings.heroImage')}
        </div>
      </section>
      <section class="panel">
        <h2>Numbers strip</h2>
        <div class="stats-edit">
          ${draft.settings.stats.map((_, i) => `<div>${field('Number', `settings.stats.${i}.value`)}${field('Label', `settings.stats.${i}.label`)}</div>`).join('')}
        </div>
      </section>
      <section class="panel">
        <h2>Why join</h2>
        ${draft.settings.whyJoin.map((_, i) => `<div class="fgrid fgrid-row">${field(`Reason ${i + 1}`, `settings.whyJoin.${i}.title`)}${field('Details', `settings.whyJoin.${i}.text`)}</div>`).join('')}
      </section>
      <datalist id="dl-pages">
        ${['index.html', 'about.html', 'meetings.html', 'news.html', 'resources.html', 'membership.html', ...draft.posts.map((p) => `news.html?post=${p.id}`)].map((x) => `<option value="${esc(x)}">`).join('')}
      </datalist>`;
  },

  posts(id) {
    if (id) return postEditor(id);
    const f = sessionStorage.getItem('adm-post-filter') || 'all';
    const list = [...draft.posts].sort((a, b) => b.date.localeCompare(a.date))
      .filter((p) => f === 'all' || (f === 'drafts' ? p.status !== 'published' : p.type === f));
    return head('News & events', `${draft.posts.length} posts`, '<a class="btn btn-coral btn-sm" href="#posts/new">+ New post</a>') + `
      <div class="chips" style="margin-bottom:1rem">
        ${[['all', 'All'], ['news', 'News'], ['event', 'Events'], ['drafts', 'Drafts']].map(([k, l]) => `<button type="button" class="chip ${f === k ? 'on' : ''}" data-post-filter="${k}">${l}</button>`).join('')}
      </div>
      <div class="panel flush">
        <table class="tbl">
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            ${list.map((p) => `
              <tr>
                <td><a class="tbl-title" href="#posts/${esc(p.id)}">${esc(p.title)}</a>${p.pinned ? ' <span class="tag tag-pin">Pinned</span>' : ''}</td>
                <td><span class="tag tag-${p.type}">${p.type === 'event' ? 'Event' : 'News'}</span></td>
                <td><span class="status status-${p.status}">${p.status === 'published' ? 'Published' : 'Draft'}</span></td>
                <td class="nowrap">${fmtDate(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td class="row-actions">
                  <a href="#posts/${esc(p.id)}">Edit</a>
                  <a href="news.html?post=${esc(p.id)}" target="_blank" rel="noopener">View</a>
                  <button type="button" class="linkbtn danger" data-del-post="${esc(p.id)}">Delete</button>
                </td>
              </tr>`).join('') || '<tr><td colspan="5" class="muted">Nothing here yet.</td></tr>'}
          </tbody>
        </table>
      </div>`;
  },

  meetings(sub) {
    const m = draft.meetings;
    setTimeout(() => sub === 'archive' && $('#archive')?.scrollIntoView({ behavior: 'smooth' }), 50);
    return head('Meetings', 'The next-meeting box on every page updates itself from these dates.', viewLink('meetings.html')) + `
      <section class="panel">
        <h2>Where and when</h2>
        <div class="fgrid">
          ${field('Location name', 'meetings.location')}
          ${field('Address', 'meetings.address')}
          ${field('Meeting starts', 'meetings.start')}
          ${field('Coffee served', 'meetings.coffee')}
          ${field('Note', 'meetings.note', { full: true })}
        </div>
        ${toggle('Zoom available for members', 'meetings.zoom')}
      </section>
      <section class="panel">
        <h2>Season dates</h2>
        <p class="muted">Past dates are greyed out on the site automatically.</p>
        <div class="datechips">
          ${[...m.schedule].map((x, i) => ({ x, i })).sort((a, b) => a.x.localeCompare(b.x)).map(({ x, i }) => `<span class="datechip ${parseDate(x) < today() ? 'past' : ''}">${fmtDate(x, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}<button type="button" data-rm="meetings.schedule.${i}" aria-label="Remove">&times;</button></span>`).join('')}
        </div>
        <div class="addrow"><input type="date" data-newdate="meetings.schedule"><button type="button" class="btn btn-navy btn-sm" data-adddate="meetings.schedule">Add date</button></div>
      </section>
      <section class="panel" id="archive">
        <div class="panel-head"><h2>Minutes &amp; treasurer reports</h2><button type="button" class="btn btn-navy btn-sm" data-add-archive>+ Add month</button></div>
        <p class="muted">Upload the PDF or paste a link. Leave minutes empty for months with no meeting.</p>
        <div class="rows">
          ${m.archive.map((a, i) => `
            <div class="rowcard">
              <label class="f"><span>Month</span><input type="month" name="meetings.archive.${i}.month" value="${esc(a.month)}"></label>
              ${fileOrLink('Minutes', `meetings.archive.${i}.minutes`)}
              ${fileOrLink('Treasurer report', `meetings.archive.${i}.treasurer`)}
              <button type="button" class="iconbtn danger" data-rm="meetings.archive.${i}" title="Remove row">&times;</button>
            </div>`).join('')}
        </div>
      </section>
      <section class="panel">
        <h2>Toms River Town Council</h2>
        <div class="fgrid">${field('Place', 'meetings.council.place')}${field('Time', 'meetings.council.time')}</div>
        <div class="datechips">
          ${[...m.council.dates].map((x, i) => ({ x, i })).sort((a, b) => a.x.localeCompare(b.x)).map(({ x, i }) => `<span class="datechip ${parseDate(x) < today() ? 'past' : ''}">${fmtDate(x, { month: 'short', day: 'numeric', year: 'numeric' })}<button type="button" data-rm="meetings.council.dates.${i}" aria-label="Remove">&times;</button></span>`).join('')}
        </div>
        <div class="addrow"><input type="date" data-newdate="meetings.council.dates"><button type="button" class="btn btn-navy btn-sm" data-adddate="meetings.council.dates">Add date</button></div>
      </section>`;
  },

  officers() {
    return head('Officers', 'Shown on the About page in this order.', viewLink('about.html#officers')) + `
      <section class="panel">
        <div class="rows">
          ${draft.officers.map((o, i) => `
            <div class="rowcard rowcard-3">
              <div class="order">
                <button type="button" data-move="officers.${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">&uarr;</button>
                <button type="button" data-move="officers.${i}" data-dir="1" ${i === draft.officers.length - 1 ? 'disabled' : ''} aria-label="Move down">&darr;</button>
              </div>
              ${field('Role', `officers.${i}.role`, { list: 'dl-roles' })}
              ${field('Name', `officers.${i}.name`)}
              <button type="button" class="iconbtn danger" data-rm="officers.${i}" title="Remove">&times;</button>
            </div>`).join('')}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-add="officers">+ Add officer</button>
        <datalist id="dl-roles"><option value="President"><option value="Vice-President"><option value="Treasurer"><option value="Secretary"><option value="Director"></datalist>
      </section>`;
  },

  pages() {
    return head('About pages', 'The longer written content on the About and Home pages.', viewLink('about.html')) + `
      <section class="panel">
        <h2>Mission statement</h2>
        ${field('Mission', 'pages.mission', { type: 'textarea', rows: 2, full: true })}
      </section>
      <section class="panel">
        <h2>About us</h2>
        ${rte('Body', 'pages.about')}
        <div class="fgrid">${field('Signed by', 'pages.president')}</div>
      </section>
      <section class="panel">
        <h2>Strategic plan</h2>
        ${rte('Body', 'pages.strategic')}
      </section>
      <section class="panel">
        <h2>Secession report summary</h2>
        <p class="muted">Appears on the home page.</p>
        ${rte('Body', 'pages.secession')}
      </section>`;
  },

  documents() {
    return head('Documents', 'PDFs listed on the About and Resources pages.', viewLink('resources.html')) + `
      <section class="panel">
        <div class="rows">
          ${draft.documents.map((x, i) => `
            <div class="rowcard">
              ${field('Title', `documents.${i}.title`)}
              ${field('Category', `documents.${i}.category`, { list: 'dl-doccat' })}
              ${fileOrLink('File', `documents.${i}.url`)}
              <button type="button" class="iconbtn danger" data-rm="documents.${i}" title="Remove">&times;</button>
            </div>`).join('')}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-add="documents">+ Add document</button>
        <datalist id="dl-doccat">${[...new Set(draft.documents.map((x) => x.category))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
      </section>`;
  },

  links() {
    return head('Useful links', 'Grouped on the Resources page. Type a new group name to start a new group.', viewLink('resources.html')) + `
      <section class="panel">
        <div class="rows">
          ${draft.links.map((l, i) => `
            <div class="rowcard rowcard-links">
              <div class="order">
                <button type="button" data-move="links.${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">&uarr;</button>
                <button type="button" data-move="links.${i}" data-dir="1" ${i === draft.links.length - 1 ? 'disabled' : ''} aria-label="Move down">&darr;</button>
              </div>
              ${field('Group', `links.${i}.group`, { list: 'dl-groups' })}
              ${field('Label', `links.${i}.label`)}
              ${field('Web address', `links.${i}.url`)}
              <button type="button" class="iconbtn danger" data-rm="links.${i}" title="Remove">&times;</button>
            </div>`).join('')}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-add="links">+ Add link</button>
        <datalist id="dl-groups">${[...new Set(draft.links.map((x) => x.group))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
      </section>`;
  },

  inbox() {
    const f = sessionStorage.getItem('adm-inbox-filter') || 'all';
    const items = draft.inbox.filter((x) => f === 'all' || x.type === f);
    return head('Inbox', 'Membership sign-ups and messages sent from the website.',
      '<button type="button" class="btn btn-ghost btn-sm" data-export>Export members (CSV)</button>') + `
      <div class="chips" style="margin-bottom:1rem">
        ${[['all', 'All'], ['membership', 'Memberships'], ['message', 'Messages']].map(([k, l]) => `<button type="button" class="chip ${f === k ? 'on' : ''}" data-inbox-filter="${k}">${l}</button>`).join('')}
      </div>
      <div class="inbox">
        ${items.map((x) => `
          <details class="msg ${x.read ? '' : 'unread'}" data-msg="${x.id}">
            <summary>
              <span class="avatar sm">${esc(x.name.replace(/^the\s+/i, '').slice(0, 1).toUpperCase())}</span>
              <span class="msg-main">
                <strong>${esc(x.name)}</strong>
                <span>${x.type === 'membership' ? `${esc(x.kind || 'Membership')} &middot; $${draft.settings.fee} paid` : esc(x.subject)}</span>
              </span>
              <span class="tag ${x.type === 'membership' ? 'tag-soon' : ''}">${x.type === 'membership' ? 'Member' : 'Message'}</span>
              <time>${fmtDate(x.date, { month: 'short', day: 'numeric' })}</time>
            </summary>
            <div class="msg-body">
              <dl>
                <dt>Email</dt><dd><a href="mailto:${esc(x.email)}">${esc(x.email)}</a></dd>
                ${x.phone ? `<dt>Phone</dt><dd>${esc(x.phone)}</dd>` : ''}
                ${x.address ? `<dt>Ortley Beach address</dt><dd>${esc(x.address)}</dd>` : ''}
                ${x.type === 'membership' ? `<dt>Committee interest</dt><dd>${x.committee ? 'Yes' : 'No'}</dd>` : ''}
              </dl>
              ${x.message ? `<p class="msg-text">${esc(x.message)}</p>` : ''}
              <div class="msg-actions">
                <a class="btn btn-navy btn-sm" href="mailto:${esc(x.email)}?subject=${encodeURIComponent('Re: ' + (x.subject || 'Your OBVTA membership'))}">Reply by email</a>
                <button type="button" class="btn btn-ghost btn-sm" data-del-msg="${x.id}">Delete</button>
              </div>
            </div>
          </details>`).join('') || '<p class="muted panel">Nothing here yet. Try the membership form on the public site.</p>'}
      </div>`;
  },

  settings() {
    return head('Settings', 'Organization details used across the site.') + `
      <section class="panel">
        <h2>Organization</h2>
        <div class="fgrid">
          ${field('Full name', 'settings.orgName', { full: true })}
          ${field('Short name', 'settings.shortName')}
          ${field('Contact email', 'settings.email', { type: 'email' })}
          ${field('Mailing address', 'settings.mailing', { full: true })}
        </div>
      </section>
      <section class="panel">
        <h2>Membership</h2>
        <div class="fgrid">
          ${field('Annual dues ($)', 'settings.fee', { type: 'number' })}
          ${field('Membership year', 'settings.membershipYear')}
        </div>
      </section>
      <section class="panel danger-zone">
        <h2>Reset demo</h2>
        <p class="muted">Put every page back the way it started and clear the inbox and activity log.</p>
        <button type="button" class="btn btn-ghost btn-sm" data-reset>Reset demo content</button>
      </section>`;
  },
};

function postEditor(id) {
  let p;
  if (id === 'new') {
    p = draft.posts.find((x) => x._new);
    if (!p) {
      p = { id: 'new-' + uid(), _new: true, title: '', date: isoToday(), type: 'news', excerpt: '', body: '<p></p>', status: 'draft', pinned: false, source: '', url: '', image: '', eventDate: '', eventTime: '', eventPlace: '' };
      draft.posts.unshift(p);
    }
  } else {
    p = draft.posts.find((x) => x.id === id);
  }
  if (!p) return head('Post not found') + '<p><a href="#posts">Back to posts</a></p>';
  const i = draft.posts.indexOf(p);
  const P = `posts.${i}`;
  return head(p._new ? 'New post' : 'Edit post', '<a href="#posts">&larr; All posts</a>',
    p._new ? '' : `<a class="btn btn-ghost btn-sm" href="news.html?post=${esc(p.id)}" target="_blank" rel="noopener">View on site &nearr;</a>`) + `
    <div class="editor">
      <div>
        <section class="panel">
          <input class="title-input" name="${P}.title" value="${esc(p.title)}" placeholder="Post title" aria-label="Title">
          ${field('Summary', `${P}.excerpt`, { type: 'textarea', rows: 2, full: true, help: 'One or two sentences shown on the news cards.' })}
          ${rte('Body', `${P}.body`)}
        </section>
        <section class="panel">
          <h2>Outside article</h2>
          <p class="muted">Sharing a news story from another site? Add it here and the post gets a "Read the full story" button.</p>
          <div class="fgrid">${field('Source', `${P}.source`, { placeholder: 'e.g. Asbury Park Press' })}${field('Link', `${P}.url`, { type: 'url', placeholder: 'https://' })}</div>
        </section>
      </div>
      <aside>
        <section class="panel">
          <h2>Publish</h2>
          <label class="f"><span>Status</span>
            <select name="${P}.status"><option value="published" ${p.status === 'published' ? 'selected' : ''}>Published</option><option value="draft" ${p.status !== 'published' ? 'selected' : ''}>Draft (hidden)</option></select>
          </label>
          <label class="f"><span>Type</span>
            <select name="${P}.type" data-rerender><option value="news" ${p.type === 'news' ? 'selected' : ''}>News</option><option value="event" ${p.type === 'event' ? 'selected' : ''}>Event</option></select>
          </label>
          ${field('Post date', `${P}.date`, { type: 'date' })}
          ${toggle('Pin to top', `${P}.pinned`, 'Keeps it first on the home page')}
          ${p._new ? '' : `<button type="button" class="linkbtn danger" data-del-post="${esc(p.id)}">Delete this post</button>`}
        </section>
        ${p.type === 'event' ? `
        <section class="panel">
          <h2>Event details</h2>
          ${field('Event date', `${P}.eventDate`, { type: 'date' })}
          ${field('Time', `${P}.eventTime`, { placeholder: '6:00pm to 8:00pm' })}
          ${field('Where', `${P}.eventPlace`)}
          <p class="small muted">Visitors get an "Add to calendar" button until the event has passed.</p>
        </section>` : ''}
        <section class="panel">${imagePicker(`${P}.image`)}</section>
      </aside>
    </div>`;
}

/* ---------- Helpers ---------- */

function viewLink(href) {
  return `<a class="btn btn-ghost btn-sm" href="${href}" target="_blank" rel="noopener">View on site &nearr;</a>`;
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'post';
}
function markDirty() {
  dirty = true;
  $('[data-savebar]')?.classList.add('show');
}
function readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
async function shrinkImage(file) {
  const url = await readFile(file);
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = url; });
  const scale = Math.min(1, 1400 / img.width);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

function sectionLabel(route) {
  return (SECTIONS.find(([k]) => k === route.split('/')[0]) || [, 'Content'])[1];
}

function doSave() {
  // Pull rich text out of the editors, then tidy new posts.
  $$('[data-rte]').forEach((el) => setPath(draft, el.dataset.rte, sanitize(el.innerHTML)));
  const route = location.hash.slice(1) || 'dashboard';
  let note = `Updated ${sectionLabel(route).toLowerCase()}`;
  let goTo = null;
  draft.posts.forEach((p) => {
    if (p._new) {
      if (!p.title.trim()) p.title = 'Untitled post';
      let slug = slugify(p.title);
      while (draft.posts.some((x) => x !== p && x.id === slug)) slug += '-2';
      p.id = slug;
      delete p._new;
      note = `Created post "${p.title}"`;
      goTo = `#posts/${slug}`;
    } else if (route.startsWith('posts/')) {
      const cur = draft.posts.find((x) => x.id === route.split('/')[1]);
      if (cur) note = `Edited post "${cur.title}"`;
    }
  });
  draft.meetings.archive.sort((a, b) => b.month.localeCompare(a.month));
  if (!save(draft, note)) {
    toast('Demo storage is full. Try a smaller file, or reset the demo.', 'err');
    return;
  }
  dirty = false;
  toast('Saved. The live site is updated.');
  if (goTo) { skipGuard = true; location.hash = goTo; } else render();
}

/* ---------- Render + events ---------- */

function render() {
  if (!session.get()) { app.innerHTML = loginView(); return; }
  if (!draft) fresh();
  const route = location.hash.slice(1) || 'dashboard';
  const [name, arg] = route.split('/');
  const view = VIEWS[name] || VIEWS.dashboard;
  app.innerHTML = shell(VIEWS[name] ? name : 'dashboard', view(arg));
  document.title = `${sectionLabel(route)} | ${draft.settings.shortName} Site Admin`;
  document.body.classList.remove('side-open');
}

function loginView() {
  return `
    <div class="login">
      <div class="login-card">
        <img src="assets/img/logo-mark.png" alt="" width="84">
        <h1>OBVTA Site Admin</h1>
        <p class="muted">Officers sign in here to update meetings, news, minutes and more. No technical skills needed.</p>
        <button type="button" class="btn btn-coral btn-block" data-login>Enter the demo dashboard</button>
        <p class="small muted">This is a demonstration. No password is needed, and anything you change stays in this browser.</p>
        <a href="index.html" class="small">&larr; Back to the website</a>
      </div>
    </div>`;
}

app.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.rte) { markDirty(); return; }
  if (!t.name || !draft) return;
  const v = t.type === 'checkbox' ? t.checked : t.dataset.num !== undefined ? Number(t.value) : t.value;
  setPath(draft, t.name, v);
  markDirty();
});

app.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.name && t.tagName === 'SELECT') {
    setPath(draft, t.name, t.value);
    markDirty();
    if (t.dataset.rerender !== undefined) { syncRte(); render(); }
  }
  if (t.dataset.uploadImg && t.files[0]) {
    const url = await shrinkImage(t.files[0]);
    setPath(draft, t.dataset.uploadImg, url);
    markDirty(); syncRte(); render();
    toast('Image added. Save to publish it.');
  }
  if (t.dataset.uploadFile && t.files[0]) {
    const f = t.files[0];
    if (f.size > 1.5 * 1024 * 1024) {
      toast('The demo can hold files up to 1.5 MB. The real site has no such limit.', 'err');
      return;
    }
    setPath(draft, t.dataset.uploadFile, await readFile(f));
    markDirty(); syncRte(); render();
    toast(`${f.name} uploaded. Save to publish it.`);
  }
});

// Keep rich text in the draft before any re-render wipes the editors.
function syncRte() {
  $$('[data-rte]').forEach((el) => setPath(draft, el.dataset.rte, el.innerHTML));
}

app.addEventListener('paste', (e) => {
  if (!e.target.closest('[data-rte]')) return;
  e.preventDefault();
  document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
});

app.addEventListener('click', (e) => {
  const b = e.target.closest('button, [data-img]');
  if (!b) return;
  const ds = b.dataset;

  if (ds.login !== undefined) { session.set(true); fresh(); render(); return; }
  if (ds.logout !== undefined) {
    if (dirty && !confirm('Discard unsaved changes and sign out?')) return;
    session.set(false); draft = null; dirty = false; render(); return;
  }
  if (ds.menu !== undefined) { document.body.classList.toggle('side-open'); return; }
  if (ds.save !== undefined) { doSave(); return; }
  if (ds.discard !== undefined) {
    const wasNew = location.hash === '#posts/new';
    fresh();
    if (wasNew) { skipGuard = true; location.hash = '#posts'; } else render();
    toast('Changes discarded');
    return;
  }
  if (ds.reset !== undefined) {
    if (!confirm('Reset all demo content back to the starting point?')) return;
    reset(); fresh(); render(); toast('Demo content reset'); return;
  }

  if (ds.cmd) {
    e.preventDefault();
    if (ds.cmd === 'createLink') {
      const url = prompt('Link address (https://...)');
      if (url) document.execCommand('createLink', false, url);
    } else {
      document.execCommand(ds.cmd, false, ds.val || null);
    }
    markDirty();
    return;
  }

  if (ds.img !== undefined && b.closest('[data-imgpick]')) {
    setPath(draft, b.closest('[data-imgpick]').dataset.imgpick, ds.img);
    markDirty(); syncRte(); render(); return;
  }

  if (ds.rm) {
    const keys = ds.rm.split('.');
    const idx = Number(keys.pop());
    getPath(draft, keys.join('.')).splice(idx, 1);
    markDirty(); syncRte(); render(); return;
  }
  if (ds.clear) { setPath(draft, ds.clear, ''); markDirty(); render(); return; }
  if (ds.move) {
    const keys = ds.move.split('.');
    const idx = Number(keys.pop());
    const arr = getPath(draft, keys.join('.'));
    const j = idx + Number(ds.dir);
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    markDirty(); render(); return;
  }
  if (ds.add) {
    const blank = { officers: { id: uid(), role: 'Director', name: '' }, documents: { id: uid(), title: '', url: '', category: 'Reports' }, links: { id: uid(), group: draft.links.at(-1)?.group || 'General', label: '', url: '' } }[ds.add];
    getPath(draft, ds.add).push(blank);
    markDirty(); render();
    const inputs = $$('.rowcard input:not([type=hidden])');
    inputs.at(-2)?.focus();
    return;
  }
  if (ds.adddate) {
    const input = $(`[data-newdate="${ds.adddate}"]`);
    if (!input.value) { input.focus(); return; }
    const arr = getPath(draft, ds.adddate);
    if (!arr.includes(input.value)) arr.push(input.value);
    arr.sort();
    markDirty(); render(); return;
  }
  if (ds.addArchive !== undefined) {
    const latest = draft.meetings.archive.map((a) => a.month).sort().at(-1);
    let [y, m] = (latest || isoToday().slice(0, 7)).split('-').map(Number);
    m++; if (m > 12) { m = 1; y++; }
    draft.meetings.archive.unshift({ id: uid(), month: `${y}-${String(m).padStart(2, '0')}`, held: true, minutes: '', treasurer: '' });
    markDirty(); render(); return;
  }

  if (ds.delPost) {
    const p = draft.posts.find((x) => x.id === ds.delPost);
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const base = clone(load());
    base.posts = base.posts.filter((x) => x.id !== ds.delPost);
    save(base, `Deleted post "${p.title}"`);
    fresh();
    toast('Post deleted');
    if (location.hash.startsWith('#posts/')) { location.hash = '#posts'; } else render();
    return;
  }
  if (ds.postFilter) { sessionStorage.setItem('adm-post-filter', ds.postFilter); render(); return; }
  if (ds.inboxFilter) { sessionStorage.setItem('adm-inbox-filter', ds.inboxFilter); render(); return; }
  if (ds.delMsg) {
    if (!confirm('Delete this item?')) return;
    const base = clone(load());
    base.inbox = base.inbox.filter((x) => x.id !== ds.delMsg);
    save(base, 'Deleted an inbox item');
    fresh(); render(); toast('Deleted');
    return;
  }
  if (ds.export !== undefined) { exportCsv(); }
});

// Opening an unread message marks it read.
app.addEventListener('toggle', (e) => {
  const el = e.target;
  if (!el.matches?.('[data-msg]') || !el.open || !el.classList.contains('unread')) return;
  const base = clone(load());
  const item = base.inbox.find((x) => x.id === el.dataset.msg);
  if (item) { item.read = true; save(base); }
  const it = draft.inbox.find((x) => x.id === el.dataset.msg);
  if (it) it.read = true;
  el.classList.remove('unread');
  const badge = $('.side-nav a[href="#inbox"] em');
  const n = draft.inbox.filter((x) => !x.read).length;
  if (badge) { if (n) badge.textContent = n; else badge.remove(); }
}, true);

function exportCsv() {
  const rows = draft.inbox.filter((x) => x.type === 'membership');
  const cols = ['date', 'name', 'email', 'phone', 'address', 'kind', 'committee'];
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'obvta-members.csv';
  a.click();
}

window.addEventListener('hashchange', () => {
  if (skipGuard) { skipGuard = false; lastHash = location.hash; render(); scrollTo(0, 0); return; }
  if (dirty && !confirm('You have unsaved changes. Leave without saving?')) {
    skipGuard = true;
    location.hash = lastHash;
    return;
  }
  if (dirty) fresh();
  else if (draft) draft.posts = draft.posts.filter((p) => !p._new);
  lastHash = location.hash;
  render();
  scrollTo(0, 0);
});

window.addEventListener('beforeunload', (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

// Keep the inbox fresh when a visitor submits a form in another tab.
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY || dirty || !session.get()) return;
  fresh();
  render();
});

render();

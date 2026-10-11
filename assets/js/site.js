import { load, save, invalidate, session, uid, currentTerm, STORAGE_KEY } from './store.js';
import { initJoin, wireJoin } from './join.js';
import {
  $, $$, esc, fmtDate, fmtLong, fmtMonth, daysUntil, relDays, nextOnOrAfter, parseDate, today,
  sanitize, toast, icsFile, initials, isoToday,
} from './util.js';

const page = document.body.dataset.page;

const NAV = [
  ['home', 'index.html', 'Home'],
  ['about', 'about.html', 'About'],
  ['meetings', 'meetings.html', 'Meetings'],
  ['news', 'news.html', 'News'],
  ['resources', 'resources.html', 'Resources'],
];

// Where "Edit this page" sends a signed-in admin.
const EDIT_TARGET = {
  home: 'home', about: 'pages', meetings: 'meetings', news: 'posts', resources: 'links', membership: 'members',
};

function render() {
  const d = load();
  $('#site-header').innerHTML = header(d);
  $('#site-footer').innerHTML = footer(d);
  const main = $('#main');
  main.innerHTML = (PAGES[page] || (() => ''))(d);
  document.title = pageTitle(d);
  wire(d);
}

function pageTitle(d) {
  const label = { home: '', about: 'About', meetings: 'Meetings', news: 'News', resources: 'Resources', membership: 'Join' }[page];
  const post = page === 'news' && currentPost(d);
  const base = `${d.settings.shortName} | Ortley Beach Voters and Taxpayers Association`;
  if (post) return `${post.title} | ${d.settings.shortName}`;
  return label ? `${label} | ${d.settings.shortName}` : base;
}

/* ---------- Shared chrome ---------- */

function header(d) {
  const s = d.settings;
  const a = s.announcement;
  let annHidden = false;
  try { annHidden = sessionStorage.getItem('obvta-ann-hidden') === a.text; } catch (e) { /* ignore */ }
  const admin = session.get();
  const editHash = page === 'news' && currentPost(d) ? `posts/${currentPost(d).id}` : EDIT_TARGET[page];
  return `
    ${admin ? `
    <div class="adminbar">
      <span class="adminbar-who"><span class="dot"></span> Signed in as <strong>Site Admin</strong></span>
      <span class="adminbar-actions">
        <a href="admin.html#${editHash}">Edit this page</a>
        <a href="admin.html">Dashboard</a>
        <button type="button" data-signout>Sign out</button>
      </span>
    </div>` : ''}
    ${a.on && a.text && !annHidden ? `
    <div class="announce" role="region" aria-label="Announcement">
      <p>${esc(a.text)} ${a.link ? `<a href="${esc(a.link)}">${esc(a.linkLabel || 'Learn more')} &rarr;</a>` : ''}</p>
      <button type="button" class="announce-x" aria-label="Dismiss announcement" data-ann-x>&times;</button>
    </div>` : ''}
    <header class="masthead">
      <div class="wrap masthead-row">
        <a class="brand" href="index.html">
          <img src="assets/img/logo-mark.png" alt="" width="46" height="35">
          <span><strong>${esc(s.shortName)}</strong><small>Ortley Beach Voters &amp; Taxpayers</small></span>
        </a>
        <button class="navtoggle" type="button" aria-expanded="false" aria-controls="nav" data-navtoggle>
          <span></span><span></span><span></span><em class="sr">Menu</em>
        </button>
        <nav id="nav" class="nav">
          ${NAV.map(([k, href, label]) => `<a href="${href}" ${k === page ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
          <a class="btn btn-coral btn-sm" href="membership.html" ${page === 'membership' ? 'aria-current="page"' : ''}>Join ${esc(s.shortName)}</a>
        </nav>
      </div>
    </header>`;
}

function footer(d) {
  const s = d.settings;
  return `
    <div class="wrap footer-grid">
      <div>
        <a class="brand brand-light" href="index.html">
          <img src="assets/img/logo-mark.png" alt="" width="46" height="35">
          <span><strong>${esc(s.shortName)}</strong><small>Ortley Beach Voters &amp; Taxpayers</small></span>
        </a>
        <p class="footer-mission">A non-profit working to improve the quality of life in Ortley Beach, a neighborhood of Toms River Township, NJ.</p>
      </div>
      <div>
        <h4>Contact</h4>
        <p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
        <p>${esc(s.orgName)}<br>${esc(s.mailing)}</p>
      </div>
      <div>
        <h4>Get involved</h4>
        <p><a href="membership.html">Become a member</a></p>
        <p><a href="meetings.html">Attend a meeting</a></p>
        <p><a href="about.html#contact">Send us a message</a></p>
      </div>
    </div>
    <div class="wrap footer-base">
      <span>&copy; ${new Date().getFullYear()} ${esc(s.orgName)}</span>
      <a href="admin.html" class="footer-admin">${session.get() ? 'Dashboard' : 'Admin sign in'}</a>
    </div>`;
}

function editPin(target, label = 'Edit') {
  return session.get() ? `<a class="editpin" href="admin.html#${target}" title="Edit in dashboard">&#9998; ${label}</a>` : '';
}

function pageHead(title, lede, image) {
  return `
    <section class="pagehead" ${image ? `style="--img:${cssUrl(image)}"` : ''}>
      <div class="wrap">
        <h1>${esc(title)}</h1>
        ${lede ? `<p>${esc(lede)}</p>` : ''}
      </div>
    </section>`;
}

/* ---------- Meeting helpers ---------- */

function nextMeeting(d) {
  const date = nextOnOrAfter(d.meetings.schedule);
  return date ? { date, days: daysUntil(date) } : null;
}

function meetingCard(d, { compact = false } = {}) {
  const m = d.meetings;
  const next = nextMeeting(d);
  if (!next) {
    return `
      <div class="meetcard">
        <div class="meetcard-top"><span class="kicker">Member meetings</span>${editPin('meetings')}</div>
        <h3>The ${new Date().getFullYear()} season has wrapped up.</h3>
        <p class="muted">Next season's dates will be posted here as soon as the Board sets them. Meetings usually run April through October.</p>
        <a class="btn btn-ghost" href="meetings.html#archive">Read past minutes</a>
      </div>`;
  }
  const dt = parseDate(next.date);
  return `
    <div class="meetcard">
      <div class="meetcard-top"><span class="kicker">Next member meeting</span>${editPin('meetings')}</div>
      <div class="meetcard-body">
        <div class="cal" aria-hidden="true">
          <span>${dt.toLocaleDateString('en-US', { month: 'short' })}</span>
          <strong>${dt.getDate()}</strong>
          <em>${dt.toLocaleDateString('en-US', { weekday: 'short' })}</em>
        </div>
        <div>
          <p class="meetcard-when">${fmtLong(next.date)} <span class="pill">${relDays(next.days)}</span></p>
          <p><strong>${esc(m.start)}</strong> meeting &middot; coffee at ${esc(m.coffee)}</p>
          <p>${esc(m.location)}<br><span class="muted">${esc(m.address)}</span></p>
          ${compact ? '' : `<p class="muted small">${m.zoom ? 'A Zoom link will be emailed to members.' : 'Sorry, no Zoom for this meeting.'} ${esc(m.note)}</p>`}
        </div>
      </div>
      <div class="meetcard-actions">
        <button type="button" class="btn btn-navy btn-sm" data-ics="${next.date}">Add to calendar</button>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://maps.google.com/?q=${encodeURIComponent(m.address)}">Directions</a>
      </div>
    </div>`;
}

/* ---------- Posts ---------- */

function publishedPosts(d) {
  return d.posts
    .filter((p) => p.status === 'published')
    .sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
}

function currentPost(d) {
  const id = new URLSearchParams(location.search).get('post');
  if (!id) return null;
  const p = d.posts.find((x) => x.id === id);
  if (!p) return null;
  if (p.status !== 'published' && !session.get()) return null;
  return p;
}

function postCard(p) {
  const upcoming = p.type === 'event' && p.eventDate && daysUntil(p.eventDate) >= 0;
  return `
    <article class="card post ${p.image ? '' : 'post-noimg'}">
      ${p.image ? `<a class="post-img" href="news.html?post=${esc(p.id)}"><img src="${esc(p.image)}" alt="" loading="lazy"></a>` : ''}
      <div class="post-body">
        <p class="post-meta">
          <span class="tag tag-${p.type}">${p.type === 'event' ? 'Event' : 'News'}</span>
          ${p.pinned ? '<span class="tag tag-pin">Pinned</span>' : ''}
          ${upcoming ? `<span class="tag tag-soon">${relDays(daysUntil(p.eventDate))}</span>` : ''}
          <time>${fmtDate(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
        </p>
        <h3><a href="news.html?post=${esc(p.id)}">${esc(p.title)}</a></h3>
        <p>${esc(p.excerpt)}</p>
        ${p.source ? `<p class="post-src">via ${esc(p.source)}</p>` : ''}
      </div>
    </article>`;
}

/* ---------- Pages ---------- */

const PAGES = {
  home(d) {
    const s = d.settings;
    const posts = publishedPosts(d).slice(0, 3);
    const council = nextOnOrAfter(d.meetings.council.dates);
    return `
      <section class="hero" style="--img:${cssUrl(s.heroImage)}">
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">${esc(s.heroEyebrow)}</p>
            <h1>${esc(s.heroTitle)}</h1>
            <p class="hero-text">${esc(s.heroText)}</p>
            <div class="hero-ctas">
              <a class="btn btn-coral" href="membership.html">Join Today</a>
              <a class="btn btn-light" href="meetings.html">Meetings &amp; minutes</a>
            </div>
            ${editPin('home', 'Edit hero')}
          </div>
          <div class="hero-card">${meetingCard(d, { compact: true })}</div>
        </div>
      </section>

      <section class="stats">
        <div class="wrap stats-row">
          ${s.stats.map((x) => `<div><strong>${esc(x.value)}</strong><span>${esc(x.label)}</span></div>`).join('')}
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <div><p class="kicker">Latest</p><h2>News &amp; updates</h2></div>
            <div class="section-head-r">${editPin('posts', 'Manage posts')}<a class="link-arrow" href="news.html">All news &rarr;</a></div>
          </div>
          <div class="grid3">${posts.map(postCard).join('')}</div>
        </div>
      </section>

      <section class="section section-sand">
        <div class="wrap split">
          <div>
            <p class="kicker">Membership</p>
            <h2>Why join ${esc(s.shortName)}?</h2>
            <p class="lede">We represent the residents of Ortley Beach and work to improve life in our community. The more members we have, the louder that voice is in Toms River and Trenton.</p>
            <a class="btn btn-coral" href="membership.html">Become a member</a>
            ${editPin('home', 'Edit')}
          </div>
          <ol class="reasons">
            ${s.whyJoin.map((r, i) => `<li><span>${i + 1}</span><div><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div></li>`).join('')}
          </ol>
        </div>
      </section>

      <section class="section">
        <div class="wrap split split-even">
          <div class="card pad feature">
            <p class="kicker">Board report</p>
            <h3>Should Ortley Beach secede from Toms River?</h3>
            <div class="prose">${sanitize(d.pages.secession)}</div>
            <a class="btn btn-ghost btn-sm" href="about.html#documents">Read the report</a>
          </div>
          <div class="card pad feature feature-photo" style="--img:${cssUrl('assets/img/lifeboat-crew.jpg')}">
            <div>
              <p class="kicker">Make your voice heard</p>
              <h3>Toms River Town Council</h3>
              ${council ? `<p>Next meeting <strong>${fmtLong(council)}</strong> at ${esc(d.meetings.council.time)}, ${esc(d.meetings.council.place)}.</p>` : '<p>Council dates for next year are coming soon.</p>'}
              <p>Every meeting has a public comment session. Council rarely acts on issues that no one shows up to speak about.</p>
              <a class="btn btn-light btn-sm" href="meetings.html#council">Full council schedule</a>
            </div>
          </div>
        </div>
      </section>`;
  },

  about(d) {
    const s = d.settings;
    return `
      ${pageHead('About ' + s.shortName, 'Neighbors working together for Ortley Beach since the 1950s.', 'assets/img/guards-afternoon.jpg')}
      <section class="section">
        <div class="wrap split split-wide">
          <div class="prose">
            ${editPin('pages', 'Edit page')}
            <blockquote class="mission"><span class="kicker">Our mission</span>${esc(d.pages.mission)}</blockquote>
            ${sanitize(d.pages.about)}
          </div>
          <aside class="card pad">
            <h3>Meet us in person</h3>
            <p>Member meetings are held on Saturday mornings from April to October at ${esc(d.meetings.location)}.</p>
            <a class="btn btn-navy btn-sm" href="meetings.html">See the schedule</a>
            <hr>
            <h3>Mailing address</h3>
            <p>${esc(s.orgName)}<br>${esc(s.mailing)}</p>
          </aside>
        </div>
      </section>

      <section class="section section-sand" id="officers">
        <div class="wrap">
          <div class="section-head">
            <div><p class="kicker">Leadership</p><h2>Officers &amp; Board of Directors</h2></div>
            <div class="section-head-r">${editPin('officers', 'Edit officers')}</div>
          </div>
          <div class="people">
            ${d.officers.map((o) => `
              <div class="person">
                <span class="avatar">${esc(initials(o.name))}</span>
                <div><strong>${esc(o.name)}</strong><span>${esc(o.role)}</span></div>
              </div>`).join('')}
          </div>
          <p class="muted">To reach any officer, email <a href="mailto:${esc(s.email)}">${esc(s.email)}</a>.</p>
        </div>
      </section>

      <section class="section">
        <div class="wrap split split-even">
          <div>
            <p class="kicker">Planning</p>
            <h2>Ortley Beach Strategic Plan</h2>
            <div class="prose">${sanitize(d.pages.strategic)}</div>
          </div>
          <div id="documents">
            <div class="section-head"><div><p class="kicker">Library</p><h2>Key documents</h2></div><div class="section-head-r">${editPin('documents', 'Edit')}</div></div>
            <ul class="doclist">
              ${d.documents.filter((x) => x.category !== 'Membership').map(docItem).join('')}
            </ul>
          </div>
        </div>
      </section>

      <section class="section section-sand" id="contact">
        <div class="wrap split">
          <div>
            <p class="kicker">Contact</p>
            <h2>Send us a message</h2>
            <p class="lede">Questions, concerns or ideas for the Board? Messages go straight to the officers.</p>
            <p>Or email <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
          </div>
          <form class="card pad form" data-form="message">
            <div class="row2">
              <label>Name<input name="name" required autocomplete="name"></label>
              <label>Email<input name="email" type="email" required autocomplete="email"></label>
            </div>
            <label>Subject<input name="subject" required></label>
            <label>Message<textarea name="message" rows="5" required></textarea></label>
            <button class="btn btn-navy" type="submit">Send message</button>
          </form>
        </div>
      </section>`;
  },

  meetings(d) {
    const m = d.meetings;
    const t = today();
    const years = [...new Set(m.archive.map((a) => a.month.slice(0, 4)))].sort().reverse();
    const nextCouncil = nextOnOrAfter(m.council.dates);
    return `
      ${pageHead('Meetings', 'Member meetings, minutes, treasurer reports and the Town Council calendar.', 'assets/img/lifeguard-stand.jpg')}
      <section class="section">
        <div class="wrap split">
          <div>${meetingCard(d)}</div>
          <div>
            <div class="section-head"><div><p class="kicker">${parseDate(m.schedule[0] || isoToday()).getFullYear()} season</p><h2>Meeting dates</h2></div></div>
            <p>All meetings begin at ${esc(m.start)} with coffee, tea and pastries at ${esc(m.coffee)}, at ${esc(m.location)}, ${esc(m.address)}.</p>
            <ul class="season">
              ${[...m.schedule].sort().map((date) => {
                const past = parseDate(date) < t;
                const rec = m.archive.find((a) => a.month === date.slice(0, 7));
                const isNext = date === nextOnOrAfter(m.schedule);
                return `<li class="${past ? 'past' : ''} ${isNext ? 'next' : ''}">
                  <span>${fmtDate(date, { weekday: 'short', month: 'long', day: 'numeric' })}</span>
                  ${isNext ? '<em class="pill">Next</em>' : past && rec?.minutes ? `<a href="${esc(rec.minutes)}" target="_blank" rel="noopener">Minutes</a>` : past ? '<em class="muted small">Minutes coming soon</em>' : ''}
                </li>`;
              }).join('')}
            </ul>
            <p class="small muted">See our <a href="${esc(docUrl(d, 'Meeting Guidelines'))}" target="_blank" rel="noopener">meeting guidelines</a> and <a href="${esc(docUrl(d, 'Bylaws'))}" target="_blank" rel="noopener">bylaws</a> for procedures.</p>
          </div>
        </div>
      </section>

      <section class="section section-sand" id="archive">
        <div class="wrap">
          <div class="section-head">
            <div><p class="kicker">Records</p><h2>Minutes &amp; treasurer reports</h2></div>
            <div class="section-head-r">${editPin('meetings', 'Add minutes')}
              <div class="chips" role="tablist">
                ${years.map((y, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-year="${y}">${y}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="table-wrap">
            <table class="records">
              <thead><tr><th>Month</th><th>Minutes</th><th>Treasurer report</th></tr></thead>
              <tbody>
                ${[...m.archive].sort((a, b) => b.month.localeCompare(a.month)).map((a) => `
                  <tr data-row-year="${a.month.slice(0, 4)}">
                    <td>${fmtMonth(a.month)}</td>
                    <td>${a.minutes ? `<a class="doc-a" href="${esc(a.minutes)}" target="_blank" rel="noopener">Minutes</a>` : '<span class="muted">No meeting held</span>'}</td>
                    <td>${a.treasurer ? `<a class="doc-a" href="${esc(a.treasurer)}" target="_blank" rel="noopener">Report</a>` : '<span class="muted">Not posted</span>'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="section" id="council">
        <div class="wrap">
          <div class="section-head">
            <div><p class="kicker">Toms River</p><h2>Town Council meetings</h2></div>
            <div class="section-head-r">${editPin('meetings', 'Edit')}</div>
          </div>
          <p class="lede">Council meets at ${esc(m.council.time)} at ${esc(m.council.place)}. There is a public comment session at every meeting. Please come and make your voice heard.</p>
          <div class="quarters">
            ${[1, 2, 3, 4].map((q) => `
              <div class="card pad">
                <h3>Quarter ${q}</h3>
                <ul>${m.council.dates.filter((x) => Math.floor(parseDate(x).getMonth() / 3) + 1 === q).sort().map((x) => `
                  <li class="${parseDate(x) < t ? 'past' : ''} ${x === nextCouncil ? 'next' : ''}">${fmtDate(x, { weekday: 'short', month: 'short', day: 'numeric' })}${x === nextCouncil ? ' <em class="pill">Next</em>' : ''}</li>`).join('')}
                </ul>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
  },

  news(d) {
    const p = currentPost(d);
    if (p) return article(d, p);
    const posts = publishedPosts(d);
    return `
      ${pageHead('News & events', 'What is happening in and around Ortley Beach.', 'assets/img/kites.jpg')}
      <section class="section">
        <div class="wrap">
          <div class="toolbar">
            <div class="chips">
              <button type="button" class="chip on" data-filter="all">All</button>
              <button type="button" class="chip" data-filter="news">News</button>
              <button type="button" class="chip" data-filter="event">Events</button>
            </div>
            <label class="search"><span class="sr">Search news</span><input type="search" placeholder="Search posts" data-search></label>
            ${editPin('posts/new', 'New post')}
          </div>
          <div class="grid3" data-posts>${posts.map((x) => `<div data-type="${x.type}" data-text="${esc((x.title + ' ' + x.excerpt).toLowerCase())}">${postCard(x)}</div>`).join('')}</div>
          <p class="empty" data-empty hidden>No posts match that search.</p>
        </div>
      </section>`;
  },

  resources(d) {
    const groups = [...new Set(d.links.map((l) => l.group))];
    const cats = [...new Set(d.documents.map((x) => x.category))];
    return `
      ${pageHead('Resources', 'Useful links and documents for Ortley Beach residents.', 'assets/img/evening-beach.jpg')}
      <section class="section">
        <div class="wrap">
          <div class="toolbar">
            <label class="search search-wide"><span class="sr">Search resources</span><input type="search" placeholder="Search links and documents" data-search-res></label>
            ${editPin('links', 'Edit links')}
          </div>
          <div class="linkgroups">
            ${groups.map((g) => `
              <div class="card pad linkgroup">
                <h3>${esc(g)}</h3>
                <ul>${d.links.filter((l) => l.group === g).map((l) => `<li data-res="${esc(l.label.toLowerCase())}"><a href="${esc(l.url)}" ${l.url.startsWith('mailto:') ? '' : 'target="_blank" rel="noopener"'}>${esc(l.label)}</a></li>`).join('')}</ul>
              </div>`).join('')}
          </div>
          <div class="section-head" style="margin-top:3rem"><div><p class="kicker">Library</p><h2>Documents</h2></div><div class="section-head-r">${editPin('documents', 'Edit')}</div></div>
          <div class="linkgroups">
            ${cats.map((c) => `
              <div class="card pad linkgroup">
                <h3>${esc(c)}</h3>
                <ul class="doclist">${d.documents.filter((x) => x.category === c).map(docItem).join('')}</ul>
              </div>`).join('')}
          </div>
          <p class="small muted">${esc(d.settings.orgName)} is not responsible for the content or privacy practices of other websites linked from this site.</p>
        </div>
      </section>`;
  },

  membership(d) {
    const s = d.settings;
    return `
      ${pageHead('Join or renew', `Membership is $${s.fee} a year and runs ${currentTerm().label}. It takes about a minute.`, 'assets/img/boat-launch.jpg')}
      <section class="section">
        <div class="wrap split split-wide">
          <div class="card pad join" data-join></div>
          <div>
            <h3>What your $${esc(s.fee)} does</h3>
            <ul class="ticks">
              ${s.whyJoin.map((r) => `<li><strong>${esc(r.title)}.</strong> ${esc(r.text)}</li>`).join('')}
              <li><strong>Supports the work.</strong> Dues fund meeting space, mailings and our advocacy with Toms River, Ocean County and the State.</li>
            </ul>
          </div>
        </div>
      </section>`;
  },
};

function article(d, p) {
  const upcoming = p.type === 'event' && p.eventDate;
  const related = publishedPosts(d).filter((x) => x.id !== p.id).slice(0, 3);
  return `
    <article class="article">
      <div class="wrap narrow">
        <a class="link-arrow back" href="news.html">&larr; All news</a>
        ${p.status !== 'published' ? '<p class="draftnote">Draft: only admins can see this post.</p>' : ''}
        <p class="post-meta"><span class="tag tag-${p.type}">${p.type === 'event' ? 'Event' : 'News'}</span><time>${fmtDate(p.date)}</time>${editPin('posts/' + p.id, 'Edit post')}</p>
        <h1>${esc(p.title)}</h1>
        <p class="lede">${esc(p.excerpt)}</p>
      </div>
      ${p.image ? `<div class="wrap article-img"><img src="${esc(p.image)}" alt=""></div>` : ''}
      <div class="wrap narrow">
        ${upcoming ? `
          <div class="eventbox">
            <div><span class="kicker">When</span><strong>${fmtLong(p.eventDate)}</strong>${p.eventTime ? `<span>${esc(p.eventTime)}</span>` : ''}</div>
            ${p.eventPlace ? `<div><span class="kicker">Where</span><strong>${esc(p.eventPlace)}</strong></div>` : ''}
            ${daysUntil(p.eventDate) >= 0 ? `<button type="button" class="btn btn-navy btn-sm" data-ics-event>Add to calendar</button>` : '<span class="pill pill-muted">Past event</span>'}
          </div>` : ''}
        <div class="prose">${sanitize(p.body)}</div>
        ${p.url ? `<p><a class="btn btn-navy" href="${esc(p.url)}" target="_blank" rel="noopener">Read the full story${p.source ? ' at ' + esc(p.source) : ''} &nearr;</a></p>` : ''}
      </div>
    </article>
    ${related.length ? `
    <section class="section section-sand">
      <div class="wrap">
        <div class="section-head"><div><h2>More news</h2></div></div>
        <div class="grid3">${related.map(postCard).join('')}</div>
      </div>
    </section>` : ''}`;
}

// A url() inside a CSS custom property resolves against the stylesheet that
// uses it, not this page, so hand CSS an absolute address.
function cssUrl(src) {
  return esc(`url("${new URL(src, location.href).href}")`);
}

function docItem(x) {
  return `<li data-res="${esc(x.title.toLowerCase())}"><a class="doc-a" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></li>`;
}
function docUrl(d, startsWith) {
  return (d.documents.find((x) => x.title.startsWith(startsWith)) || {}).url || '#';
}

/* ---------- Behaviour ---------- */

function wire(d) {
  $('[data-navtoggle]')?.addEventListener('click', (e) => {
    const open = document.body.classList.toggle('nav-open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
  $('[data-ann-x]')?.addEventListener('click', () => {
    try { sessionStorage.setItem('obvta-ann-hidden', d.settings.announcement.text); } catch (e) { /* ignore */ }
    $('.announce')?.remove();
  });
  $('[data-signout]')?.addEventListener('click', () => { session.set(false); render(); toast('Signed out'); });

  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => icsFile({
    title: `${d.settings.shortName} member meeting`, date: b.dataset.ics, start: d.meetings.start, end: '11:00am',
    location: `${d.meetings.location}, ${d.meetings.address}`, description: `Coffee at ${d.meetings.coffee}.`,
  })));
  $('[data-ics-event]')?.addEventListener('click', () => {
    const p = currentPost(d);
    const [start, end] = (p.eventTime || '').split(/\s*(?:to|-)\s*/);
    icsFile({ title: p.title, date: p.eventDate, start, end: end || start, location: p.eventPlace, description: p.excerpt });
  });

  // News filter and search
  const grid = $('[data-posts]');
  if (grid) {
    let filter = 'all';
    let q = '';
    const apply = () => {
      let shown = 0;
      $$('[data-type]', grid).forEach((el) => {
        const ok = (filter === 'all' || el.dataset.type === filter) && el.dataset.text.includes(q);
        el.hidden = !ok;
        if (ok) shown++;
      });
      $('[data-empty]').hidden = shown > 0;
    };
    $$('[data-filter]').forEach((b) => b.addEventListener('click', () => {
      $$('[data-filter]').forEach((x) => x.classList.toggle('on', x === b));
      filter = b.dataset.filter;
      apply();
    }));
    $('[data-search]').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); apply(); });
  }

  // Minutes archive year filter
  const years = $$('[data-year]');
  if (years.length) {
    const show = (y) => {
      years.forEach((b) => b.classList.toggle('on', b.dataset.year === y));
      $$('[data-row-year]').forEach((r) => { r.hidden = r.dataset.rowYear !== y; });
    };
    years.forEach((b) => b.addEventListener('click', () => show(b.dataset.year)));
    show(years[0].dataset.year);
  }

  // Resources search
  $('[data-search-res]')?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    $$('[data-res]').forEach((li) => { li.hidden = !li.dataset.res.includes(q); });
    $$('.linkgroup').forEach((g) => { g.hidden = !$$('[data-res]', g).some((li) => !li.hidden); });
  });

  const join = $('[data-join]');
  if (join) { initJoin(join); wireJoin(); }

  // Forms land in the dashboard inbox.
  $$('form[data-form]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f));
    const fresh = load();
    const item = { id: uid(), type: f.dataset.form, date: isoToday(), read: false, ...data };
    if (f.dataset.form === 'membership') { item.paid = true; item.committee = !!data.committee; }
    fresh.inbox.unshift(item);
    save(fresh, f.dataset.form === 'membership' ? `New membership from ${data.name}` : `Message from ${data.name}`);
    f.outerHTML = f.dataset.form === 'membership'
      ? `<div class="card pad thanks"><span class="bigcheck">&#10003;</span><h2>Welcome aboard, ${esc(data.name.split(' ')[0])}!</h2><p>Your ${esc(data.kind.toLowerCase())} for ${esc(d.settings.membershipYear)} is recorded. A receipt would go to <strong>${esc(data.email)}</strong>.</p><p class="small muted">Demo: this submission now appears in the admin dashboard inbox.</p></div>`
      : `<div class="card pad thanks"><span class="bigcheck">&#10003;</span><h2>Message sent</h2><p>Thanks, ${esc(data.name.split(' ')[0])}. An officer will reply to ${esc(data.email)}.</p><p class="small muted">Demo: this message now appears in the admin dashboard inbox.</p></div>`;
  }));
}

// Files uploaded in the demo dashboard are stored as data URLs, which browsers
// refuse to open directly in a new tab. Convert them to a blob first.
document.addEventListener('click', async (e) => {
  const a = e.target.closest('a[href^="data:"]');
  if (!a) return;
  e.preventDefault();
  const blob = await (await fetch(a.href)).blob();
  window.open(URL.createObjectURL(blob), '_blank');
});

// If the dashboard is open in another tab, show its edits here right away.
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY || e.key === null || e.key === 'obvta-demo-admin') {
    invalidate();
    const y = scrollY;
    render();
    scrollTo(0, y);
  }
});

render();

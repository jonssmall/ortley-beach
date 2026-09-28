// The membership flow: one form for new and returning members.
// Step 1 asks for an email. If we know it, the member's details come back
// pre-filled; if not, it becomes a new-member form. Payment is one step with
// card or check as two options inside it.

import { load, save, uid, currentTerm, memberStatus } from './store.js';
import { $, $$, esc, fmtDate, isoToday } from './util.js';

const DONATIONS = [0, 10, 25, 50];

let root;
let st;

export function initJoin(el) {
  root = el;
  const d = load();
  st = { step: 'email', member: null, form: {}, donation: 0, method: 'card', autoRenew: true, donateOnly: false };
  const renewId = new URLSearchParams(location.search).get('renew');
  const m = renewId && d.members.find((x) => x.id === renewId);
  if (m) useMember(m);
  draw();
}

function useMember(m) {
  st.member = m;
  st.form = { name: m.name, email: m.email, phone: m.phone, address: m.address, type: m.type, committee: m.committee };
  st.autoRenew = m.autoRenew || st.autoRenew;
  st.step = memberStatus(m) === 'current' ? 'current' : 'details';
}

// "Linda and Frank Moretti" -> "Linda"; "The Delgado Family" stays whole.
function first(name) {
  const n = String(name).trim();
  return /^the\s/i.test(n) ? n : n.split(/\s+/)[0];
}

function draw() {
  const d = load();
  const fee = Number(d.settings.fee);
  const term = currentTerm();
  const steps = ['Email', 'Your details', 'Payment'];
  const at = { email: 0, current: 0, details: 1, pay: 2, done: 3 }[st.step];
  const progress = st.step === 'done' ? '' : `
    <ol class="steps" aria-label="Progress">
      ${steps.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><span>${i < at ? '&#10003;' : i + 1}</span>${s}</li>`).join('')}
    </ol>`;
  root.innerHTML = progress + VIEWS[st.step](d, fee, term);
  root.querySelector('[autofocus]')?.focus();
}

const VIEWS = {
  email(d, fee, term) {
    return `
      <form class="form" data-step="email">
        <h2>Join or renew</h2>
        <p class="muted">Enter your email. If you've been a member before, we'll fill in your details for you.</p>
        <label>Email address<input name="email" type="email" required autocomplete="email" autofocus value="${esc(st.form.email || '')}"></label>
        <button class="btn btn-coral btn-block" type="submit">Continue</button>
        <p class="demo-hint">Demo: try <button type="button" class="linkbtn" data-try="tkeane@example.com">tkeane@example.com</button> (membership lapsed), <button type="button" class="linkbtn" data-try="maria.r@example.com">maria.r@example.com</button> (already paid), or any other address to join as new.</p>
      </form>`;
  },

  current(d, fee, term) {
    const m = st.member;
    return `
      <div class="form">
        <div class="hello"><span class="bigcheck sm">&#10003;</span><div><h2>You're all set, ${esc(first(m.name))}</h2>
        <p>Your membership runs through <strong>${fmtDate(m.paidThrough)}</strong>.${m.autoRenew ? ' It will renew automatically next April.' : ''}</p></div></div>
        <p class="muted">Nothing to pay right now. You can still:</p>
        <div class="choice">
          <button type="button" class="choice-btn" data-go="details"><strong>Update my details</strong><span>New phone number or address</span></button>
          <button type="button" class="choice-btn" data-go="donate"><strong>Make a donation</strong><span>Support OBVTA's work beyond dues</span></button>
        </div>
        <button type="button" class="linkbtn" data-go="email">Not ${esc(m.email)}? Use a different email</button>
      </div>`;
  },

  details(d, fee, term) {
    const m = st.member;
    const f = st.form;
    const updating = m && memberStatus(m) === 'current';
    const intro = !m
      ? `<h2>Welcome! Let's get you set up</h2><p class="muted">Joining as <strong>${esc(f.email)}</strong>. <button type="button" class="linkbtn" data-go="email">Change</button></p>`
      : updating
        ? `<h2>Update your details</h2>`
        : `<h2>Welcome back, ${esc(first(m.name))}</h2><p class="notice">Your membership ended on <strong>${fmtDate(m.paidThrough)}</strong>. Check your details below, then renew for ${esc(term.label)}.</p>`;
    return `
      <form class="form" data-step="details">
        ${intro}
        ${!updating ? `
        <fieldset class="seg">
          <legend class="sr">Membership type</legend>
          <label><input type="radio" name="type" value="household" ${f.type !== 'business' ? 'checked' : ''}><span>Household</span></label>
          <label><input type="radio" name="type" value="business" ${f.type === 'business' ? 'checked' : ''}><span>Business</span></label>
        </fieldset>` : ''}
        <label>${f.type === 'business' ? 'Business name' : 'Name(s) on the membership'}<input name="name" required autocomplete="name" value="${esc(f.name || '')}" ${m ? '' : 'autofocus'} placeholder="e.g. Jane and John Smith"></label>
        <div class="row2">
          <label>Phone<input name="phone" type="tel" required autocomplete="tel" value="${esc(f.phone || '')}"></label>
          <label>Ortley Beach address<input name="address" required value="${esc(f.address || '')}" placeholder="Street address"></label>
        </div>
        <label class="check"><input type="checkbox" name="committee" ${f.committee ? 'checked' : ''}> I'm interested in joining a committee</label>
        <button class="btn btn-coral btn-block" type="submit">${updating ? 'Save my details' : 'Continue to payment'}</button>
      </form>`;
  },

  pay(d, fee, term) {
    const dues = st.donateOnly ? 0 : fee;
    const total = dues + st.donation;
    const f = st.form;
    return `
      <div class="form" data-step="pay">
        <h2>${st.donateOnly ? 'Make a donation' : 'Payment'}</h2>
        <div class="summary">
          ${dues ? `<div class="sumrow"><span><strong>${f.type === 'business' ? 'Business' : 'Household'} membership</strong><small>${esc(term.label)}</small></span><span>$${dues}</span></div>` : ''}
          <div class="sumrow sumrow-don">
            <span><strong>Add a donation</strong><small>Optional. Helps fund our advocacy work.</small></span>
            <div class="donchips">
              ${DONATIONS.filter((x) => !(st.donateOnly && x === 0)).map((x) => `<button type="button" class="chip ${st.donation === x ? 'on' : ''}" data-don="${x}">${x ? '$' + x : 'None'}</button>`).join('')}
              <label class="donother"><span class="sr">Other amount</span>$<input type="number" min="0" step="1" inputmode="numeric" placeholder="Other" data-don-other value="${DONATIONS.includes(st.donation) ? '' : st.donation}"></label>
            </div>
          </div>
          <div class="sumrow sumtotal"><span>Total</span><span>$${total}</span></div>
        </div>

        <fieldset class="seg">
          <legend class="sr">How would you like to pay?</legend>
          <label><input type="radio" name="method" value="card" ${st.method === 'card' ? 'checked' : ''}><span>Pay online</span></label>
          <label><input type="radio" name="method" value="check" ${st.method === 'check' ? 'checked' : ''}><span>Mail a check</span></label>
        </fieldset>

        ${st.method === 'card' ? `
          <div class="paycard">
            <p class="small muted">Card, Apple Pay or Google Pay. Payments are handled securely by Stripe; OBVTA never sees your card number.</p>
            ${st.donateOnly ? '' : `<label class="check"><input type="checkbox" data-autorenew ${st.autoRenew ? 'checked' : ''}> Renew automatically each April (you can cancel any time)</label>`}
            <button type="button" class="btn btn-coral btn-block" data-pay ${total ? '' : 'disabled'}>Pay $${total} securely</button>
            <p class="demo-hint center">Demo: no payment is taken and no card details are needed.</p>
          </div>` : `
          <div class="paycard">
            <ol class="checksteps">
              <li><button type="button" class="linkbtn" data-print>Print your form</button>. We've already filled in your details.</li>
              <li>Make your check for <strong>$${total}</strong> payable to <strong>${esc(d.settings.shortName)}</strong>.</li>
              <li>Mail both to <strong>${esc(d.settings.shortName)}, ${esc(d.settings.mailing)}</strong>.</li>
            </ol>
            <p class="small muted">No printer? Just write your email and Ortley Beach address on a note with the check.</p>
            <button type="button" class="btn btn-navy btn-block" data-check ${total ? '' : 'disabled'}>I'll mail my check</button>
          </div>`}
        ${st.donateOnly ? '' : '<button type="button" class="linkbtn" data-go="details">&larr; Back to your details</button>'}
      </div>`;
  },

  done(d, fee, term) {
    const r = st.result;
    const f = st.form;
    if (r.method === 'check') {
      return `
        <div class="thanks">
          <span class="bigcheck">&#10003;</span>
          <h2>Thanks, ${esc(first(f.name))}!</h2>
          <p>We've saved your details. Your membership becomes active as soon as your check for <strong>$${r.total}</strong> arrives, and we'll email <strong>${esc(f.email)}</strong> when it does.</p>
          <button type="button" class="btn btn-ghost btn-sm" data-print>Print your form again</button>
          <p class="demo-hint">Demo: this now shows as "Check pending" under Members in the dashboard.</p>
        </div>`;
    }
    if (r.updateOnly) {
      return `<div class="thanks"><span class="bigcheck">&#10003;</span><h2>Details saved</h2><p>Thanks, ${esc(first(f.name))}. Your membership is unchanged.</p></div>`;
    }
    return `
      <div class="thanks">
        <span class="bigcheck">&#10003;</span>
        <h2>${r.donateOnly ? 'Thank you for your donation!' : r.renewal ? `Thanks for renewing, ${esc(first(f.name))}!` : `Welcome to ${esc(d.settings.shortName)}, ${esc(first(f.name))}!`}</h2>
        ${r.donateOnly ? '' : `<p>You're a member through <strong>${fmtDate(r.paidThrough)}</strong>.${r.autoRenew ? ' We\'ll renew automatically next April and email you a week before.' : ''}</p>`}
        <p>A receipt is on its way to <strong>${esc(f.email)}</strong>.</p>
        <details class="preview"><summary>Preview the receipt email</summary>${emailPreview(d, 'receipt', { ...f, id: r.memberId, paidThrough: r.paidThrough }, r)}</details>
        <p class="demo-hint">Demo: this member now appears in the dashboard under Members.</p>
      </div>`;
  },
};

/* ---------- Actions ---------- */

function finish(method) {
  const d = load();
  const term = currentTerm();
  const f = st.form;
  const dues = st.donateOnly ? 0 : Number(d.settings.fee);
  const total = dues + st.donation;
  let m = d.members.find((x) => x.email.toLowerCase() === f.email.toLowerCase());
  const renewal = !!m;
  if (!m) {
    m = { id: uid(), joined: isoToday(), paidThrough: '', autoRenew: false, pending: false };
    d.members.unshift(m);
  }
  Object.assign(m, { name: f.name, email: f.email, phone: f.phone, address: f.address, type: f.type || 'household', committee: !!f.committee });
  if (!st.donateOnly) {
    m.paidThrough = term.end;
    m.pending = method === 'check';
    m.autoRenew = method === 'card' && st.autoRenew;
  }
  const kind = st.donateOnly ? 'Donation' : renewal ? 'Renewal' : 'New member';
  d.inbox.unshift({
    id: uid(), type: 'membership', date: isoToday(), read: false, name: f.name, email: f.email, phone: f.phone,
    address: f.address, kind, committee: !!f.committee, paid: method === 'card', method, dues, donation: st.donation, total,
  });
  save(d, `${kind} from ${f.name}${method === 'check' ? ' (check coming by mail)' : ''}`);
  st.result = { method, total, dues, donation: st.donation, paidThrough: m.paidThrough, autoRenew: m.autoRenew, renewal, donateOnly: st.donateOnly, memberId: m.id };
  st.step = 'done';
  draw();
  root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function printForm() {
  const d = load();
  const f = st.form;
  const total = (st.donateOnly ? 0 : Number(d.settings.fee)) + st.donation;
  const w = window.open('', '_blank');
  if (!w) return;
  const row = (k, v) => `<tr><th>${k}</th><td>${esc(v || '')}</td></tr>`;
  w.document.write(`<!doctype html><title>OBVTA membership form</title>
    <style>body{font:15px/1.5 Georgia,serif;max-width:640px;margin:40px auto;color:#1b2733}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:10px;border-bottom:1px solid #ccc}th{width:40%;font-weight:normal;color:#555}.box{border:2px solid #0b2540;padding:16px;margin-top:24px}</style>
    <h1>${esc(d.settings.orgName)}</h1><p>Membership form, ${esc(currentTerm().label)}</p>
    <table>
      ${row('Name(s)', f.name)}${row('Type', f.type === 'business' ? 'Business' : 'Household')}${row('Email', f.email)}${row('Phone', f.phone)}
      ${row('Ortley Beach address', f.address)}${row('Committee interest', f.committee ? 'Yes' : 'No')}
      ${row('Dues', st.donateOnly ? '$0' : '$' + d.settings.fee)}${row('Donation', '$' + st.donation)}${row('Check amount', '$' + total)}
    </table>
    <div class="box">Make your check payable to <strong>${esc(d.settings.shortName)}</strong> and mail it with this form to:<br><strong>${esc(d.settings.shortName)}, ${esc(d.settings.mailing)}</strong></div>
    <script>window.onload=()=>window.print()<\/script>`);
  w.document.close();
}

export function wireJoin() {
  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    if (form.dataset.step === 'email') {
      const email = data.email.trim();
      const m = load().members.find((x) => x.email.toLowerCase() === email.toLowerCase());
      if (m) useMember(m);
      else { st.member = null; st.form = { email, type: 'household' }; st.step = 'details'; }
      draw();
    } else if (form.dataset.step === 'details') {
      Object.assign(st.form, data, { committee: !!data.committee });
      if (st.member && memberStatus(st.member) === 'current') {
        const d = load();
        const m = d.members.find((x) => x.id === st.member.id);
        Object.assign(m, { name: st.form.name, phone: st.form.phone, address: st.form.address, committee: st.form.committee });
        save(d, `${m.name} updated their details`);
        st.result = { updateOnly: true };
        st.step = 'done';
      } else {
        st.step = 'pay';
      }
      draw();
    }
  });

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const ds = b.dataset;
    if (ds.try) { st.form.email = ds.try; draw(); $('input[name=email]', root).value = ds.try; root.querySelector('form').requestSubmit(); }
    if (ds.go === 'email') { st.step = 'email'; st.member = null; draw(); }
    if (ds.go === 'details') { st.step = 'details'; draw(); }
    if (ds.go === 'donate') { st.donateOnly = true; st.donation = 25; st.method = 'card'; st.step = 'pay'; draw(); }
    if (ds.don !== undefined) { st.donation = Number(ds.don); draw(); }
    if (ds.pay !== undefined) finish('card');
    if (ds.check !== undefined) finish('check');
    if (ds.print !== undefined) printForm();
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'method') { st.method = t.value; draw(); }
    if (t.name === 'type') { st.form.type = t.value; const n = $('input[name=name]', root); st.form.name = n.value; st.form.phone = $('input[name=phone]', root).value; st.form.address = $('input[name=address]', root).value; draw(); }
    if (t.dataset.autorenew !== undefined) st.autoRenew = t.checked;
    if (t.dataset.donOther !== undefined) { st.donation = Math.max(0, Math.round(Number(t.value) || 0)); draw(); }
  });
}

/* ---------- Email previews (also used by the dashboard) ---------- */

export function emailPreview(d, kind, member, receipt) {
  const e = d.emails;
  const s = d.settings;
  const term = currentTerm();
  const subject = kind === 'receipt' ? e.receiptSubject : e.reminderSubject;
  const body = (kind === 'receipt' ? e.receiptBody : e.reminderBody)
    .split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join('');
  const renewUrl = `membership.html?renew=${encodeURIComponent(member.id || '')}`;
  const r = receipt || { dues: Number(s.fee), donation: 0, total: Number(s.fee), method: 'card', paidThrough: term.end };
  return `
    <div class="email">
      <div class="email-meta">
        <div><span>From</span>${esc(s.orgName)} &lt;${esc(s.email)}&gt;</div>
        <div><span>To</span>${esc(member.email || 'member@example.com')}</div>
        <div><span>Subject</span><strong>${esc(subject)}</strong></div>
      </div>
      <div class="email-body">
        <div class="email-brand"><img src="assets/img/logo-mark.png" alt="" width="40"><strong>${esc(s.shortName)}</strong></div>
        <p>Hi ${esc(first(member.name || 'there'))},</p>
        ${body}
        ${kind === 'receipt' ? `
          <table class="email-receipt">
            ${r.dues ? `<tr><td>Membership dues</td><td>$${r.dues}</td></tr>` : ''}
            ${r.donation ? `<tr><td>Donation</td><td>$${r.donation}</td></tr>` : ''}
            <tr class="tot"><td>Total paid</td><td>$${r.total}</td></tr>
            <tr><td>Paid by</td><td>${r.method === 'check' ? 'Check' : 'Card'} on ${fmtDate(isoToday(), { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>
            ${r.dues ? `<tr><td>Member through</td><td>${fmtDate(r.paidThrough || term.end)}</td></tr>` : ''}
          </table>
          <p class="small">OBVTA is a non-profit organization. Keep this email for your records.</p>` : `
          <p><a class="btn btn-coral" href="${renewUrl}">Renew now for $${esc(s.fee)}</a></p>
          <p class="small">This button fills in your details for you. Prefer to pay by check? You can choose that on the next screen.</p>`}
        <p>${esc(s.orgName)}<br><span class="small">${esc(s.mailing)}</span></p>
      </div>
    </div>`;
}

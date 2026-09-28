// Content store for the demo. Everything the CMS edits lives in one object in
// localStorage. A real deployment would swap load/save for API calls; nothing
// else in the site needs to change.

const KEY = 'obvta-demo-content-v1';
const LOG_KEY = 'obvta-demo-activity-v1';
const SESSION_KEY = 'obvta-demo-admin';

const WP = 'https://ortleybeach.org/wp-content/uploads/';

export const PHOTOS = [
  { src: 'assets/img/surf.jpg', label: 'Surf' },
  { src: 'assets/img/kites.jpg', label: 'Kite day' },
  { src: 'assets/img/lifeguard-stand.jpg', label: 'Lifeguard stand' },
  { src: 'assets/img/guards-afternoon.jpg', label: 'Guards, afternoon' },
  { src: 'assets/img/lifeboat-crew.jpg', label: 'Lifeboat crew' },
  { src: 'assets/img/boat-launch.jpg', label: 'Boat launch' },
  { src: 'assets/img/evening-beach.jpg', label: 'Evening beach' },
  { src: 'assets/img/water-tower.jpg', label: 'Water tower' },
];

function seed() {
  return {
    settings: {
      orgName: 'Ortley Beach Voters and Taxpayers Association',
      shortName: 'OBVTA',
      email: 'OBVTA@ortleybeach.org',
      mailing: 'PO Box 223, Lavallette, NJ 08735',
      fee: 30,
      membershipYear: 'April to March',
      heroEyebrow: 'Ortley Beach, New Jersey',
      heroTitle: 'A stronger voice for our barrier island.',
      heroText:
        'For more than 50 years, OBVTA neighbors have worked with Toms River, Ocean County and the State to keep Ortley Beach a great place to live and spend time at the shore.',
      heroImage: 'assets/img/surf.jpg',
      announcement: {
        on: true,
        text: 'NJ DOT is proposing major changes to Route 35 North and South. Read what it means for Ortley Beach.',
        linkLabel: 'Read more',
        link: 'news.html?post=route-35-public-meeting',
      },
      stats: [
        { value: '50+', label: 'years serving Ortley Beach' },
        { value: '500+', label: 'family and business members' },
        { value: '7', label: 'member meetings a season' },
        { value: '$30', label: 'a year to join' },
      ],
      whyJoin: [
        { title: 'Have a voice', text: 'Membership gives you a say in the positions OBVTA takes on behalf of Ortley Beach.' },
        { title: 'Join a committee', text: 'Work alongside neighbors on the issues you care about most, from dunes to streetscape.' },
        { title: 'Stay close to local events', text: 'Hear about meetings, public hearings and social events first.' },
      ],
    },

    meetings: {
      location: 'The Moose Lodge on Bay Blvd',
      address: '1801 Bay Blvd., Ortley Beach, NJ 08751',
      start: '9:30am',
      coffee: '9:00am',
      zoom: false,
      note: 'Coffee, tea and pastries are served before every meeting.',
      schedule: ['2026-04-18', '2026-05-16', '2026-06-20', '2026-07-18', '2026-08-15', '2026-09-19', '2026-10-17'],
      archive: [
        ar('2026-08', WP + 'OBVTA-26-August-15-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2026-August.pdf'),
        ar('2026-07', WP + 'OBVTA-26-July-18-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2026-July.pdf'),
        ar('2026-06', WP + 'OBVTA-26-June-20-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2026-June.pdf'),
        ar('2026-05', WP + 'OBVTA-26-May-16-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2026-May.pdf'),
        ar('2026-04', WP + 'OBVTA-26-April-18-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2026-April.pdf'),
        ar('2026-03', '', WP + 'OBVTA-Treasurers-Report-2026-March.pdf'),
        ar('2026-02', '', WP + 'OBVTA-Treasurers-Report-2026-February.pdf'),
        ar('2026-01', '', WP + 'OBVTA-Treasurers-Report-2026-January.pdf'),
        ar('2025-12', '', WP + 'OBVTA-Treasurers-Report-2025-December.pdf'),
        ar('2025-11', '', WP + 'OBVTA-Treasurers-Report-2025-November.pdf'),
        ar('2025-10', WP + 'OBVTA-25-Oct-18-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2025-October.pdf'),
        ar('2025-09', WP + 'OBVTA-25-Sept-20-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2025-September.pdf'),
        ar('2025-08', WP + 'OBVTA-25-August-16-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2025-August.pdf'),
        ar('2025-07', WP + 'OBVTA-25-July-19-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2025-July.pdf'),
        ar('2025-06', WP + 'OBVTA-25-June-21-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2025-June.pdf'),
        ar('2025-05', WP + 'OBVTA-25-May-17-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2025-May.pdf'),
        ar('2025-04', WP + 'OBVTA-25-April-19-Genl-Membership-Mtg-Minutes.pdf', WP + 'OBVTA-Treasurers-Report-2025-April.pdf'),
      ],
      council: {
        place: 'Town Hall, 33 Washington St., Toms River, NJ',
        time: '7:00pm',
        dates: [
          '2026-01-14', '2026-01-28', '2026-02-11', '2026-02-25', '2026-03-11', '2026-03-26',
          '2026-04-08', '2026-04-22', '2026-05-13', '2026-05-27', '2026-06-10',
          '2026-07-08', '2026-08-12', '2026-09-09', '2026-09-23',
          '2026-10-14', '2026-10-28', '2026-11-10', '2026-12-09', '2026-12-23',
        ],
      },
    },

    posts: [
      post('route-35-lane-split', 'Ortley Beach joins chorus of opposition to Route 35 "lane split" plan', '2026-07-16', 'news',
        'ShoreBeat reports on the growing list of shore communities, now including Ortley Beach, pushing back on the state plan.',
        '<p>ShoreBeat covers the growing opposition from shore communities, including Ortley Beach, to the NJ DOT proposal for Route 35.</p>',
        { source: 'ShoreBeat', url: 'https://shorebeat.com/lavallette-seaside/2026/07/ortley-beach-joins-chorus-of-opposition-to-route-35-lane-split-plan/', image: 'assets/img/kites.jpg' }),
      post('route-35-what-are-they-nuts', 'These towns don\'t want NJ to change Route 35', '2026-07-16', 'news',
        'The Asbury Park Press on Lavallette and Ortley Beach residents reacting to the proposed traffic changes.',
        '<p>The Asbury Park Press spoke with Lavallette and Ortley Beach residents about the proposed Route 35 traffic changes.</p>',
        { source: 'Asbury Park Press', url: 'https://www.app.com/story/news/traffic/2026/07/13/lavallette-ortley-beach-changes-route-35-traffic/90873870007/' }),
      post('route-35-bad-idea', 'Beach towns tell NJ changing Route 35 traffic pattern is a bad idea', '2026-07-16', 'news',
        'Coverage of the public comments shore towns gave the state at the July hearing.',
        '<p>More from the Asbury Park Press on shore towns lining up against the Route 35 traffic pattern change.</p>',
        { source: 'Asbury Park Press', url: 'https://www.app.com/story/news/traffic/2026/07/15/jersey-shore-towns-fight-against-nj-route-35-traffic-change/90900657007/' }),
      post('route-35-public-meeting', 'Critical public meeting on proposed changes to Route 35', '2026-07-08', 'event',
        'NJ DOT will present plans to turn Route 35 North and South into two-way streets. This is your chance to comment.',
        '<p>The NJ DOT is proposing significant changes to Route 35 North and Route 35 South:</p>' +
        '<ul><li>Both one-way streets would become two-way streets.</li><li>Center barricades would be added in some places to stop turns.</li><li>Bike lanes would be reconfigured.</li><li>Parking would change significantly.</li><li>The speed limit on both roads would be 25 mph.</li></ul>' +
        '<p>This open public meeting is your opportunity to hear the plans and give public comment. <strong>Please attend. This affects you.</strong></p>' +
        '<p><a href="' + WP + 'Rte-35-nJ-DOT-Handbook_20260629_124323_NJDT00372_PIC1Notice-Final.pdf">Read the NJ DOT project notice (PDF)</a></p>',
        { image: 'assets/img/water-tower.jpg', eventDate: '2026-07-13', eventTime: '6:00pm to 8:00pm', eventPlace: 'Moose Lodge, 1801 Bay Blvd, Ortley Beach' }),
      post('boardwalk-extension-contract', 'Toms River awards new contract for boardwalk extension and parking area', '2026-03-15', 'news',
        'The latest on construction of the Ortley Beach boardwalk extension.',
        '<p>Toms River has awarded a new contract for the Ortley Beach boardwalk extension and a new parking area. ShoreBeat has the details.</p>',
        { source: 'ShoreBeat', url: 'https://shorebeat.com/lavallette-seaside/2026/03/toms-river-awards-new-contract-for-ortley-beach-boardwalk-extension-parking-area-construction/', image: 'assets/img/evening-beach.jpg' }),
      post('mixed-use-complex', 'Mixed use complex proposed for vacant Ortley Beach property', '2025-10-27', 'news',
        'A developer has proposed a mixed use building on a vacant lot in Ortley Beach.',
        '<p>ShoreBeat reports on a mixed use complex proposed for a vacant Ortley Beach property.</p>',
        { source: 'ShoreBeat', url: 'https://shorebeat.com/lavallette-seaside/2025/10/mixed-use-complex-proposed-for-vacant-ortley-beach-property/' }),
      post('hurricane-erin', 'Some N.J. Shore beaches remain damaged from Hurricane Erin', '2025-08-28', 'news',
        'Our dunes and beaches were replenished before Erin, and they held up. Other towns were not so lucky.',
        '<p>We were lucky in Ortley Beach to have our dunes and beaches replenished before Erin and this year\'s storms. Our beach is in great shape and our dunes are strong.</p>',
        { source: 'NJ.com', url: 'https://www.nj.com/news/2025/08/these-nj-shore-beaches-remain-damaged-from-hurricane-erin-heading-into-labor-day-weekend.html', image: 'assets/img/lifeguard-stand.jpg' }),
      post('pbs-paradox', 'Why do we live in Ortley Beach? A PBS special', '2025-08-24', 'news',
        'NJ PBS looks at rising water and the rising cost of living at the shore.',
        '<p>Watch the NJ PBS special <em>Paradox: Rising Water and Mounting Costs</em>.</p>',
        { source: 'NJ PBS', url: 'https://www.njpbs.org/programs/nj-pbs-specials/paradox-rising-water-and-mounting-costs-rfwffu/' }),
      post('rescue-drones', 'New Ocean County drones can drop life preservers in the ocean', '2025-08-18', 'news',
        'NBC New York on the county\'s new water rescue drones.',
        '<p>NBC New York reports on Ocean County\'s new drones that can drop life preservers to swimmers in trouble.</p>',
        { source: 'NBC New York', url: 'https://www.nbcnewyork.com/video/on-air/as-seen-on/using-drones-for-water-rescues-at-jersey-shore/6367965/', image: 'assets/img/lifeboat-crew.jpg' }),
      post('beach-replenishment-cost', 'Jersey Shore would be mostly gone without beach replenishment. At what cost?', '2025-08-06', 'news',
        'The Asbury Park Press on the billions spent keeping sand on New Jersey beaches.',
        '<p>The Asbury Park Press looks at what beach replenishment costs and what the shore would look like without it.</p>',
        { source: 'Asbury Park Press', url: 'https://www.app.com/story/news/local/land-environment/2025/08/05/beach-replenishment-projects-costs-billions-jersey-shore-ocean-high-tide/83652756007/' }),
    ],

    officers: [
      off('President', 'Anthony Colucci'),
      off('Vice-President', 'Paul Jeffrey'),
      off('Treasurer', 'Debbie Barton'),
      off('Secretary', 'John Clarke'),
      off('Director', 'Joe Cantalupo'),
      off('Director', 'Ginny Morrissey'),
      off('Director', "Gail D'Amico"),
      off('Director', 'Joan Strathern'),
      off('Director', 'Mike Stramandinoli'),
    ],

    pages: {
      about:
        '<p>The Ortley Beach Voters and Taxpayers Association (OBVTA) is a non-profit organization whose mission is to improve the quality of life in the section of Toms River Township known as Ortley Beach, NJ.</p>' +
        '<p>We are a local neighborhood association providing information and services to residents and businesses of Ortley Beach. The organization has been around for over 50 years, and since Superstorm Sandy our membership has grown to over 500 family and business members. One of the earliest events on record is the 1957 dinner dance.</p>' +
        '<p>We keep members informed on rebuilding efforts and work to make sure Ortley Beach keeps getting better as a place to live and spend time at the New Jersey shore. We work with Toms River Township, Ocean County, NJ DOT, NJ DEP, our state legislators and our representatives in Congress.</p>' +
        '<p>OBVTA was largely responsible for working with the NJ DEP to obtain the easements that allowed the current dune system to be built. We continue to press Toms River and the US Army Corps of Engineers to maintain our dunes and beach.</p>',
      mission:
        'To improve the quality of life in the Township of Toms River, NJ section known as Ortley Beach.',
      president: 'Anthony Colucci',
      strategic:
        '<p>The OBVTA Board of Directors asked members for their concerns and recommendations after Superstorm Sandy, and has since updated the Strategic Plan and our Priorities of Focus as the community continues to rebuild.</p>' +
        '<p>If you have ideas about making Ortley Beach more resilient to future storms, or a better community in general, please email the OBVTA President.</p>',
      secession:
        '<p>In late 2022 the Board was asked to look into whether Ortley Beach could secede from Toms River. Led by Board Secretary John Clarke, the Board spent several months speaking with attorneys, experts and people involved in similar efforts in nearby towns, and researched the legal and financial requirements.</p>' +
        '<p>The Board delivered its findings to members in December 2022. The report includes a brief summary and the complete detailed review.</p>',
    },

    documents: [
      doc('Membership Application 2026-2027', WP + 'OBVTA-Membership-Application-2026-2027.pdf', 'Membership'),
      doc('Bylaws (approved April 17, 2021)', WP + 'Bylaws-of-the-OBVTA-APRIL-2021.pdf', 'Governance'),
      doc('Strategic Plan for Ortley Beach (May 2019)', WP + 'Strategic-Plan-for-Ortley-Beach-FINAL-May-2019.pdf', 'Planning'),
      doc('Priorities of Focus (May 2019)', WP + 'OBVTA-Priorities-FINAL-May-2019.pdf', 'Planning'),
      doc('Toms River Strategic Recovery Report', WP + 'TR-Strategic-Recovery-Report.pdf', 'Planning'),
      doc('Ortley Beach Neighborhood Plan (2016)', WP + 'Ortley-Beach-Proposed-Neigbhorhood-Plan-Planning-Board-Feb-2016.pdf', 'Planning'),
      doc('Ortley Beach Flood Map', WP + 'Flood-Map-Ortley-Beach.pdf', 'Planning'),
      doc('Meeting Guidelines', WP + 'Meeting_Rules.pdf', 'Governance'),
      doc('Report on Secession (Dec 15, 2022)', WP + 'OBVTA-Report-on-Succession-Dec-15-2022.pdf', 'Reports'),
      doc('1957 Dinner Dance Program', WP + 'Ortley-Beach-Dinner-Dance-Program-1957.pdf', 'History'),
      doc('US Army Corps Dune Presentation (April 2024)', WP + 'US-Army-Corps-Toms-River-April-2024-Presentation.pdf', 'Planning'),
      doc('Long Range Community Planning (June 2024)', WP + 'Long-Range-Community-Driven-Resilence-Planning-Laura-Geronimo-06-15-24.pdf', 'Planning'),
    ],

    links: [
      link('Government', 'Find your NJ state legislator', 'https://www.njleg.state.nj.us/#findLegislator'),
      link('Government', 'Contact Congressman Chris Smith', 'https://chrissmith.house.gov/contact/zipauth.htm'),
      link('Government', 'Office of the NJ Attorney General', 'https://www.njoag.gov/contact/office-of-constituent-services/'),
      link('Government', 'Toms River Township', 'https://tomsrivertownship.com/'),
      link('Government', 'Ocean County', 'https://www.co.ocean.nj.us/'),
      link('Government', 'Directory of local, county and state offices', 'https://www.countyoffice.org/'),
      link('Safety', 'Emergency messaging sign up (Nixle)', 'https://local.nixle.com/register/'),
      link('Safety', 'Toms River alarm registration', 'https://www.crywolfservices.com/tomsrivernj/'),
      link('Safety', 'Email the Toms River Police Chief', 'mailto:Chief@TRPolice.org'),
      link('Beach & recreation', 'Beach tent and canopy regulations', 'https://ecode360.com/12007981'),
      link('Beach & recreation', 'Toms River Recreation Department', 'https://tomsrivertownship.com/211/Recreation'),
      link('Beach & recreation', 'Island Beach State Park', 'https://www.islandbeachnj.org/'),
      link('Beach & recreation', 'Toms River noise ordinance', 'https://ecode360.com/12015771'),
      link('Planning & utilities', 'Streetscape committee recommendations', 'https://public.3.basecamp.com/p/p8A6RhYtP839mq2UkP7hcCGo'),
      link('Planning & utilities', 'JCP&L reconnect and new construction guidelines', 'https://www.firstenergycorp.com/jersey_central_power_light/rebuilding-guidelines.html'),
      link('Planning & utilities', 'Toms River Patch', 'https://tomsriver.patch.com/'),
    ],

    inbox: [
      { id: uid(), type: 'membership', date: '2026-09-21', name: 'Maria Russo', email: 'maria.r@example.com', phone: '(732) 555-0142', address: '112 Fielder Ave', kind: 'Renewal', paid: true, read: false },
      { id: uid(), type: 'message', date: '2026-09-18', name: 'Tom Keane', email: 'tkeane@example.com', subject: 'Parking on 3rd Ave', message: 'Will the Route 35 changes affect parking on the side streets near the boardwalk? Would like to raise it at the October meeting.', read: false },
      { id: uid(), type: 'membership', date: '2026-09-02', name: 'The Delgado Family', email: 'delgados@example.com', phone: '(732) 555-0187', address: '45 Kauffman Ave', kind: 'New member', paid: true, read: true },
    ],

    members: seedMembers(),

    emails: {
      receiptSubject: 'Thank you for joining OBVTA',
      receiptBody: 'Thank you for supporting the Ortley Beach Voters and Taxpayers Association. Your membership keeps our community\'s voice strong in Toms River and Trenton.\n\nWe hope to see you at our next meeting.',
      reminderSubject: 'Time to renew your OBVTA membership',
      reminderBody: 'Your OBVTA membership ends on March 31. Renewing takes less than a minute, and your details are already filled in.\n\nThank you for being part of the Ortley Beach community.',
    },
  };
}

// Demo members, so returning-member lookup has someone to find. Try
// tkeane@example.com (lapsed) or maria.r@example.com (already paid).
function seedMembers() {
  const m = (name, email, phone, address, type, paidThrough, joined, extra = {}) =>
    ({ id: uid(), name, email, phone, address, type, paidThrough, joined, autoRenew: false, pending: false, committee: false, ...extra });
  return [
    m('Maria Russo', 'maria.r@example.com', '(732) 555-0142', '112 Fielder Ave', 'household', '2027-03-31', '2014-05-10', { autoRenew: true }),
    m('The Delgado Family', 'delgados@example.com', '(732) 555-0187', '45 Kauffman Ave', 'household', '2027-03-31', '2026-09-02'),
    m('Tom Keane', 'tkeane@example.com', '(732) 555-0119', '18 Third Ave', 'household', '2026-03-31', '2016-06-18'),
    m('Linda and Frank Moretti', 'morettis@example.com', '(908) 555-0163', '203 Ocean Ter', 'household', '2026-03-31', '2013-04-20'),
    m('Surfside Bait & Tackle', 'info@surfside.example.com', '(732) 555-0171', '1500 Route 35 N', 'business', '2027-03-31', '2018-05-01'),
    m('Kevin O\'Brien', 'kob@example.com', '(732) 555-0134', '9 Bay Blvd', 'household', '2026-03-31', '2019-07-13'),
    m('Priya Shah', 'pshah@example.com', '(201) 555-0198', '77 Kearney Ave', 'household', '2027-03-31', '2021-08-14', { pending: true }),
  ];
}

// Membership runs April 1 to March 31. Before April we are still in the term
// that started last year.
export function currentTerm(now = new Date()) {
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { start: `${y}-04-01`, end: `${y + 1}-03-31`, label: `April ${y} to March ${y + 1}` };
}

export function memberStatus(member, now = new Date()) {
  if (member.pending) return 'pending';
  return member.paidThrough >= currentTerm(now).end ? 'current' : 'expired';
}

function ar(month, minutes, treasurer) {
  return { id: uid(), month, held: !!minutes, minutes, treasurer };
}
function post(slug, title, date, type, excerpt, body, extra = {}) {
  return { id: slug, title, date, type, excerpt, body, status: 'published', pinned: false, source: '', url: '', image: '', ...extra };
}
function off(role, name) {
  return { id: uid(), role, name };
}
function doc(title, url, category) {
  return { id: uid(), title, url, category };
}
function link(group, label, url) {
  return { id: uid(), group, label, url };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

let cache = null;

export function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      // Fill in anything added to the seed since this browser last saved.
      const data = JSON.parse(raw);
      const base = seed();
      for (const k of Object.keys(base)) if (!(k in data)) data[k] = base[k];
      return (cache = data);
    }
  } catch (e) { /* fall through to seed */ }
  cache = seed();
  return cache;
}

// Returns true on success. localStorage is capped at about 5 MB per site, so
// large uploaded images can fail here; callers show the message.
export function save(data, note) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    cache = data;
    if (note) logActivity(note);
    return true;
  } catch (e) {
    return false;
  }
}

export function reset() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LOG_KEY);
  } catch (e) { /* ignore */ }
  cache = null;
}

export function invalidate() {
  cache = null;
}

export function activity() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch (e) { return []; }
}
function logActivity(text) {
  const list = activity();
  list.unshift({ text, at: new Date().toISOString() });
  try { localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, 30))); } catch (e) { /* ignore */ }
}

export const session = {
  get() { try { return localStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; } },
  set(on) { try { on ? localStorage.setItem(SESSION_KEY, '1') : localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ } },
};

export const STORAGE_KEY = KEY;

# Ortley Beach (OBVTA) redesign demo

A sales demo: a modern rebuild of ortleybeach.org plus a simulated content
management dashboard. Plain HTML, CSS and JavaScript modules; no build step.

Run it with any static server, for example:

    python3 -m http.server 4321

Then open http://localhost:4321 (site) and http://localhost:4321/admin.html
(dashboard). The dashboard has no password; one button signs in.

## How the demo works

- All content lives in one object in `localStorage` (`assets/js/store.js`).
  The seed data is the real site's content as of September 2026.
- Edits in the dashboard save to that object. Open the site and the dashboard
  side by side and saved changes appear on the site immediately.
- The membership and contact forms write to the dashboard inbox. No payment
  is taken.
- "Reset demo content" in the dashboard puts everything back.
- The next-meeting box, "Next" markers and past-date styling are worked out
  from today's date, so they never go stale.

Photos in `assets/img` come from the current ortleybeach.org. Minutes,
reports and other PDFs link to the files on the live site.

To turn this into a real product, replace `load` and `save` in `store.js`
with API calls (PocketBase would fit) and add real sign-in.

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
- The membership page is one form for new and returning members. It starts
  with an email address; `tkeane@example.com` is a lapsed member (details
  fill in) and `maria.r@example.com` is already paid. Any other address joins
  as new. Paying online or by mailed check are both options on the payment
  step. No payment is taken.
- Sign-ups appear under Members and Inbox in the dashboard. Member emails
  (receipt and renewal reminder) can be edited there with a live preview.
- "Reset demo content" in the dashboard puts everything back.
- The next-meeting box, "Next" markers and past-date styling are worked out
  from today's date, so they never go stale.

Photos in `assets/img` come from the current ortleybeach.org. Minutes,
reports and other PDFs link to the files on the live site.

To turn this into a real product, replace `load` and `save` in `store.js`
with API calls (PocketBase would fit) and add real sign-in.

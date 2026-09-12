# UpLabs BD Intelligence Dashboard

Twenty US industrial companies ($2B–$10B revenue). For each one: the problem they
have publicly admitted, the company UpLabs could build to solve it, who to talk to,
and when they will be in a room.

**Live site:** https://41shaanOS.github.io/uplabs-bd-dashboard/ — republishes automatically on every push to `main`.

---

## What changed in v2

Built against the four additions requested after the first review.

| Ask | What was done |
|---|---|
| C-suite per company | A four-slot grid — CEO, CFO, COO, Strategy/Sustainability — on every company, with tenure and background notes. Each name carries a confidence badge. |
| Where they'll be speaking | A calendar view plus a per-company panel. Two events verified with dates and venues; five dated corporate events; the rest listed without dates because their dates aren't confirmed. |
| Locations | A "By location" view grouping all 20 by region, so one trip can cover several. |
| LinkedIn connections | A LinkedIn lookup button on every named executive. |

## Two things worth reading before you use it

**Most of these companies don't have a COO or a Chief Strategy Officer.**
Of the twenty, only Curtiss-Wright has a conventional CEO/CFO/COO/strategy-chief
structure. Eastman is the one company with a genuine sustainability chief in the
C-suite. Rather than leave blanks, every company states what exists, what doesn't,
and who actually holds the responsibility instead. An empty slot on this dashboard
means "nobody holds this role", never "we didn't find it".

**The LinkedIn buttons are searches, not scraped profile links.**
There is no LinkedIn API that exposes a connection graph, and scraping for one
breaks their Terms of Service. So each button opens a LinkedIn people search for
that person at that company. Because you're logged in, LinkedIn itself shows the
connection degree and any shared connections on the results page — which is the
warm-intro path, from LinkedIn's own UI, with no ToS exposure and no guessed URLs.

For shared connections across the whole UpLabs team rather than one person's
network, that's Sales Navigator Advanced (TeamLink) — a subscription decision,
not something that can be built.

## Confidence badges

Every executive name carries one. They are not decoration.

- **verified** — confirmed on the company's own leadership/IR page or a dated press release
- **check it** — consistent across secondary sources but not yet seen on a primary page
- **unverified** — a lead, not a fact. Do not put this name in an email without checking.

As of 12 Sept 2026 every CEO and CFO seat on the list is filled and verified —
nothing is marked "check it" or "unverified" any more.

One correction worth knowing about, because third-party databases still get it
wrong: **nVent's CFO is Gary Corona, not Sara Zawoyski.** She held the seat from
2019 but moved to President of Systems Protection on 31 March 2025. Addressing her
as CFO is exactly the kind of error that kills a cold email.

## Leadership changes currently tracked

The single most useful thing in here. A new executive is the best cold-outreach
window there is.

- **Scotts Miracle-Gro** — Nate Baxter replaced Jim Hagedorn (CEO since 2001) in June 2026. Window open now.
- **Toro** — Edric Funk becomes CEO 1 Nov 2026.
- **Albemarle** — Ragnar Udd arrives from BHP 1 Feb 2027.
- **Regal Rexnord** — Aamir Paul arrived from Schneider Electric by July 2026.
- **Masco** — Jonathon Nudi arrived from General Mills, July 2025.
- **Hubbell** — new CFO Joseph Capozzoli, January 2026, after a 14-year predecessor.
- **Howmet** — new CFO Patrick Winterlich from Hexcel, December 2025.
- **CF Industries** — Chris Bohn CEO since January 2026; Andrew Scribner CFO since May 2026.
- **Fortive** — Olumide Soroye CEO since the Ralliant separation, June 2025.
- **Middleby** — new CFO Brittany Cerwin; food-processing separation under way.
- **Acuity** — Ruth Gratzke named President of Acuity Brands Lighting, August 2026.
- **nVent** — Gary Corona became CFO March 2025, from Medtronic; Sara Zawoyski moved to President, Systems Protection.
- **Fortive** — Mark Okerstrom became CFO March 2025. Former Expedia CFO *and* CEO — the most software-fluent finance chief on this list.

## How it updates

**Deploy:** push to `main` → `.github/workflows/deploy.yml` republishes the site.
No more dragging a file to Netlify. The workflow parses the page's JavaScript first
and fails the build rather than publish something broken.

**Refresh:** `.github/workflows/monitor.yml` opens one issue every Monday with a
checklist of what actually goes stale, each item linked to its primary source.
This is the deliberately simple version of the monitor from the original brief —
no scraper, no parsers to maintain.

To upgrade it into a real search agent, add an `ANTHROPIC_API_KEY` repository
secret and have that workflow run the searches and pre-fill the issue. The staging
principle holds either way: candidate hits land in an issue for review, they never
write themselves into the dashboard. Search results throw false positives, and a
dashboard you can't trust is worse than one that's a week out of date.

## Editing

Everything is one file, `index.html`. The data sits in named arrays near the top
of the `<script>` block:

- `DATA` — the 20 companies, their admitted problems, evidence and venture theses
- `CSUITE` — executives per company, keyed by company id
- `EVENTS` — the calendar
- `COMPANY_LIST` — the 86-company quick list behind the "+ Add" button
- `REGION_OF` / `REGION_NOTE` — location grouping

Adding a company means one entry in `DATA` and one in `CSUITE` under the same id.

## Open questions for Sid

1. **"CSO" — Strategy, Sustainability, or Security?** Built as Strategy/Sustainability, since that's what actually exists at these companies. Easy to change.
2. **Locations — HQ, or plants and sites too?** Currently head offices. Plants are the better answer for "where can we physically show up" — CF's Yazoo City plant matters more than its Northbrook head office.
3. **Public companies, private, or both?** Still unanswered from the first round. It decides whether the 86-company quick list stays as it is.
4. **Sales Navigator Advanced seats?** Needed for team-wide warm-intro mapping.

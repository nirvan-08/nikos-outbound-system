# Data model

The dashboard keeps its data in the artifact's document store (`window.claude.use("db")`).

## `prospects/<slug>`
| Field | Notes |
|---|---|
| company, owner, title | Owner / MD is the target contact |
| email, phone, address, city, state, country, website | |
| industry | What they make / machine |
| segment | `1 · Tender CNC shop`, `2 · Auto component`, `3 · Tool room / die & mould`, `4 · Machinery components`, `5 · Aerospace`, `Skip` |
| fit, fitReason | Strong / Good / Medium / Low / Skip |
| qualify, qualifyScore | `{cnc, staff10, gst, tendersOrJobWork}` yes/no/unknown; 2+ yes = good lead |
| revenue | Estimated annual revenue, ₹ crore range |
| employees, machines, factorySize, yearEst, legalStatus, tenderBuyers | |
| status | New, Contacted, Replied, Meeting, Accepted, Denied |
| lastContacted, dateAdded | ISO dates |
| activity[] | `{type: email|call|status, at, ...}` log |
| source, sourceSite, notes | Where the data came from and what is estimated |

## `clients/<slug>`
company, contact, email, phone, city, state, industry, revenue, employees, product, value (₹ per month), health (Onboarding / Active / At risk / Paused / Churned), start, renewal, notes, activity[].

## `meta/finder`
`{lastRun, added, total, note}` written by the lead finder after each run.

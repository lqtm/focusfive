# Chrome Web Store submission — Focus Five

Everything the Developer Dashboard asks for, in the order it asks. Upload `release/five-extension-v1.7.0.zip` as the package.

## Store listing tab

**Name** (comes from the manifest): Focus Five — a calmer focus list

**Summary** (from the manifest, 104 of 132 characters):
Keep five priorities in view, move the rest aside, and block distractions until the work is done.

**Category:** Productivity → Workflow & Planning

**Language:** English

**Description:**

```
Focus Five turns every new tab into a short, honest list: the five things that matter today, and nothing else.

Today, five at a time
• Up to five priorities. When Today is full, adding another asks which one it replaces.
• One task is Now. Start a 25- or 50-minute focus block from it with a single keypress.
• Reorder by dragging or from the keyboard, edit titles in place, and add a one-line hint to decode a terse title.

Everything else has a place
• Later holds what isn’t for today. Ideas is an inbox you triage one at a time: Today, Later, Drop or Skip.
• Daily, weekday and weekly routines show up when they’re due without taking a priority slot.
• The Daybook keeps a timeline of what you finished today, plus a one-line note that clears at midnight.

Focus mode and blocking
• A full-screen focus timer with your task, a progress bar and what’s up next.
• Sites on your blocklist send you back to your list while Today still has open work. Chrome asks for access one site at a time — Focus Five never asks to read every website.
• Three 30-minute pauses a day, for when you genuinely need one.

Made to look at all day
• Nine themes: System, Light, Dark, Paper, Dot grid, Blueprint, Dusk, and two brutalist ones, Brutal and Acid.
• Presentation mode hides your list behind a wallpaper and a clock when you share your screen.
• Keyboard first: N new, ↑↓ pick, Enter start, E edit, L / I send to Later or Ideas, G then T / L / I to switch lists.

Private by design
• No account, no servers, no analytics. Your data stays in your browser.
• Export a backup file any time and restore it on another computer.
```

**Graphic assets** (all in this folder):

| Field | File |
| --- | --- |
| Store icon (128×128) | `store-icon-128.png` |
| Screenshots (1280×800, in this order) | `screenshots/1-today.png` … `screenshots/5-presentation.png` |
| Small promo tile (440×280) | `promo-small-440x280.png` |
| Marquee promo tile (1400×560, optional) | `marquee-1400x560.png` |

`screenshots/spare-brutal.png` is an alternate if you'd rather show the Brutal theme than the theme picker.

**Homepage URL:** https://github.com/lqtm/focusfive
**Support URL:** https://github.com/lqtm/focusfive/issues

## Privacy practices tab

**Single purpose:**

```
Focus Five replaces the new tab page with a short focus list — up to five priorities for today — with a focus timer and an optional blocklist that keeps the distracting sites the user chooses out of reach until the day's work is done.
```

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| `storage` | Saves the user's tasks, ideas, routines, settings and blocklist locally in chrome.storage.local. Nothing is sent anywhere. |
| `alarms` | Keeps recurring tasks, the focus timer and the 30-minute blocklist pause on schedule while no new tab is open. |
| `declarativeNetRequestWithHostAccess` | Redirects websites the user adds to their blocklist to the Focus Five page while they still have open tasks today. Rules are built only from the user's own blocklist. |
| Host permissions (optional, `*://*/*`) | Requested at runtime, one website at a time, only when the user adds that website to the blocklist; Chrome shows a prompt for each one. Needed so the blocking rule can redirect that site. No host access is granted at install, and page contents are never read. |

**Remote code:** No, I am not using remote code. (All JavaScript, fonts and images are bundled in the package.)

**Data usage:** tick none of the data types — Focus Five collects no user data. Tick all three certifications (no selling or transferring data, no unrelated use, no creditworthiness use).

**Privacy policy URL:** https://github.com/lqtm/focusfive/blob/main/PRIVACY.md

## Distribution tab

- Payments: Free
- Visibility: Public (choose Unlisted if you want a soft launch with a shareable link first)
- Regions: All regions

## Notes for the reviewer (Test instructions, optional)

```
No account or login. Open a new tab to see the list. To test blocking: Settings → Blocklist → add a site such as example.com, accept Chrome's access prompt, then visit that site while Today has an open task; it redirects to Focus Five. The two starter blocklist entries show an "Allow" button until access is granted.
```

## Before you submit

- Developer account: one-time US$5 registration, then verify your contact email. The dashboard asks whether you're a trader under EU rules; for a free hobby project that's usually "non-trader", but it's your call.
- Review usually takes a few days. Narrow permissions like these tend to go faster than all-sites access.
- On a new install, Chrome shows a "Did you mean to change this page?" prompt on the first new tab. That's normal for every new-tab extension.

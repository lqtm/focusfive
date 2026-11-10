# Chrome Web Store submission: Focus Five

Everything the Developer Dashboard asks for, in the order it asks. Upload `release/five-extension-v1.7.0.zip` as the package.

## Store listing tab

**Name** (comes from the manifest): Focus Five - a to-do list that stops at five

**Summary** (from the manifest, 103 of 132 characters):
Replaces your new tab with today’s five tasks and a focus timer. Anything else waits in Later or Ideas.

**Category:** Productivity → Workflow & Planning

**Language:** English

**Description:**

```
I made Focus Five because my to-do list kept growing past the point where I'd actually look at it. So this one caps Today at five. Try to add a sixth and it asks which task should move out.

The top task is the one you're on. Press Enter and a full-screen timer starts on it, 25 or 50 minutes, with the next task shown at the bottom. Finished tasks get crossed off and keep their slot until you clear them, and the sidebar keeps a timeline of what you got done today.

Anything that isn't for today goes to Later. Half-formed thoughts go to Ideas, and when you have a minute you sort them one at a time into Today or Later, or drop them.

Other things it does:
• Blocks the sites you pick (Reddit, YouTube, whatever gets you) while Today still has open tasks. Chrome asks permission for each site when you add it. You get three 30-minute breaks from blocking per day.
• Routines that come back daily, on weekdays or once a week, without using up one of the five slots.
• A short hint under any task, for titles that only make sense to you at 9am.
• Drag to reorder, or do nearly everything from the keyboard: N for a new task, arrows to pick, Enter to start, E to edit.
• Nine themes, including a couple of brutalist ones.
• A presentation mode that swaps your list for a photo and a clock when you share your screen.

Your tasks are stored in your browser and nowhere else. There's no account, and nothing is sent to a server. You can export a backup file from Settings and restore it on another computer.
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
Focus Five replaces the new tab page with a to-do list limited to five tasks for today. It includes a focus timer, and it can optionally block sites the user picks while those tasks are still open.
```

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| `storage` | Saves the user's tasks, ideas, routines, settings and blocklist locally in chrome.storage.local. Nothing is sent anywhere. |
| `alarms` | Keeps recurring tasks, the focus timer and the 30-minute blocklist pause on schedule while no new tab is open. |
| `declarativeNetRequestWithHostAccess` | Redirects websites the user adds to their blocklist to the Focus Five page while they still have open tasks today. Rules are built only from the user's own blocklist. |
| Host permissions (optional, `*://*/*`) | Requested at runtime for one website at a time, when the user adds that website to the blocklist. Chrome shows a prompt each time. The blocking rule needs it to redirect that site. Nothing is granted at install, and the extension never reads page contents. |

**Remote code:** No, I am not using remote code. All JavaScript, fonts and images are bundled in the package.

**Data usage:** tick none of the data types, because Focus Five collects no user data. Tick all three certifications (no selling or transferring data, no unrelated use, no creditworthiness use).

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

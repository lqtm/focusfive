# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Product decisions

- This is a Chrome Manifest V3 new-tab extension, not a static web mock.
- Package releases as a versioned Chrome Web Store ZIP under `release` while retaining `dist` as the load-unpacked build. Keep the package and manifest versions aligned and include branded 16, 32, 48, and 128px raster icons.
- Preserve Prod's calm, warm, typographic character without copying its proprietary fonts or source assets.
- Today holds at most five manual tasks. Additional tasks go to Later and must be promoted intentionally.
- Recurring definitions are capped at five. Due recurring instances appear in a separate Today section and do not consume manual Today slots.
- Completed manual tasks and due routines remain local and appear in a desktop-first Daybook rail on the right, with daily done/open summary and restore actions. Use a roughly 350px-wide full sheet when the viewport has room; collapse it to the edge before it crowds the main list. Users can persistently minimize it to a slim vertical tab. The visible page resets automatically each day and can be manually cleared without erasing the underlying completion records.
- Active manual tasks in Today and Later can be reordered directly; persist an explicit task order instead of overloading creation timestamps.
- Due routines should use the same open, neutral row treatment as manual tasks. Distinguish them with the small Routine label, not a green background wash.
- Categories are capped at five.
- Ideas is an unlimited pre-triage inbox and a first-class tab, not a default category or recurring-task concept. Ideas can be promoted to Today or Later.
- Discarding an Idea permanently removes it; do not route discarded Ideas into the completed-task archive where they become invisible.
- Paused recurring definitions must not surface due instances or keep distraction blocking active. Generated recurring-instance history is retained for 31 days to bound local storage growth.
- When Today is full, keep the composer copy neutral and explain the automatic move to Later only after submission.
- Let the Priorities section own the Today capacity count; do not repeat it inside the composer. A sixth submission stays valid and receives a brief toast after it is sent to Later.
- Label the separate recurring-instance section as Daily routines with an `N today` count so it reads as defaults alongside, not extra members of, the five chosen priorities.
- The Pomodoro timer is a compact persistent control in the bottom-right corner. It supports 25/50-minute focus blocks, 10/20-minute rests, and a daily score where each completed 25 focus minutes equals one session.
- Prefer a warm, distinctive sans-serif and restrained rounded corners over a completely square, box-heavy interface.
- Use application-owned dropdown menus rather than native browser selects. Keep closed controls compact, but give open menus a substantial surface with roomy rows, clear selected checkmarks, hover/focus treatment, and full keyboard behavior.
- The active-tab accent is a full-width bottom edge, not an inset rounded stroke.
- On Today, the large date belongs in the page heading and the full weekday/date belongs in Daybook; do not repeat a second full date beside the heading.
- Keep page-heading copy to one short, factual descriptor beneath the title. Avoid stacked eyebrow plus motivational sentence treatments.
- Use a legally redistributable, self-hosted font. The current typographic direction uses the OFL-licensed Inter variable family; keep Space Mono limited to the timer and brand mark.
- Keep implementation modular: typed domain models, a storage repository, pure recurrence helpers, React components, and an event-driven service worker.
- Use Chrome storage.local for task data and dynamic declarativeNetRequest rules for site blocking.
- Blocklist suspension is one standard 30-minute action, limited to three uses per local calendar day. Show the remaining daily allowance as a compact counter and do not consume another use while a pause is already active. Let users resume blocking early; treat cancellation within the first five minutes as an undo that restores the allowance, while later cancellation still counts as a used pause.
- Presentation mode is a persisted one-click privacy state. While active, do not render task content, task/category counts, navigation, category controls, or blocklist controls; show the selected bundled Unsplash wallpaper with only discreet reveal/wallpaper controls, photo credit, and Pomodoro. Offer six persisted choices: Misty lake, Lonely road (default), Wanderlust, Forest bend, Sunset road, and Open country.
- Give Presentation mode a restrained, non-private visual anchor in the center: a clock, date, and small Five mark. Do not reintroduce motivational copy or task-like content over the wallpaper.

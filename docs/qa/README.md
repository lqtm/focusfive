# Design QA

- Source visual truth: `../design/design-reference.jpg`, plus the user's iteration feedback about Ideas, capacity messaging, typography, corner treatment, recurring capacity, Pomodoro controls, and screen-sharing privacy
- Browser-rendered Today implementation: `screenshots/qa-implementation-revised.png`
- Browser-rendered Ideas implementation: `screenshots/qa-implementation-ideas-revised.png`
- Full-view comparison: `../design/comparisons/design-comparison-revised.jpg`
- Focused typography/composer comparison: `../design/comparisons/design-comparison-focus-revised.jpg`
- Compact capture: `screenshots/qa-compact-revised.png`
- Revised Pomodoro capture: `screenshots/qa-implementation-pomodoro-revised.png`
- Revised Pomodoro/source comparison: `../design/comparisons/design-comparison-pomodoro.jpg`
- Completion/reordering capture: `screenshots/qa-completion-reorder-final.png`
- Completion/reordering full comparison: `../design/comparisons/design-comparison-completion-reorder.jpg`
- Completion/reordering focused comparison: `../design/comparisons/design-comparison-completion-focus.jpg`
- Bricolage Grotesque wide capture: `screenshots/qa-bricolage-wide.png`
- Bricolage Grotesque compact capture: `screenshots/qa-bricolage-compact.png`
- Bricolage/source full comparison: `../design/comparisons/design-comparison-bricolage.jpg`
- DM Sans/Bricolage focused comparison: `../design/comparisons/font-comparison-dm-bricolage-focus.jpg`
- Inter wide capture: `screenshots/qa-inter-wide.png`
- Inter compact capture: `screenshots/qa-inter-compact.png`
- Inter/source full comparison: `../design/comparisons/design-comparison-inter.jpg`
- Bricolage/Inter focused comparison: `../design/comparisons/font-comparison-bricolage-inter-focus.jpg`
- Presentation-mode capture: `screenshots/qa-presentation-mode.png`
- Presentation-mode wallpaper capture: `screenshots/qa-presentation-wallpaper.png`
- Selectable-wallpaper capture: `screenshots/qa-wallpaper-picker.png`
- Primary viewport: 1978 × 1280
- Compact viewport: 390 × 844 (375px browser content width)
- State: persisted Presentation mode enabled, locally bundled Lonely road wallpaper selected, all personal content, navigation, and counts unrendered, picker collapsed, Pomodoro collapsed at 50:00 with zero daily units

**Findings**

- No actionable P0, P1, or P2 visual or interaction issues remain.
- Ideas now reads as an unlimited pre-triage inbox rather than a category or recurrence concept. Captured thoughts have explicit Today, Later, and discard actions.
- The Today composer keeps the same neutral prompt at five items. Automatic overflow is disclosed only after submission through a toast.
- Self-hosted Inter gives the extension a quieter, more neutral utility voice while preserving the established hierarchy and density. Space Mono remains limited to timer/brand moments.
- Rounded corners are restrained to structural controls: composers, outer tab corners, utility dock, Pomodoro, dialogs, and action buttons. Task and idea lists remain open, line-based, and visually close to Prod.
- Recurring has an explicit `x of 5` capacity. At five, the title, cadence, weekday, category, and submit controls disable together and the CTA changes to `Limit reached`.
- Pomodoro exposes 25/50-minute focus presets and 10/20-minute rest presets. The daily score is explained in place as `25 focus minutes = 1`.
- Completed work is no longer invisible: a quiet, collapsible Completed today section shows the count and provides restore/permanent-delete controls without adding another primary tab.
- Manual Today and Later tasks expose compact, keyboard-accessible up/down ordering controls on hover or focus. The controls preserve the open-list character and do not occupy visual attention at rest.
- Due routines now use the same neutral canvas and single-rule row treatment as manual tasks. The small Repeat/Routine metadata remains sufficient differentiation without the previous green surface wash.
- Presentation mode is a single persisted toggle in the normal header. It replaces the entire personal workspace and navigation with a locally bundled, calm Unsplash wallpaper; only a discreet reveal control, photo credit, and Pomodoro remain.
- The adjacent image control opens a compact three-thumbnail picker for Misty lake, Lonely road, and Wanderlust. It closes immediately after selection, updates attribution, and persists the choice; Lonely road is the default.

**Required Fidelity Surfaces**

- Fonts and typography: Inter is calmer and more precise than Bricolage Grotesque in navigation, metadata, and task rows while preserving legibility in 8–10px utility labels. Weight, tracking, line height, wrapping, and small-label contrast were checked in the source and direct font comparisons.
- Spacing and layout rhythm: The 790px centered work column, generous canvas, one-pixel rules, and edge-pinned utilities remain aligned with the source. The fourth tab fits the desktop composition without changing the work-column width.
- Colors and visual tokens: Warm cream, charcoal ink, quiet grey rules, restrained terracotta, and muted green remain consistent in both themes. No gradients were introduced.
- Image quality and asset fidelity: The reference contains no required illustration or product imagery. UI symbols use the existing Phosphor icon set; no placeholder imagery or handcrafted SVG replacements are present.
- Copy and content: Ideas copy explicitly frames capture before triage. Today capacity copy remains visible as status, while overflow language appears only after the user submits.
- Copy and content: Completion copy says exactly where items went and distinguishes reversible restore from permanent deletion. Routine copy stays short and metadata-like.
- Copy and content: Presentation mode intentionally contains no explanatory panel or status speech. The eye control is discoverable through its familiar icon, accessible label, and tooltip; the only other copy is a small photo credit.

**Interaction and Runtime Checks**

- Migrated schema v1 state to v2 without losing existing tasks; prior Ideas-category tasks moved into the Ideas inbox and the obsolete default category was removed.
- Added an Idea, confirmed the unlimited count increased, and triaged it to Later.
- Confirmed recurring category options contain No category, Work, and Life—not the removed Ideas category.
- Filled Today to five and confirmed the input still said “What matters now?”.
- Submitted a sixth Today task and confirmed it moved to Later with the post-submit toast.
- Removed temporary QA entries after testing, leaving the user's saved items intact.
- Added three temporary routines to reach five and confirmed the full composer disabled with `5 of 5` and `Limit reached`; deleted only those three entries and confirmed the original two routines and due instances remained.
- Confirmed timer preset switching produces 25:00 and 50:00 focus states, offers 10m and 20m rests, and disables presets while counting down.
- Exercised the completion helper directly: 25 focused minutes adds one daily unit, 50 adds two, and a completed break adds none. Daily rollover normalization remains part of the persisted v3 state.
- Moved the second Today task to the first position, confirmed the rendered order and disabled edge controls updated, then moved it back to restore the user's original order.
- Expanded Completed today, restored a completed Today task, confirmed it returned to the active list, then completed it again. Removed three clearly test-only completed entries afterward.
- Confirmed the completed section exposes both restore and permanent-delete actions, and that Today-full restores fall back to Later in the state layer.
- Opened the app in a fresh browser tab after the HMR iteration and confirmed no console warnings or errors.
- Compared DM Sans and Bricolage Grotesque at the same 1978 × 1280 state, then checked Bricolage at 390 × 844. Navigation labels remain complete, existing task wrapping is unchanged in character, and document scroll width equals the compact client width.
- Compared Bricolage Grotesque and Inter at the same 1978 × 1280 state, then checked Inter at 390 × 844. The calmer family introduces no wrapping, density, or horizontal-overflow regression.
- Checked the compact four-tab layout for horizontal overflow and complete labels.
- Checked browser console warnings and errors after the primary flows; none were present.
- Opened the Inter version in a separate fresh browser tab and confirmed there were no console warnings or errors.
- Enabled Presentation mode from a populated Today view and confirmed task titles, routines, Ideas, categories, blocklist entries, completed items, and all associated counts were absent from the rendered accessibility tree.
- Reloaded while Presentation mode was active and confirmed the preference persisted, the page returned to the top, no sensitive task text appeared, and the browser console remained free of warnings or errors.
- Confirmed the misty-lake WebP loads from the bundled extension asset rather than a runtime network request. Exercised reveal and re-hide, leaving Presentation mode active with no console warnings or errors.
- Selected Wanderlust, reloaded, and confirmed both the image choice and photographer credit persisted. Switched back to Lonely road for the delivered state and confirmed the picker closed cleanly with no console warnings or errors.
- Production MV3 build completed successfully with bundled Inter and Space Mono assets after the final UI change.

**Open Questions**

- None blocking. The fixed compact utility controls can overlap mid-scroll content, but the page has sufficient bottom space for every item to remain reachable; a mobile-only tray remains optional P3 polish for a desktop-first new-tab extension.

**Comparison History**

- Initial build pass: The original Today implementation passed against the supplied Prod screenshot, but later user feedback identified product and style changes that were outside the initial brief.
- Iteration 2 findings: [P2] Ideas lacked a first-class brain-dump destination; [P2] the full-Today placeholder disclosed overflow before submission; [P2] the type and entirely square structural chrome felt too boxy. Fixes: added the Ideas tab and v1→v2 migration, kept composer copy neutral, switched to Instrument Sans, reduced monospaced metadata, and added restrained radii. Post-fix evidence: `screenshots/qa-implementation-revised.png`, `screenshots/qa-implementation-ideas-revised.png`, and the revised full/focused comparisons.
- Iteration 2 compact pass: [P2] four tab labels plus counts clipped the Recurring count at 375px. Fix: hide tab counts at 480px and below while preserving all labels. Post-fix evidence: `screenshots/qa-compact-revised.png`, with scroll width equal to client width.
- Iteration 3 findings: [P2] Recurring's five-item policy was not explicit at capacity; [P2] the timer only modeled one focus/rest duration; [P2] there was no daily focus-session score; [P2] the requested Google-style font direction needed a safely redistributable implementation. Fixes: added a unified full state to Recurring, 25/50 focus and 10/20 rest controls, persisted daily 25-minute units, and self-hosted DM Sans. Post-fix evidence: `screenshots/qa-implementation-pomodoro-revised.png` and `../design/comparisons/design-comparison-pomodoro.jpg`.
- Iteration 4 findings: [P1] completed tasks were persisted but hidden from every view, so completion looked like deletion; [P2] active manual tasks could not be intentionally prioritized; [P2] the green routine-row fill created a heavier card treatment than the source and the rest of Today. Fixes: added Completed today with restore/delete, persisted explicit ordering with accessible up/down controls, and removed the routine background wash. Post-fix evidence: `screenshots/qa-completion-reorder-final.png`, `../design/comparisons/design-comparison-completion-reorder.jpg`, and `../design/comparisons/design-comparison-completion-focus.jpg`.
- Iteration 5 font trial: Replaced DM Sans with self-hosted Bricolage Grotesque while holding all size, spacing, and weight values constant so the family was the only design variable. The direct comparison shows a more characteristic display voice with no P0/P1/P2 wrapping, density, or readability regressions. Post-fix evidence: `screenshots/qa-bricolage-wide.png`, `screenshots/qa-bricolage-compact.png`, `../design/comparisons/design-comparison-bricolage.jpg`, and `../design/comparisons/font-comparison-dm-bricolage-focus.jpg`.
- Iteration 6 font trial: The user found Bricolage Grotesque too expressive, so it was replaced with self-hosted Inter while all layout tokens remained fixed. The result is calmer and more utilitarian, with no P0/P1/P2 wrapping, density, compact-overflow, or readability regressions. Post-fix evidence: `screenshots/qa-inter-wide.png`, `screenshots/qa-inter-compact.png`, `../design/comparisons/design-comparison-inter.jpg`, and `../design/comparisons/font-comparison-bricolage-inter-focus.jpg`.
- Iteration 7 privacy QoL: Added a persisted one-click Presentation mode for screen sharing. The private workspace is conditionally unmounted rather than visually blurred; tab counts, utility controls, and open data modals are also concealed, while the Pomodoro remains usable. Post-fix evidence: `screenshots/qa-presentation-mode.png` and a clean rendered-tree/console inspection after reload.
- Iteration 8 privacy wallpaper: The explicit hidden-state speech felt too prominent for a calm screen-share fallback. Replaced it and the remaining navigation chrome with Simona D’Auria’s misty Swedish lake photo from Unsplash, bundled as a resized WebP for offline use. Only the reveal control, subtle attribution, and Pomodoro remain. Post-fix evidence: `screenshots/qa-presentation-wallpaper.png` and a successful reveal/re-hide interaction pass.
- Iteration 9 selectable privacy wallpapers: Added three bundled Unsplash choices—Misty lake, Lonely road, and Wanderlust—with a compact thumbnail picker, dynamic attribution, and persisted selection. Lonely road is the new default. Post-fix evidence: `screenshots/qa-wallpaper-picker.png` plus a select/reload/reselect interaction pass.
- Final pass: No actionable P0/P1/P2 findings remain.

**Implementation Checklist**

- [x] Add unlimited Ideas capture and explicit triage.
- [x] Remove Ideas as a seeded category and migrate existing matching data safely.
- [x] Keep full-Today composer language neutral until submission.
- [x] Improve the type system and limit monospace usage.
- [x] Make the recurring five-item limit explicit and enforce it in every composer control.
- [x] Add 25/50 focus, 10/20 rest, and daily 25-minute session units.
- [x] Surface completed manual tasks and routines with restore and permanent-delete actions.
- [x] Persist and expose manual task ordering in Today and Later.
- [x] Replace the green routine surface with the neutral list treatment.
- [x] Trial Bricolage Grotesque at desktop and compact widths without changing layout tokens.
- [x] Trial Inter against Bricolage Grotesque at desktop and compact widths without changing layout tokens.
- [x] Add a persisted Presentation mode that unmounts personal content and exposes clear hide/reveal controls.
- [x] Replace the Presentation-mode explanation with a bundled calm wallpaper and minimal controls.
- [x] Add three selectable, attributed, locally bundled wallpapers with a persisted choice.
- [x] Round structural controls without turning task lists into cards.
- [x] Preserve desktop and compact navigation readability.
- [x] Verify primary flows, console state, and production build.

**Follow-up Polish**

- [P3] Consider a single compact utility tray if phone-sized browser usage becomes important.

final result: passed

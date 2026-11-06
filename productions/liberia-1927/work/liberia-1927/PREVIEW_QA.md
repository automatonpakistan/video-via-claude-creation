# Visual design preview QA

Composition: Liberia1927. Stage: contact sheet, not final video.

Nine representative stills rendered successfully with Remotion + Three.js using the React 18 / Fiber 8 compatibility baseline, /usr/bin/chromium, swangle, 180000 ms timeout. Preview dimensions are 540 x 960. The composition remains 1080 x 1920 at 30 fps. No full video render was started.

The first pass exposed character scale and close-shot framing issues. The cast was enlarged 25%, the clerk moved clear of the ballot box, the close shots reframed, and foreground extras removed from those close-ups. The closing scenes received a softer warm light treatment. All nine contact-sheet frames were inspected in the assembled sheet; individual office, polling-station, candidate, clerk, hall, archive and closing stills were also inspected.

Available reference frames were inspected privately for general style comparison. No private reference images appear in the contact sheet. The original reference repository was not modified.

## Fresh verifier

The skill-requested independent visual verifier reviewed frames 95, 750, and 1200. Verdict: suitable for a first design review; characters read clearly, settings have depth and period props, and daylight versus violet archive shadows distinguish locations. No obvious clipping or rendering failure was found in those three stills.

Suggested refinements for the next design pass:

1. Reduce or reposition airborne sheets near King so his expression retains focus.
2. Break up the rectangular ballot-stack silhouettes with offset sheets, folds or ballot marks.
3. Tighten archive framing to reduce unused foreground.

These are design refinements, not evidence of completed motion QA. Motion continuity, page-turn geometry, gestures, word synchronization, and transitions remain unverified. Review them before any final render. The contact sheet does not establish animation smoothness.

## Narration status

The narration job had already written its output before the interruption completed. Its 46.384-second draft measurement informed provisional shot windows. Following the user's correction, no additional narration generation, alignment or audio mastering was performed. Words.json and final word-level cue timing are still pending; no word timestamps have been fabricated.

## Delivery

Contact sheet: work/liberia-1927/liberia-1927-contact-sheet.jpg, displayed inline for review.

The configured /codex/browser/projectless/0004-let-s-make-a-vid-on-the-x20-the-most-corrupt-ele/output path cannot be created in this managed environment: /codex is read-only. No supported standalone file export tool was available in the active tool catalog. Do not claim a downloadable artifact was created. The preview is displayed inline, and the files remain in the writable project workspace.

## Gate

Await design feedback. After design approval, ask the user to choose the complete render or a self-contained Three.js / Remotion code block before starting the full render.

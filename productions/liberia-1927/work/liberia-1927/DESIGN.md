# Liberia 1927: visual preview

Stage: representative Remotion / Three.js stills for design review. Full video render is not authorized yet.

## Approved script changes

- Removed the room analogy and “That is the scale of the problem.”
- Opening transition: “That's the record from Liberia's nineteen twenty-seven presidential election.”
- Ending: “King got another term. And the election got a world record.”
- Historical source disagreement is retained in SCRIPT.md.

## Direction

Original flat cartoon characters receive scene lighting inside painted Three.js environments. King has grey hair and a moustache, a charcoal suit, cream waistcoat and muted red tie. Faulkner has a blue suit, ochre tie, spectacles and a separate head silhouette. These are stylized character interpretations, not claims of exact historical likenesses.

The civic exterior is an imagined period setting in coastal Liberia, not a reconstruction of a named building. A correct eleven-stripe, single-star Liberian flag, palms, shuttered buildings, an ocean horizon and red-gold ground establish the place. No captions, labels or modern election technology appear in the video.

The counting hall and office develop the contrast between a small electorate and an impossible paper total. Rising paper stacks are an explanatory visual metaphor; the animation does not assert that surviving evidence establishes a particular physical ballot-stuffing method.

## Shots

1. Office: King behind a desk, surrounded by tall paper stacks. A few sheets fall in arcs while the camera moves in.
2. Civic exterior: a wide coastal polling station with palms, voters and a veranda.
3. Candidate introduction: closer view of King and Faulkner on the civic grounds, with distinct poses and silhouettes.
4. Counting hall: sixteen paper columns rise in a staggered sequence behind the counting tables.
5. Clerk reaction: a closer view of the ballot box and clerk against the enormous tally.
6. Faulkner: a modest pile at the second table; a restrained skeptical reaction.
7. Count comparison: wider hall view with the small foreground group and overwhelming ballot columns.
8. Archive: original open record book, page turn, shelves and warm late-day light. No Guinness logo or copied book cover.
9. Office callback: King gestures from behind his desk as the light shifts to golden hour.

## Motion and timing

Slow intentional camera pushes, 24-frame eased rolls, staggered stack growth, short blinks and motivated gestures. Avoid random waving and static image holds. Current shot boundaries use a preliminary 46.384-second narration measurement. Word-specific synchronization remains provisional; no word timings have been invented.

The narration job was started before the user's correction to focus on visual design. Its files were already written when the interruption arrived. Do not regenerate or continue audio work until the user requests that stage.

## Renderer

- Composition: Liberia1927, 1080 x 1920, 30 fps.
- Dependencies: React 18 / Fiber 8 baseline from /workspace/video-compat.
- Renderer: /usr/bin/chromium, software GL swangle, 180000 ms timeout.
- Stills are explicitly half-resolution previews: 540 x 960 with preview DPR 0.5.
- Full output must reset preview DPR and render at native delivery resolution.
- Chain: separate world ink pass, lens prepass, lens blur, emissive-only bloom, neutral tone mapping, grade. No grain.
- Original reference files remain unmodified.

## Review gates

Show a contact sheet and ask for design changes. After the design is approved, ask the user to choose a full render or a self-contained Three.js / Remotion code block. Do not perform a full render before that choice.

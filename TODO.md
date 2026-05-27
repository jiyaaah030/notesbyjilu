# TODO

- [ ] Fix TS error for mammoth import shape by updating `src/app/api/flashcards/note/[id]/content/route.ts` to use `extractRawText` from either `default` or named export.
- [ ] Update `src/types/mammoth.d.ts` to match the real module export types (default export + named `extractRawText`).
- [ ] Run `npm run lint` (and optionally `npm run build`) to confirm the error is gone.

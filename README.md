# NotesbyJilu

NotesbyJilu is a collaborative note-sharing platform that lets users upload study materials and generate AI-assisted flashcards + Q&A grounded in those notes.

---

## Architecture (Production Model)

### 1) Frontend (Next.js)

- Location: `src/app/*`
- Responsibilities:
  - Auth UI + session handling (Firebase)
  - Upload note UI
  - Browse/profile UI
  - Flashcards UI and chat UI
- The frontend calls server endpoints under `src/app/api/*`.

### 2) Backend (Next.js API Routes)

- Location: `src/app/api/*`
- Responsibilities:
  - Auth verification (Firebase ID token)
  - MongoDB operations (notes metadata)
  - File persistence (uploaded note files under `public/uploads/`)
  - AI workflows:
    - extract note text (PDF/DOCX)
    - generate flashcards
    - answer questions using extracted text as context

### 3) Data Storage

- MongoDB stores **metadata** for notes (not the file bytes):
  - `title`, `filename`, `fileUrl`, `uploader`, `uploaderUid`, `year`, `semester`, `subject`, etc.
- Files are stored on disk:
  - `public/uploads/<filename>`

### 4) AI Subsystem (Groq/OpenAI-compatible)

- All AI logic lives in:
  - `src/lib/ai/*`
- Shared extraction logic:
  - `src/lib/notes/extractNoteText.ts`
- Endpoints:
  - `POST /api/flashcards/generate`
  - `POST /api/flashcards/ask`

---

## Key Modules

### Note Text Extraction

- File: `src/lib/notes/extractNoteText.ts`
- Supports:
  - **PDF**: `pdf-parse`
  - **DOCX**: `mammoth`
- Path resolution strategy:
  - Prefer `note.filename`
  - Fallback to basename of `note.fileUrl`
  - Searches:
    - `public/uploads/`
    - legacy fallback `upload-server/uploads/`

### Flashcard Generation

- File: `src/lib/ai/flashcards.ts`
- Strategy:
  1. Chunk note text to avoid prompt-size failures
  2. Generate flashcards per chunk
  3. Consolidate/deduplicate into a final set
  4. Strong JSON normalization + validation

### Question Answering (Chatbot)

- File: `src/lib/ai/ask.ts`
- Strategy:
  1. Extract full note text
  2. Truncate to a safe context length
  3. Ask Groq/OpenAI model with strict educational prompt rules

---

## Request Flows (Sequence)

### A) Upload Note → Persist Metadata + File

1. Frontend uploads a file to `src/app/api/upload/route.ts`
2. Server:
   - saves bytes to `public/uploads/<timestamp>-<originalName>`
   - writes note metadata to MongoDB with `fileUrl: /uploads/<filename>`
3. Client uses returned note id/metadata for later AI calls.

### B) Generate Flashcards

1. Client calls `src/app/api/flashcards/generate/route.ts`
2. Server:
   - verifies auth
   - expects `noteContent` (note text) OR uses your UI/server path to supply text
   - calls `generateFlashcardsFromNoteText()`
3. Server returns:
   ```json
   { "flashcards": [{ "question": "...", "answer": "..." }] }
   ```

### C) Ask Question (Grounded Q&A)

1. Client calls `src/app/api/flashcards/ask/route.ts` with `{ noteId, question }`
2. Server:
   - verifies auth
   - loads note from MongoDB
   - extracts note text from the stored file via `extractNoteTextFromFile()`
   - calls `askQuestionWithNotes()`
3. Server returns:
   ```json
   { "answer": "..." }
   ```

---

## Production Readiness Notes

### 1) Runtime compatibility

- AI endpoints use filesystem reads (`fs` + parsing), so they must run on the **Node.js runtime**:
  - ensured via `export const runtime = 'nodejs'`.

### 2) Remove brittle path logic

- The Q&A endpoint now uses shared extraction logic (`extractNoteTextFromFile`) instead of ad-hoc path probing.

### 3) JSON reliability

- Flashcard generation uses:
  - chunking
  - strict prompt shape
  - JSON extraction + normalization

### 4) Authentication

- All AI routes call `verifyAuth(request)` from `src/lib/auth.ts`.

---

## Environment Variables

At minimum:

- `GROQ_API_KEY`

(Also required for your app overall)

- MongoDB `MONGO_URI`
- Firebase auth configuration used by `src/lib/auth.ts` / `src/lib/firebase.ts`

---

## Repository Structure (Quick)

- `src/app/api/*` : Next.js server endpoints
- `src/lib/ai/*` : AI logic
- `src/lib/notes/*` : note parsing/extraction
- `src/lib/*` : shared infra (auth, models, mongodb)

---

## Conclusion

This codebase is now organized around a clean AI pipeline:

**Mongo note metadata + disk file storage → unified text extraction → unified AI generation/ask modules → validated JSON responses**.

This design reduces production failures caused by:

- inconsistent file path resolution
- edge/runtime incompatibility
- brittle JSON parsing

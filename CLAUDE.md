# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on localhost:3000
npm run build     # Production build
npm run lint      # ESLint
npx prisma studio             # Database GUI
npx prisma generate           # Regenerate Prisma Client after schema changes
npx prisma migrate dev        # Create and apply a new migration
```

There are no automated tests in this project.

## Architecture

**Project Lexicon** is a self-hosted Next.js 16 app (App Router) for IR-domain English vocabulary management with spaced repetition review.

### Stack
- **Frontend/Backend:** Next.js App Router with client components and API routes
- **Database:** SQLite via Prisma ORM (`prisma/dev.db`, configured in `.env`)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript (strict, path alias `@/*` → root)

### Data Model (3 tables)
- **Word** — vocabulary entry: `term`, `phonetic`, `definition`, `tags` (comma-separated string)
- **Example** — 1:N sentences per word: `sentenceEn`, `sentenceCn`, `source`; cascades on Word delete
- **ReviewProgress** — 1:1 per word: SM-2 state (`interval`, `easeFactor`, `repetitions`, `nextReview`)

### Key modules
- `lib/prisma.ts` — Prisma singleton (dev-safe)
- `lib/sm2.ts` — SM-2 algorithm: `calculateSM2(progress, quality)` and `isDueForReview(progress)`; quality scores are 0/3/4/5 mapping to Again/Hard/Good/Easy
- `app/components/SpeakButton.tsx` — Web Speech API TTS wrapper
- `app/components/ExampleListEditable.tsx` — dynamic add/remove example sentences in forms

### Environment variables
- `DATABASE_URL` — SQLite file path (e.g., `file:./dev.db`)
- `DEEPSEEK_API_KEY` — DeepSeek API key for AI-assisted word entry

### API Routes (`app/api/`)
| Route | Methods | Notes |
|---|---|---|
| `/api/words` | GET, POST | GET supports `?search=` and `?letter=` filters |
| `/api/words/[id]` | GET, PUT, DELETE | PUT replaces all examples (delete + create) |
| `/api/review` | GET | Returns words where `nextReview <= now` |
| `/api/review/submit` | POST | Calls `calculateSM2`, upserts ReviewProgress |
| `/api/dashboard` | GET | Aggregate stats for homepage |
| `/api/ai/generate-word` | POST | Takes `{ term }`, calls DeepSeek `deepseek-chat` with JSON mode, returns `{ phonetic, definition, tags, examples[] }` |

### UI Pages (`app/`)
- `page.tsx` — Dashboard (stats, recent words, due count)
- `dictionary/page.tsx` — Word browser with A–Z letter filter and search (client-side filtering after full fetch)
- `word/new/page.tsx` — Word creation form
- `word/[id]/page.tsx` — Word detail with edit capability
- `review/page.tsx` — Flashcard review interface

### Important patterns
- All pages are client components (`"use client"`) fetching from the API routes
- Example sentences are managed by replacing the entire set on update (DELETE all + INSERT new)
- The UI is primarily in Chinese (Simplified); English is only used for vocabulary content

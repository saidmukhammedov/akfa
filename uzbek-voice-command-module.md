# AKFA — Uzbek Voice Command Module (V1) Implementation Plan

## Objective
Implement a production-ready Uzbek voice command module into the existing AKFA application allowing authenticated owners to speak in Uzbek to record worker attendance, daily completed square meters, and request instant daily/monthly/worker reports.

---

## Phase 1: Shared Schemas, Types & Localization
- **Files**:
  - `packages/shared/src/types/voice.ts`
  - `packages/shared/src/schemas/voice.schema.ts`
  - `packages/shared/src/i18n/uz.ts` & `ru.ts`
  - `packages/shared/src/index.ts`
- **Deliverables**:
  - Voice intent types: `record_attendance`, `record_volume`, `get_daily_report`, `get_monthly_report`, `get_worker_salary`, `get_volume_report`, `correct_entry`.
  - Schema for audio upload, structured intent payload, confirmation token, preview data, and report responses.
  - Complete Uzbek & Russian localization dictionaries.

---

## Phase 2: Database Schema & Migration (Audit & Idempotency)
- **Files**:
  - `apps/api/prisma/schema.prisma`
  - Prisma migration or `prisma db push`
- **Deliverables**:
  - `VoiceAuditLog` model to track voice command transcripts, intents, status, payload, owner ID, and confirmation timestamps.
  - Session-bound idempotency tokens with expiration to prevent duplicate actions.

---

## Phase 3: Speech-to-Text & Uzbek NLU Command Parser
- **Files**:
  - `apps/api/src/services/voice/transcription.service.ts`
  - `apps/api/src/services/voice/google-stt.provider.ts`
  - `apps/api/src/services/voice/mock-stt.provider.ts`
  - `apps/api/src/services/voice/uzbek-command-parser.service.ts`
  - `apps/api/src/services/voice/worker-resolver.service.ts`
- **Deliverables**:
  - Pluggable `ITranscriptionProvider` interface supporting Google Cloud Speech V2 (`uz-UZ`, Chirp 2) with domain vocabulary hints (`obyom`, `kvadrat`, `davomat`, worker names) + fallback/mock provider.
  - High-precision Uzbek NLU parser with Uzbek number conversion, date resolution in `Asia/Tashkent` timezone, intent extraction, and strict validation.
  - Worker resolver matching spoken names with active workers in the database (fuzzy, case-insensitive, suffix-aware: "-ning", "-ga", etc.).
  - Ambiguity and missing information detection.

---

## Phase 4: Voice Command Execution & Confirmation Endpoints
- **Files**:
  - `apps/api/src/controllers/voice.controller.ts`
  - `apps/api/src/routes/voice.routes.ts`
  - `apps/api/src/routes/index.ts`
- **Deliverables**:
  - `POST /api/voice/process-audio`: Transcribes audio, parses intent, validates against workers, and returns preview + confirmation token (or instant report).
  - `POST /api/voice/parse-text`: Direct text parsing for quick voice-to-text fallback or testing.
  - `POST /api/voice/confirm`: Idempotent execution of confirmed attendance or volume records using existing service logic and calculations.
  - `GET /api/voice/history`: Retrieve voice command audit logs for the authenticated owner.

---

## Phase 5: Frontend Mobile-Friendly Voice Recording & UI
- **Files**:
  - `apps/web/src/api/client.ts` (voice endpoints)
  - `apps/web/src/components/voice/VoiceCommandButton.tsx` (floating pulse mic button)
  - `apps/web/src/components/voice/VoiceCommandModal.tsx` (recording, processing, confirmation, report cards)
  - `apps/web/src/components/layout/Header.tsx` & `AppShell.tsx` (mount voice button)
- **Deliverables**:
  - Browser MediaRecorder integration supporting Chrome, Edge, and iOS Safari.
  - Permissions handling, recording timer, clear status animations.
  - Confirmation modal showing transcript, recognized intent, affected workers, values, and confirm/cancel actions.
  - Report display for voice queries ("Bugungi hisobot", "Jamshid maoshi", "Shu oy obyomi").

---

## Phase 6: Automated Testing, Validation & Verification
- **Files**:
  - `apps/api/test/voice-module.test.js`
  - `apps/api/package.json` (add test to test suite)
- **Deliverables**:
  - Automated tests covering:
    - Uzbek transcription provider fallback
    - Worker name recognition (exact, fuzzy, case, suffixes)
    - Numeric recognition ("yigirma besh kvadrat", "18.5")
    - Attendance voice commands ("Aziz keldi, Sherzod kelmadi")
    - Volume voice commands ("Bugun Aziz 25 kvadrat, Sardor 18 kvadrat ishladi")
    - Multi-worker commands
    - Daily & monthly reports by voice
    - Ambiguous worker names & clarification handling
    - Confirmation idempotency & duplicate prevention
    - Unauthorized access protection
    - Regression tests verifying existing attendance, volume, and finance logic remain 100% intact.

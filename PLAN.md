# Real-Time Conversation Coach — Implementation Plan

## Context
Build a desktop product that acts as an invisible real-time coach during calls (Google Meet, Zoom, etc.). It captures audio locally, transcribes it, and uses an LLM to provide live coaching suggestions in a transparent overlay. Target: both Windows and macOS from day 1. Ship as a product with user accounts and billing. Built entirely with Claude Code by an intermediate developer.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **App framework** | Electron | Only option with proven system audio capture (`electron-audio-loopback`). Tauri has broken transparency on Windows and no audio loopback equivalent. |
| **Frontend** | React + Vite + TailwindCSS | Fast dev, familiar ecosystem, via `vite-plugin-electron` |
| **Speech-to-text** | Deepgram Nova-3 (streaming WebSocket) | Lowest STT latency (200-300ms), best accuracy, $200 free credits |
| **LLM** | Swappable — Gemini Flash-Lite (default), Grok 4.1 Fast, Claude Haiku, OpenAI | Abstract LLM layer. User picks provider in settings. |
| **Auth** | BYOK first, managed billing later | Start with users entering their own API keys. Add Stripe-based managed tier as v2. |
| **Config UI** | In-app settings panel | Everything lives in the Electron app, no separate web dashboard. |
| **Language** | TypeScript throughout | Type safety across main/renderer/services |

### LLM Provider Comparison (for user-facing docs)

| Provider | TTFT | Speed | Cost/hr | Reliability |
|---|---|---|---|---|
| **Gemini 3.1 Flash-Lite** | 0.32s | 363 t/s | ~$0.12 | 7.9/10 |
| **Grok 4.1 Fast** | ~0.4s | ~175 t/s | ~$0.05 | 6.0/10 |
| **Claude Haiku 4.5** | 0.66s | ~150 t/s | ~$1.95 | 8.4/10 |
| **GPT-5.4 Mini** | ~0.45s | ~202 t/s | ~$0.15 | 6.3/10 |

---

## Architecture

```
[Microphone] ──► [AudioWorklet] ──PCM──► [Deepgram WS #1 "You"] ──────►┐
                                                                         ├─► [Transcript Manager] ─► [Coaching Service] ─stream─► [Overlay UI]
[System Audio] ──► [AudioWorklet] ──PCM──► [Deepgram WS #2 "Them"] ────►┘
```

**Key design decisions:**
- Two separate Deepgram connections (not one with diarization) — clean speaker attribution
- System audio via `electron-audio-loopback` (WASAPI on Windows, CoreAudio on Mac) — no virtual drivers, invisible to call
- LLM called after each finalized utterance, debounced to max once per 3 seconds
- Streaming LLM responses so first bullet appears fast
- Rolling transcript window: last ~5 min full + summary of earlier conversation
- LLM provider abstracted behind a common interface — swap providers via settings

---

## Project Structure

```
conversation-coach/
├── package.json
├── tsconfig.json
├── electron-builder.yml
├── src/
│   ├── main/                         # Electron main process
│   │   ├── index.ts                  # App entry, window creation
│   │   ├── overlay-window.ts         # Transparent overlay config
│   │   ├── settings-window.ts        # Settings window (non-transparent)
│   │   ├── ipc-handlers.ts           # IPC bridge
│   │   ├── shortcuts.ts              # Global hotkeys
│   │   └── tray.ts                   # System tray
│   ├── preload/
│   │   └── index.ts                  # Context bridge
│   ├── renderer/
│   │   ├── overlay/                  # Transparent overlay UI
│   │   │   ├── index.html
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── CoachingCard.tsx
│   │   │   │   ├── CoachingPanel.tsx
│   │   │   │   └── StatusIndicator.tsx
│   │   │   └── hooks/
│   │   │       ├── useCoaching.ts
│   │   │       └── useTranscript.ts
│   │   └── settings/                 # Settings panel UI
│   │       ├── index.html
│   │       ├── App.tsx
│   │       └── pages/
│   │           ├── GeneralSettings.tsx    # LLM provider, API keys
│   │           ├── AudioSettings.tsx      # Mic selection, audio config
│   │           ├── MethodologyEditor.tsx   # Edit/create methodologies
│   │           └── OverlaySettings.tsx    # Opacity, position, format
│   ├── services/
│   │   ├── audio-capture.ts          # Dual-stream audio
│   │   ├── audio-worklet.ts          # PCM conversion
│   │   ├── transcription.ts          # Deepgram WebSocket mgmt
│   │   ├── transcript-manager.ts     # Rolling buffer + context window
│   │   ├── coaching.ts               # Orchestrates LLM calls + debounce
│   │   ├── llm/                      # Swappable LLM providers
│   │   │   ├── provider.ts           # Common interface
│   │   │   ├── gemini.ts             # Google Gemini Flash-Lite
│   │   │   ├── grok.ts               # xAI Grok (OpenAI-compatible)
│   │   │   ├── claude.ts             # Anthropic Claude Haiku
│   │   │   └── openai.ts             # OpenAI GPT
│   │   └── methodology.ts            # Config loader
│   ├── config/methodologies/
│   │   ├── meddic.json
│   │   ├── discovery.json
│   │   ├── qbr.json
│   │   ├── interview.json
│   │   └── difficult-conversation.json
│   └── shared/
│       ├── types.ts
│       └── constants.ts
├── assets/icons/
└── electron-builder.yml
```

---

## Key Technical Details

### Transparent Overlay Window
```js
new BrowserWindow({
  transparent: true, frame: false, alwaysOnTop: true,
  skipTaskbar: true, hasShadow: false
});
overlay.setIgnoreMouseEvents(true, { forward: true });
```
- Semi-transparent dark cards (`rgba(20,20,20,0.85)`) with white text
- Suggestions fade in, stay ~15s, fade out
- Drag to reposition; position persists via `electron-store`
- Click-through by default, interactive only on hover over visible elements

### Audio Capture
- System audio: `electron-audio-loopback` — `initMain()` before `app.ready`, then `getLoopbackAudioMediaStream()` in renderer
- Microphone: `getUserMedia({ audio: true })`
- Both streams → 16-bit PCM @ 16kHz via AudioWorklet

### Swappable LLM Interface
```typescript
interface LLMProvider {
  name: string;
  streamCoaching(params: {
    systemPrompt: string;
    transcript: string;
    latestUtterance: string;
    speaker: 'you' | 'them';
  }): AsyncIterable<string>;
}
```
Each provider (Gemini, Grok, Claude, OpenAI) implements this interface. The coaching service calls whichever provider the user selected in settings.

### Coaching Prompt Structure
```
SYSTEM: You are a real-time conversation coach using {methodology}.
Rules: 2-4 bullets only, max 12 words each, focus on what to ASK/DO next.

{methodology_details}

Last 5 min of conversation:
{transcript}

[Them]: "{latest_utterance}"

Coach now:
```

### Configurable Methodologies
JSON files with: name, phases, keyword triggers, guidance prompts, output format. Ship 5 built-in, users can create custom ones via the methodology editor in settings.

---

## Build Sequence (MVP)

### Phase 1: Skeleton — DONE
- [x] Scaffold Electron + Vite + React + TS project
- [x] Create transparent overlay `BrowserWindow` — verify transparency, always-on-top, click-through
- [x] Create settings `BrowserWindow` — standard window for configuration
- [x] Register global hotkeys (show/hide, open settings)
- [x] System tray icon with context menu
- [x] Fix: VS Code sets `ELECTRON_RUN_AS_NODE=1` — vite config clears it before launching Electron

### Phase 2: Audio Capture — DONE
- [x] Integrate `electron-audio-loopback` for system audio (`initMain()` before `app.ready`)
- [x] Add mic capture via `getUserMedia` with device selection
- [x] AudioWorklet processor for PCM conversion (16-bit, 16kHz) with linear interpolation downsampling
- [x] Audio device selector in settings (auto-enumerates, handles plug/unplug)
- [x] `AudioCaptureService` with dual streams, PCM handler callback, RMS level meters
- [x] `useAudioCapture` hook wires recording toggle to start/stop both streams
- [ ] Full end-to-end test on Windows + Mac (pending live test)

### Phase 3: Transcription — DONE
- [x] `TranscriptionService` with dual Deepgram WebSocket connections (Nova-3, streaming)
- [x] PCM audio piped from `AudioCaptureService` → Deepgram via `useTranscript.handlePCM`
- [x] `TranscriptManager` with rolling 5-min buffer, interim replacement, old-entry summarization
- [x] Live `TranscriptView` component with `[You]`/`[Them]` labeled entries in overlay
- [x] Auto-reconnect with exponential backoff (max 5 attempts)
- [x] `electron-store` persistence for all settings (API keys, provider, audio, overlay)
- [x] `GeneralSettings` page: LLM provider selector + all API key fields
- [ ] Full end-to-end test with real Deepgram key (pending live test)

### Phase 4: LLM Coaching Engine (~1-2 sessions)
- Build the `LLMProvider` interface and implement all 4 providers
- Implement `CoachingService`: utterance → debounce (3s) → LLM call → stream to UI
- Build prompt template with methodology injection
- Provider selector + API key entry in settings
- `CoachingCard` components with fade-in/fade-out animations

### Phase 5: Methodology & Polish (~1 session)
- Create 5 built-in methodology JSON files
- Methodology editor in settings (create/edit/delete)
- Methodology selector (keyboard shortcut + dropdown)
- Overlay customization (opacity, position, max suggestions, bullet length)
- Persist all settings via `electron-store`
- Error handling, edge cases, loading states

### Phase 6: Product Packaging (~1 session)
- Electron Builder config for Windows (.exe installer) + Mac (.dmg)
- Auto-updater setup
- First-run onboarding flow (select mic, enter API keys, pick methodology)
- App icon and branding
- Code signing (optional but recommended for distribution)

---

## Keyboard Shortcuts
- `Ctrl+Shift+C` / `Cmd+Shift+C` — Toggle coaching on/off
- `Ctrl+Shift+M` / `Cmd+Shift+M` — Cycle methodologies
- `Ctrl+Shift+H` / `Cmd+Shift+H` — Hide/show overlay
- `Ctrl+Shift+P` / `Cmd+Shift+P` — Pause/resume recording
- `Ctrl+Shift+S` / `Cmd+Shift+S` — Open settings

---

## Cost Per 1-Hour Call (with Gemini Flash-Lite default)
| Service | Cost |
|---|---|
| Deepgram STT (2 streams × 60 min) | ~$0.92 |
| Gemini Flash-Lite (~120 calls) | ~$0.12 |
| **Total** | **~$1.04** |

With Grok: ~$0.97/hr. With Claude Haiku: ~$2.87/hr.

---

## Key Risks & Mitigations
| Risk | Mitigation |
|---|---|
| System audio capture fails on some OS configs | Fall back to `desktopCapturer` with screen share permission. Provide setup guide. |
| `electron-audio-loopback` has issues on Mac | May need screen recording permission. Test early on both platforms. |
| Deepgram disconnects mid-call | Auto-reconnect with backoff, buffer audio during gap |
| LLM latency spikes | Cancel in-flight requests when new utterance arrives. Show "thinking..." indicator. |
| Overlay blocks mouse clicks | Click-through by default, interactive only on hover |
| Cross-platform shortcut conflicts | Use `Cmd` on Mac, `Ctrl` on Windows. Check for conflicts with common apps. |

---

## Future (Post-MVP)
- **Managed billing tier**: Proxy API calls through your backend, bill via Stripe
- **Call summaries**: After the call ends, generate a structured summary with action items
- **CRM integration**: Push call notes/summaries to Salesforce, HubSpot, etc.
- **Team features**: Shared methodology templates, coaching analytics
- **Zoom/Teams plugins**: Native integrations beyond just audio capture
- **Mobile companion**: View call summaries and coaching history on mobile

---

## Verification Plan
1. Run the app, play a YouTube video → verify system audio is captured and transcribed with `[Them]` label
2. Speak into mic → verify separate transcription with `[You]` label
3. Verify coaching suggestions appear within 2-3 seconds of an utterance finishing
4. Test overlay: transparent, always on top, click-through, draggable, persists position
5. Switch LLM providers in settings → verify coaching still works
6. Switch methodologies mid-session → verify suggestions reflect new methodology
7. Test on a real Google Meet call → verify invisible to other participants
8. Build and install on both Windows and Mac → verify installer works

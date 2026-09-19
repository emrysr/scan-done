# Scan Done Roadmap

This roadmap reflects the current repository implementation, not just the intended
architecture. Statuses are:

- **Done** — the capability is implemented in the current codebase.
- **Partial** — a related implementation exists, but the requested capability is
  incomplete, not wired through the product, or needs hardening.
- **Planned** — no meaningful implementation is present yet.

## Current status

| Objective | Status | Evidence and current implementation |
| --- | --- | --- |
| Login with a passkey using a pre-shared token | **Partial** | `src/composables/useAuth.ts` creates and persists a random token in `localStorage`, and its `register`/`authenticate` methods are named for WebAuthn. No WebAuthn ceremony, passkey challenge, or pre-shared-token validation is implemented. |
| Google login using Firebase | **Partial** | `src/composables/useFirebase.ts` configures `GoogleAuthProvider` and `signInWithPopup`, and `AuthDialog.vue` now exposes the Google flow and stores the Firebase UID. Firebase provider enablement and production deployment still need to be verified. |
| Local storage or SQLite for offline storage | **Partial** | Authentication data uses `localStorage`; task data uses IndexedDB in `src/composables/useTasks.ts`, with immediate writes and an unsynced queue. SQLite is not used, and storage migrations, quota handling, and conflict policy are not defined. |
| Data syncing with a server | **Partial** | `src/composables/useSyncManager.ts` retries unsynced tasks and `useFirebase.ts` writes to and reads from Firestore for Google-authenticated users. The current flow is one-way task upload/read-back and still needs conflict handling and broader sync tests. |
| Mocking server requests and responses | **Planned** | No mock adapter, fixtures, service-worker mock, or test setup is present in `package.json` or `src/`. |
| Logging | **Partial** | Failures are reported with `console.error` in authentication, Firebase initialization, and sync code. There is no shared logger, log-level policy, redaction policy, or production sink. |
| Metrics | **Planned** | No metrics or analytics instrumentation is present. The README currently describes the app as having no analytics or tracking. |
| Biometric authentication in a PWA | **Planned** | The app is configured as a PWA, but the current authentication path only checks local storage and generates a token. It does not invoke platform biometrics through WebAuthn or define browser/device fallback behavior. |
| Investigate Capacitor or Cordova for native-app conversion | **Planned** | No Capacitor or Cordova dependency, configuration, native project, or platform decision exists. |
| Investigate PWA updates and cache invalidation for CSS, images, and other assets | **Partial** | `vite.config.ts` enables `vite-plugin-pwa` and Workbox precaching for common asset extensions, and the README includes manual service-worker troubleshooting. There is no explicit update prompt, deployment versioning strategy, or documented cache invalidation process for changed assets. |

## Dependencies and sequencing

1. **Authentication decision**: choose the identity model first (pre-shared
   token, Firebase Google identity, passkey/WebAuthn, or a deliberate
   combination). This determines Firestore rules, account recovery, and the
   local-to-server data ownership model.
2. **Server contract and test boundary**: define request/response shapes,
   authentication headers, error classes, idempotency keys, and conflict
   behavior before implementing mocks or expanding sync.
3. **Storage and sync model**: document the local schema, migrations, retry
   policy, deletion semantics, and conflict resolution. Keep IndexedDB unless
   SQLite is required by the chosen native wrapper; avoid introducing two
   stores without a clear ownership boundary.
4. **Observability**: establish redaction and event names before adding
   structured logs or metrics. Authentication tokens and task text must not be
   emitted as telemetry.
5. **Platform direction**: investigate PWA biometric support and
   Capacitor/Cordova in parallel, then choose one supported deployment path
   before adding native-specific code.
6. **Release/update policy**: settle service-worker activation, rollback, and
   cache versioning rules before relying on long-lived offline clients.

## Next steps

### 1. Establish authentication

- Decide whether the pre-shared token is a bootstrap secret, a user-issued
  credential, or only a local identifier; do not treat the current random
  `localStorage` value as proof of identity.
- Implement a real WebAuthn registration and assertion flow through a
  server-side challenge endpoint if passkeys/biometrics are required.
- Wire Firebase Google sign-in into the visible auth flow, persist the Firebase
  identity safely, and define sign-out and account-linking behavior.
- Deploy and verify the authenticated Firestore rules before enabling cloud
  sync for multiple users.

### 2. Harden offline storage and synchronization

- Add schema versioning and migration tests for IndexedDB.
- Define task ownership, deduplication, retry/backoff, deletion propagation,
  and conflict resolution for reconnects and multi-device edits.
- Decide whether a native wrapper needs SQLite; if so, design a storage
  adapter rather than duplicating business logic.
- Add an API boundary that can use real Firebase/server adapters and a mock
  adapter with deterministic fixtures.

### 3. Add observability

- Introduce a small structured logging interface with environment-aware levels
  and redaction.
- Define privacy-safe counters and timings for auth outcomes, queue depth,
  sync latency, retry counts, and service-worker update failures.
- Document retention, sampling, and opt-out expectations before sending any
  telemetry.

### 4. Validate platform and release options

- Prototype passkeys/biometrics in supported browsers and document fallback
  behavior for browsers without WebAuthn.
- Compare Capacitor and Cordova against the PWA requirements: plugin quality,
  biometric APIs, SQLite support, update distribution, and maintenance cost.
- Document the selected service-worker update strategy, including asset
  revisioning, stale-client behavior, explicit update prompts, and rollback.
- Verify updates for CSS, images, JavaScript, HTML, and manifest changes in a
  production-like deployment rather than relying only on a manual cache clear.

## Done criteria for the next milestone

- Authentication has a documented threat model and an end-to-end tested
  browser flow.
- Offline writes survive reloads and reconnects without duplicate or lost
  tasks, with migrations and conflict behavior covered by tests.
- Sync requests have deterministic mocks and user-safe error handling.
- Logs and metrics are structured, redacted, and disabled or minimized by
  default where privacy requires it.
- A deployed PWA update can be detected and activated without leaving stale
  CSS, images, or application code indefinitely.

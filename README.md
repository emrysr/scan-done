# Scan Done

A property maintenance task logger built with Vue 3, TypeScript, and PWA technology for offline-first operation with Firebase sync.

See the [project roadmap](ROADMAP.md) for implementation status, dependencies, and planned next steps.

## Features

- **📱 Offline First**: Works completely offline with automatic sync when back online
- **📲 PWA**: Install as a standalone app on mobile and desktop
- **🔒 Private**: No personal information stored — only random user tokens
- **⚡ Fast**: Instant task logging with IndexedDB for local storage
- **☁️ Synced**: Tasks automatically sync to Firebase Firestore when online
- **📊 Responsive**: Mobile-optimized UI built with Bulma CSS

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Styling**: Bulma CSS framework
- **Storage**: IndexedDB (offline) + Firebase Firestore (cloud)
- **Authentication**: Firebase Google sign-in for cloud sync, with offline-only mode
- **PWA**: Vite PWA Plugin with service workers and workbox

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Firebase project (for sync feature)

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and add your Firebase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Firebase project details:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## GitHub Pages CI/CD

The repository includes `.github/workflows/deploy-pages.yml`. A push to `main`
installs dependencies with Node 20, runs the production build, and deploys
`dist/` to GitHub Pages. The workflow supplies the repository base path so the
Vite assets and service worker work at the project Pages URL.

Enable GitHub Pages in the repository settings with **Source: GitHub Actions**.
After the first successful deployment, the workflow displays the published URL.

## How It Works

### Architecture

1. **Authentication**: Users can sign in with Google for cloud sync, or use offline-only mode
2. **Local Storage**: Tasks are stored in IndexedDB immediately for instant feedback
3. **Offline Support**: Full app functionality without internet connection
4. **Sync Queue**: When online, tasks are sent to Firebase Firestore
5. **Automatic Retry**: Failed syncs are queued for retry
6. **Local privacy**: Offline-only data remains local; Google profile identity is used for cloud ownership

### Data Flow

```
User Input
    ↓
IndexedDB (Immediate)
    ↓
UI Update (Instant)
    ↓
Online? → YES → Firebase Sync → Mark as Synced
    ↓ NO
Queue for Later → Connection Restored → Retry Sync
```

### Data Structure

Each task contains:

```typescript
{
  id: string          // UUID for local tracking
  uuid: string        // UUID for cloud sync
  text: string        // Task description
  timestamp: number   // When the task was completed
  userToken: string   // Random token (no personal info)
  synced: boolean     // Sync status
  syncedAt?: number   // Last sync time
}
```

## Component Structure

```
src/
├── components/
│   ├── MainScreen.vue       # Task list and input form
│   ├── AuthDialog.vue       # Auth entry point
│   └── SettingsDialog.vue   # User settings and logout
├── composables/
│   ├── useAuth.ts           # Auth state and token management
│   ├── useTasks.ts          # IndexedDB task operations
│   ├── useSyncManager.ts    # Sync orchestration and status
│   ├── useFirebase.ts       # Firebase Firestore integration
│   └── useOnlineStatus.ts   # Online/offline detection
├── types/
│   └── index.ts             # TypeScript interfaces
├── assets/
│   └── app.css              # Component-specific styles
├── App.vue                  # Root component
├── main.ts                  # Entry point
└── style.css                # Global styles
```

## UI Elements (data-label attributes)

For easy reference in future discussions, major UI elements are labeled:

- `data-label="main-section"` — Main application section
- `data-label="app-container"` — App container wrapper
- `data-label="card-wrapper"` — Main card/box element
- `data-label="header"` — Top header with controls
- `data-label="app-title"` — App title text
- `data-label="header-controls"` — Buttons and indicators in header
- `data-label="offline-indicator"` — Offline status badge
- `data-label="pending-count-indicator"` — Pending sync count
- `data-label="settings-button"` — Settings button
- `data-label="main-content"` — Main screen content area
- `data-label="task-input-group"` — Task input container
- `data-label="task-input-field"` — Text input for new tasks
- `data-label="add-task-button"` — Button to add task
- `data-label="task-list"` — List container
- `data-label="task-item-{id}"` — Individual task item
- `data-label="task-text"` — Task text content
- `data-label="task-meta"` — Task metadata (date, status)
- `data-label="task-pending-badge"` — Pending sync badge
- `data-label="task-synced-badge"` — Synced status badge
- `data-label="empty-state"` — Empty state message

## Firebase Setup

Google sign-in must be enabled in Firebase Authentication before using the
Google login option. Deploy `firestore.rules` with the Firebase CLI so synced
tasks are limited to the authenticated user's Firebase UID:

```bash
firebase deploy --only firestore:rules
```

### Firestore Collection

Create a `tasks` collection in Firebase Firestore.

### Security Rules

The repository includes authenticated rules in `firestore.rules`. Do not use
public read/write rules in production.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read: if request.auth != null
        && resource.data.userToken == request.auth.uid;
      allow create, update: if request.auth != null
        && request.resource.data.userToken == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.userToken == request.auth.uid;
    }
  }
}
```

### Firestore Document Structure

Tasks are stored with this structure:

```
tasks/
└── {documentId}/
    ├── uuid: string
    ├── text: string
    ├── timestamp: number
    ├── userToken: string
    └── createdAt: Timestamp
```

## Privacy & Security

This app is designed with **privacy-first** principles:

- ✅ Offline-only mode does not require an account
- ✅ Google accounts are used only when cloud sync is selected
- ✅ Synced tasks are scoped to the authenticated Firebase user
- ✅ Tasks linked only to these tokens
- ✅ No analytics or tracking
- ✅ No third-party scripts
- ✅ All data can be deleted by clearing browser storage
- ✅ Firestore rules require Firebase authentication

## Development Notes

### Service Worker

The app uses Vite PWA plugin which automatically generates:
- Service worker for offline support
- Web manifest for PWA installation
- Workbox caching strategies

### Composable Pattern

All business logic is organized in composables for reusability:
- `useAuth()` - Authentication and user management
- `useTasks()` - IndexedDB operations
- `useSyncManager()` - Sync coordination
- `useFirebase()` - Firebase integration
- `useOnlineStatus()` - Network status tracking

### Offline Handling

- Tasks are saved to IndexedDB immediately
- UI updates instantly regardless of network status
- When online, sync manager automatically sends pending tasks
- Connection status is displayed to user
- Pending count shows how many tasks need syncing

## Troubleshooting

### App not syncing to Firebase

1. Check `.env.local` has correct Firebase credentials
2. Verify Firestore database exists and is accessible
3. Check browser console for errors
4. Ensure you're online (check offline indicator)

### Tasks not appearing after refresh

1. IndexedDB may be disabled — check browser settings
2. Private/Incognito mode might not support IndexedDB
3. Storage quota may be exceeded — clear some tasks

### Service Worker issues

1. Clear browser cache and reload
2. Unregister old service workers in DevTools
3. Try in a new private window

## License

MIT

## Future Enhancements

- [ ] Photo attachments for tasks
- [ ] Task categories and tags
- [ ] Search and filtering
- [ ] Recurring maintenance tasks
- [ ] Export data as CSV
- [ ] Multi-device sync with personal auth

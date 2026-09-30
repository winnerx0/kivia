# Kivia Frontend

Dashboard for the Kivia API observability platform. View projects, manage API keys, and browse request logs with filtering and pagination.

## Tech Stack

| Category         | Technology                                  |
| ---------------- | ------------------------------------------- |
| Framework        | React 19, Vite, React Router                 |
| Language         | TypeScript, React 19                        |
| Styling          | Tailwind CSS 4 (oklch color space)          |
| Components       | shadcn/ui (base-nova style)                 |
| State            | React Query v5 (@tanstack/react-query)      |
| Forms            | React Hook Form + Zod                       |
| Icons            | Lucide React                                |
| Notifications    | Sonner                                      |
| Fonts            | Roboto, JetBrains Mono                      |

## Getting Started

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8080` (see root README)

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Scripts

```bash
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview the production build
npm run lint    # ESLint
```

## Pages

| Route              | Description                                      | Guard     |
| ------------------ | ------------------------------------------------ | --------- |
| /                  | Landing page                                     | Public    |
| /login             | Login form                                       | Guest     |
| /register          | Registration form                                | Guest     |
| /dashboard         | Overview with stats and recent projects           | Auth      |
| /projects          | Project list with create dialog                  | Auth      |
| /projects/[id]     | Project detail — API keys tab and logs tab        | Auth      |

- **AuthGuard** — Redirects unauthenticated users to `/login`
- **GuestGuard** — Redirects authenticated users to `/dashboard`

## Project Structure

```
src/
├── main.tsx                    # Browser entry point and app providers
├── App.tsx                     # React Router route tree
├── app/                        # Page components
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── (app)/                  # Protected page components
├── components/
│   ├── AuthGuard.tsx
│   ├── GuestGuard.tsx
│   ├── QueryProvider.tsx
│   ├── AppSidebar.tsx
│   └── ui/                     # shadcn/ui components
└── lib/
    ├── api.ts                  # API client with token refresh
    ├── auth.ts                 # Token storage helpers
    └── utils.ts                # cn() utility
```

## API Client

The API client in `lib/api.ts` handles:

- **Bearer token injection** from localStorage on every request
- **Automatic token refresh** on 401 responses with race condition protection (single shared refresh promise)
- **Redirect to /login** when refresh fails

## Configuration

Set `VITE_BACKEND_URL` in `.env` to point at the backend. It defaults to `http://localhost:80` when unset.

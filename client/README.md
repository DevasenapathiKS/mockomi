## Mockomi Client

Production-ready App Router frontend for the interview readiness stack. It provides:

- JWT-based auth with React Context and Axios interceptors
- Candidate dashboard with sessions, readiness scoring, and progress analytics
- Interviewer marketplace with filtering, slot selection, and Razorpay checkout
- ChamCall iframe join flow with secure join tokens and countdowns
- Session rating workflow, toast-based feedback, and global loading indicators

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4 (inline theme)
- Axios with global interceptors
- React Context for auth + global providers
- Razorpay web SDK & ChamCall postMessage bridge
- dayjs, lucide-react, react-hot-toast for UX polish

## Environment

Create `client/.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
# Optional override. Falls back to backend mediaBaseUrl from join-token response.
NEXT_PUBLIC_CHAMCALL_URL=https://media.example.com/embed
```

## Scripts

```bash
npm run dev      # start dev server on :3000
npm run build    # create production build
npm start        # run production build
npm run lint     # next lint
```

## API Contracts

All API traffic is routed to `NEXT_PUBLIC_API_URL` and uses the backend routes:

- Auth: `POST /api/auth/login`, `POST /api/auth/register`
- Interviewers: `GET /api/interviewers`, `GET /api/interviewers/:id/slots`
- Sessions: `GET /api/interviews`, `GET /api/interviews/:id`, `POST /api/sessions/:id/join-token`, `POST /api/sessions/:id/rate`
- Payments: `POST /api/payments/create-order`, `POST /api/payments/verify`
- Progress: `GET /api/progress/:candidateId/:roleProfileId`

Update the server URL or add additional routes only when the backend changes.

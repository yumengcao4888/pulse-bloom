# PulseBloom

<p align="center">
  <img src="app/icon.png" alt="PulseBloom icon" width="96" height="96" />
  <img src="public/default-healer.jpg" alt="Default healer avatar" width="96" height="96" />
</p>

PulseBloom is a gentle reflection tool for healers and space-holders. It helps you invite clients to reflect, view a soft snapshot of shared feelings, and share a healing space.

## Features

- Healer profiles and healing spaces
- Reflection collection and summaries
- Emotion and feeling analysis
- QR codes and shareable links
- Clerk authentication

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Prisma + Postgres
- Clerk

## Local Development

1) Install dependencies

```bash
pnpm install
```

2) Configure environment variables

Create `.env.local` with at least:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
```

3) Run the app

```bash
pnpm dev
```

## Scripts

- `pnpm dev` - Start the dev server
- `pnpm build` - Build for production
- `pnpm start` - Start the production server
- `pnpm lint` - Lint
- `pnpm format` - Check formatting
- `pnpm format:write` - Write formatting

## Deployment

Deploy on Vercel and set the same environment variables as `.env.local`. If you use Clerk webhooks, add the webhook endpoint:

`https://<your-domain>/api/clerk/webhook`

## Acknowledgements

This project was initially bootstrapped using the Precedent template by Steven Tey.
The template provided a solid technical foundation during early development.

# PulseBloom <img src="app/icon.png" alt="PulseBloom icon" width="28" height="28" />

PulseBloom is a gentle reflection tool for healers and space-holders. It helps you invite clients to reflect, view a soft snapshot of shared feelings, and share a healing space.

## Features

- Healer profiles and healing spaces
- Reflection collection and summaries
- Emotion and feeling analysis
- QR codes and shareable links
- Clerk authentication

## Tech Stack

- [Next.js App Router](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Postgres](https://www.postgresql.org/)
- [Clerk](https://clerk.com/)

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

This project was initially bootstrapped using the [Precedent](https://github.com/steven-tey/precedent) template by [Steven Tey](https://github.com/steven-tey).
The template provided a solid technical foundation during early development.

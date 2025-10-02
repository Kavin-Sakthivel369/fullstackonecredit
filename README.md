# Construction Workforce Hiring Platform

This monorepo contains a backend (`server`) and a frontend (`web`). Open the folder in Visual Studio Code to develop.

## Getting started

1. Backend
   - Copy `.env` from `server/.env` (already created) and adjust `JWT_SECRET` if needed
   - Install deps: `cd server && npm install`
   - DB + Prisma: `npm run prisma:generate` and `npm run prisma:migrate`
   - Seed sample data: `npm run prisma:seed`
   - Run dev server: `npm run dev` (listens on http://localhost:4000)

2. Frontend
   - `cd web && npm install`
   - Create `.env` with `VITE_API_BASE_URL=http://localhost:4000/api`
   - `npm run dev` and open http://localhost:5173

Sample accounts (seed):
- owner@example.com / password123
- worker@example.com / password123
- broker@example.com / password123

## Features
- Auth (register/login) with roles: OWNER, WORKER, BROKER
- Jobs CRUD (create as owner, list for all)
- Applications (workers apply to jobs)
- Brokerage (owners assign broker)
- Messages per job
- React + Tailwind UI

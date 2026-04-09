# Finance SaaS Monorepo

Production-oriented starter monorepo for a Finance SaaS application using Express, React + Vite, and MySQL.

## Structure

- `backend/` Express API with Sequelize + MySQL
- `frontend/` React + Vite client
- `docker-compose.yml` Local orchestration for MySQL, backend, frontend, and Nginx
- `nginx/nginx.conf` Reverse proxy config

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` if you want to customize local values.
3. Run locally:
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```
4. Or run with Docker:
   ```bash
   docker compose up --build
   ```

## Backend endpoints

- `GET /api`
- `GET /api/health`

## Database

Backend includes Sequelize CLI configuration, one sample migration, and one sample seeder.

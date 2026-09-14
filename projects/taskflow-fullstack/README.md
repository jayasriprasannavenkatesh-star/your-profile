# TaskFlow — Full-Stack Productivity App

A genuinely full-stack TaskFlow application built with **Node.js + Express + SQLite + JWT authentication + bcrypt + vanilla HTML/CSS/JavaScript**.

## What is real here?

- Account registration and login
- Password hashing with bcrypt
- JWT-based authenticated API requests
- User records stored in SQLite
- Tasks stored permanently in SQLite
- Each authenticated user can access only their own tasks
- Create, complete/undo, delete and refresh tasks
- Priority support: low, medium, high
- Responsive premium frontend
- Protected backend routes
- Environment variable support for the JWT secret

## Architecture

```text
Browser (HTML/CSS/JS)
        ↓ fetch()
Express REST API
        ↓
JWT authentication + bcrypt
        ↓
SQLite database
```

## Run locally

Requires Node.js 20+.

```bash
cd projects/taskflow-fullstack
npm install
```

Create `.env` from `.env.example` and set a strong `JWT_SECRET`. Then:

```bash
npm start
```

Open `http://localhost:3000`.

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Security notes

This is a portfolio-grade learning project, not a production security blueprint. Passwords are never stored in plaintext, task queries are scoped to the authenticated user, and secrets are kept outside source control. For production, add HTTPS, secure HttpOnly cookies, CSRF protection where applicable, rate limiting, stronger secret management, validation, logging, migrations and a managed database.

## Portfolio value

This project demonstrates the difference between a static frontend demo and a real application: **frontend + API + authentication + persistent database + authorization-aware CRUD**.

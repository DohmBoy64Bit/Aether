# Aether

A full-stack, AI-powered social and networking platform.

## Architecture

Aether is composed of several key components:

- **Frontend**: A Next.js (React) application built with TypeScript, Tailwind CSS, and Lucide Icons. It connects to the backend API to serve the user interface.
- **Backend**: A Node.js API server built with Express and TypeScript.
- **Database**: SQLite database managed with Prisma ORM.
- **AI Services**: Integrates with [Ollama](https://ollama.ai/) for local large language model inference.
- **Vector Database**: Uses ChromaDB for embedding storage and semantic search.
- **Search Engine**: Uses SearXNG as an open-source metasearch engine proxy.

## Prerequisites

To run Aether, ensure you have the following installed:

1. **Node.js** (v18 or higher recommended)
2. **Podman** or **Docker** desktop (for services like ChromaDB and SearXNG)
3. **Ollama** installed on your host machine to serve the language models

## Getting Started

### 1. Install Dependencies

First, you need to install the Node.js packages for both the frontend and backend.

```bash
# Install backend dependencies
cd backend
npm install

# Setup Prisma and database
npm run prisma:generate
npm run prisma:migrate

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Services

To launch the full stack, run the provided PowerShell script which will spin up the Podman containers, Ollama service, and the Node processes for the backend and frontend.

```bash
# Run the startup script (Windows/PowerShell)
.\start_services.ps1
```

This script will automatically:
1. Verify and start Podman
2. Run `podman compose up` for ChromaDB and SearXNG
3. Start the Ollama server (`ollama serve`)
4. Start the backend development server
5. Start the frontend Next.js development server

### 3. Accessing the Application

- **Frontend**: Typically runs on `http://localhost:3000`
- **Backend API**: Runs concurrently as configured
- **SearXNG**: Accessible on `http://localhost:8888`
- **ChromaDB**: Runs on `http://127.0.0.1:8000`

## Project Structure

```
├── backend/                # Express API Server, Prisma ORM, and AI Services
│   ├── prisma/             # Database schema and migrations
│   ├── src/                # Controllers, Routes, Services
│   └── uploads/            # Local media storage
├── frontend/               # Next.js Application
│   └── src/                # Components, Pages, Context, Hooks
├── searxng/                # SearXNG configuration (settings.yml)
├── docker-compose.yml      # Container orchestration for DB and Search
└── start_services.ps1      # Integrated launcher script
```

## Useful Commands

- `cd backend && npm run test` - Run backend tests (Vitest)
- `cd frontend && npm run build` - Build the Next.js frontend
- `cd frontend && npm run dev` - Start only the Next.js frontend

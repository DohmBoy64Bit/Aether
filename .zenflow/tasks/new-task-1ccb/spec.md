# Technical Specification - Project "Aether"

## 1. Technical Context
- **Runtime**: Node.js
- **Language**: TypeScript
- **Backend Framework**: Express.js
- **Frontend Framework**: Next.js with Tailwind CSS (based on `WebsiteReference/` design)
- **Database**: PostgreSQL (for structured data and persistence)
- **LLM Engine**: Ollama (local LLM support is a must)
- **Image Generation**: Local Stable Diffusion (via API) or DALL-E (optional, depends on user preference for "local-only")
- **Search API**: Tavily or Brave Search for AI real-world awareness

## 2. Implementation Approach
- **Modular Backend**: Separate services for `Auth`, `Social`, `AI`, and `Search`.
- **AI Persona Loop**: A background task that iterates through AI personas, deciding when to post, reply, or retweet based on their unique personality and current events.
- **Security**: 
    - JWT-based authentication for sessions.
    - Password hashing with `bcrypt`.
    - API rate limiting.
    - Input validation (e.g., `zod`).

## 3. Data Model (PostgreSQL)

### `users`
- `id` (UUID)
- `username` (String, Unique)
- `password_hash` (String)
- `is_ai` (Boolean)
- `created_at` (Timestamp)

### `personas` (AI only)
- `user_id` (UUID, Foreign Key)
- `personality` (Text/JSON)
- `interests` (JSON Array)
- `profile_image_generated` (Boolean, default: false)
- `last_active` (Timestamp)

### `recovery_codes` (Human only)
- `user_id` (UUID, Foreign Key)
- `code_hash` (String)
- `used` (Boolean, default: false)

### `posts`
- `id` (UUID)
- `user_id` (UUID, Foreign Key)
- `content` (Text)
- `type` (Enum: TWEET, REPLY, RETWEET)
- `parent_id` (UUID, Optional - for replies/retweets)
- `created_at` (Timestamp)

### `interactions`
- `id` (UUID)
- `user_id` (UUID, Foreign Key)
- `post_id` (UUID, Foreign Key)
- `type` (Enum: LIKE, RETWEET)

## 4. API Endpoints

### Auth
- `POST /api/auth/signup`: Create user, return JWT + 5 recovery codes.
- `POST /api/auth/login`: Authenticate username/password, return JWT.
- `POST /api/auth/recover`: Use recovery code to reset password.

### Social
- `GET /api/feed`: Get posts for the feed (Discover/Following).
- `POST /api/posts`: Create a new post.
- `GET /api/users/:username`: Get user profile.
- `PATCH /api/users/profile`: Update user profile (bio, image).
- `POST /api/posts/:id/interact`: Like/Retweet a post.

### AI (Internal)
- `POST /api/internal/ai/tick`: Trigger an AI persona to perform an action.

## 5. Delivery Phases

### Phase 1: Core Setup & Auth
- Initialize project with Express and Next.js.
- Implement PostgreSQL schema and migrations.
- Build signup/login with username/password and recovery codes.
- **Verification**: Unit tests for auth logic; API tests for signup/login flow.

### Phase 2: Social Core
- Implement posts, replies, likes, and retweets.
- Build the profile system.
- **Verification**: Integration tests for post creation and interaction.

### Phase 3: AI Persona Engine
- Integrate Ollama for persona generation and action logic.
- Implement the "Persona Generation" service (once-only profile image).
- Build the AI action loop (autonomous posting/replying).
- **Verification**: Unit tests for persona logic; end-to-end simulation of AI actions.

### Phase 4: Frontend (Design Match)
- Build the UI based on `WebsiteReference/` (Clean, modern, left/right sidebars).
- Connect frontend to the secure API.
- **Verification**: UI component tests; manual UX testing.

### Phase 5: Web Search & AI Moderation
- Integrate Search API for AI "current events" awareness, and based on there likes and preferences like for gaming news, game releases, sports etc not just current news events, the AI should have specific preferences and topics they like just like a real person
- Implement AI moderation service.
- **Verification**: Integration tests for search-based posting.

## 6. Verification Approach
- **Testing**: Use `Vitest` or `Jest` for unit tests. Use `Supertest` for API integration tests.
- **Linting**: `ESLint` and `Prettier` for code quality.
- **Type Checking**: `tsc` (TypeScript compiler) to ensure type safety.

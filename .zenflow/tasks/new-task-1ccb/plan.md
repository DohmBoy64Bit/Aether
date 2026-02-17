# Implementation Plan - Project "Aether"

## Configuration
- **Artifacts Path**: `.zenflow/tasks/new-task-1ccb`

---

## Workflow Steps

### [x] Step: Requirements
Create a Product Requirements Document (PRD) based on the feature description.

### [x] Step: Technical Specification
Create a technical specification based on the PRD.

### [x] Step: Planning
<!-- chat-id: 0217dd82-b814-4362-9a33-2cc83b626a9c -->
Create a detailed implementation plan based on `spec.md`.

## Implementation Tasks

### [x] Phase 1: Environment Setup & Core Auth
<!-- chat-id: c15578a7-c401-438e-b99c-fde35f923544 -->
- [x] Setup the project structure (Next.js frontend, Express.js backend, SQLite database).
- [x] Implement the database schema for Users, Recovery Codes, and Sessions.
- [x] Build the signup API endpoint (Username/Password + 5 recovery codes).
- [x] Build the login API endpoint (JWT).
- [x] Run unit tests for auth logic and integration tests for signup/login.

### [x] Phase 2: Social Core & Personas
<!-- chat-id: a65580f1-8669-4afe-b173-855a9b91a4e2 -->
- [x] Implement the `posts` and `interactions` database schema.
- [x] Build API endpoints for creating tweets, replying, and retweeting.
- [x] Build the profile retrieval API (Human and AI users).
- [x] Implement the `personas` database schema and persistence logic.
- [x] Verification: Run integration tests for post creation and interaction.

### [x] Phase 3: AI Engine & Ollama Integration
<!-- chat-id: 95e420f3-c60b-4651-b3d3-5e9e018409f8 -->
- [x] Setup the Ollama client and persona generation logic.
- [x] Build the AI Action Loop (background service to trigger AI acts).
- [x] Implement image generation for AI profiles (generated once).
- [x] Connect AI actions to the social API.
- [x] Verification: Verify AI personas can successfully post/reply via tests.

### [x] Phase 4: Frontend Development (Design Match)
<!-- chat-id: 7a320533-beec-4efc-aefa-28f348804596 -->
- [x] Build the layout (Sidebars + Feed) based on `WebsiteReference/`.
- [x] Implement the Login/Signup pages (including recovery code display).
- [x] Build the Feed, Profile, and Post-creation components.
- [x] Integrate frontend with the backend API.
- [x] Verification: Component testing and manual UI verification.

### [ ] Phase 5: Web Search & Moderation
- **Task**: Integrate Tavily or Brave Search for real-time persona awareness.
- **Task**: Implement the AI moderation service to monitor posts.
- **Verification**: Integration tests for search-based AI posting.

### [ ] Phase 6: Final Audit & Polish
- **Task**: Security audit (JWT checks, input validation).
- **Task**: Final bug fixes and UI polish.
- **Verification**: Run the full suite of unit and integration tests.

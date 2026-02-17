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
Create a detailed implementation plan based on `spec.md`.

## Implementation Tasks

### [ ] Phase 1: Environment Setup & Core Auth
- **Task**: Setup the project structure (Next.js frontend, Express.js backend, PostgreSQL database).
- **Task**: Implement the database schema for Users, Recovery Codes, and Sessions.
- **Task**: Build the signup API endpoint (Username/Password + 5 recovery codes).
- **Task**: Build the login API endpoint (JWT).
- **Verification**: Run unit tests for auth logic and integration tests for signup/login.

### [ ] Phase 2: Social Core & Personas
- **Task**: Implement the `posts` and `interactions` database schema.
- **Task**: Build API endpoints for creating tweets, replying, and retweeting.
- **Task**: Build the profile retrieval API (Human and AI users).
- **Task**: Implement the `personas` database schema and persistence logic.
- **Verification**: Run integration tests for post creation and interaction.

### [ ] Phase 3: AI Engine & Ollama Integration
- **Task**: Setup the Ollama client and persona generation logic.
- **Task**: Build the AI Action Loop (background service to trigger AI acts).
- **Task**: Implement image generation for AI profiles (generated once).
- **Task**: Connect AI actions to the social API.
- **Verification**: Verify AI personas can successfully post/reply via tests.

### [ ] Phase 4: Frontend Development (Design Match)
- **Task**: Build the layout (Sidebars + Feed) based on `WebsiteReference/`.
- **Task**: Implement the Login/Signup pages (including recovery code display).
- **Task**: Build the Feed, Profile, and Post-creation components.
- **Task**: Integrate frontend with the backend API.
- **Verification**: Component testing and manual UI verification.

### [ ] Phase 5: Web Search & Moderation
- **Task**: Integrate Tavily or Brave Search for real-time persona awareness.
- **Task**: Implement the AI moderation service to monitor posts.
- **Verification**: Integration tests for search-based AI posting.

### [ ] Phase 6: Final Audit & Polish
- **Task**: Security audit (JWT checks, input validation).
- **Task**: Final bug fixes and UI polish.
- **Verification**: Run the full suite of unit and integration tests.

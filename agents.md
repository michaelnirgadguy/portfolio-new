# Agent Instructions

## Project Overview
This is a playful **Interactive Video Portfolio** for a video creator named Michael.
- **Key Feature:** The site features "Mimsy," a pompous hamster persona who chats with visitors.
- **Goal:** Showcase video work while entertaining users with the hamster character.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (utility-first)
- **AI:** OpenAI Node SDK (logic in `lib/llm`)

## Directory Structure
- `/app`: Pages & API routes (App Router).
- `/components`: UI components.
  - `/components/bubbles`: Chat message components.
- `/lib/llm`: AI persona logic, prompts, and tool definitions.
- `/types`: Shared TypeScript interfaces.

## Coding Conventions
- **Style:** Use Tailwind classes. Check `globals.css` for CSS variables (e.g., `var(--accent)`).
- **Components:** Functional components with strict TypeScript props.
- **Imports:** Use absolute path aliases (e.g., `@/components/...`).
- **Simplicity:** Prefer readable, simple code over complex abstractions.

## Core Behaviors
- **New Features:** Always check if a similar pattern exists in `/components` first.
- **Mimsy persona** avoid changing system prompts, synthetic messages, or any other instructions sent to "Mimsy" - unless necessary. Notify the user clearly of any such changes.

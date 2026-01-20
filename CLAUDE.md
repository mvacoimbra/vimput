# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vimput is a browser extension that allows users to edit any text input with Vim keybindings. Right-click on any input field to open a modal Vim-powered editor.

## Build Commands

```bash
# Development
pnpm run dev              # Start dev server for Chrome
pnpm run dev:firefox      # Start dev server for Firefox

# Production build
pnpm run build            # Build for Chrome
pnpm run build:firefox    # Build for Firefox

# Package for distribution
pnpm run zip              # Create Chrome extension zip
pnpm run zip:firefox      # Create Firefox extension zip

# Code quality
pnpm run lint             # Run Biome linter
pnpm run lint:fix         # Auto-fix lint issues
pnpm run format           # Check formatting
pnpm run format:fix       # Auto-fix formatting
pnpm run compile          # TypeScript type-check (no emit)
```

## Architecture

This is a WXT-based browser extension using React and TypeScript.

### Entry Points (`entrypoints/`)

- **background.ts** - Service worker that creates the context menu ("Edit with Vimput") and sends messages to content scripts when the menu item is clicked
- **content.tsx** - Content script injected into all pages. Tracks focused editable elements, listens for context menu messages, and renders the VimputEditor in a Shadow DOM for style isolation
- **popup/** - Extension popup UI showing settings and configuration (theme, font size, open-on-click behavior)

### Core Components

- **components/VimputEditor.tsx** - Main editor component. Handles rendering, syntax highlighting (via prism-react-renderer), drag/resize, and keyboard capture. Exposes a `requestClose` method via ref
- **lib/vimEngine.ts** - Pure TypeScript Vim emulator. Manages state machine for modes (normal, insert, visual, visual-line, command, replace-char, operator-pending). Exports `processKey()` for keystroke handling and `createInitialState()` for initialization

### State Management

- **stores/configStore.ts** - Zustand store for user preferences (theme, font size, syntax language). Syncs with `browser.storage.sync`
- **lib/themes.ts** - Theme definitions and color schemes. Maps to Prism themes for syntax highlighting

### UI Components

- **components/ui/** - shadcn/ui components (Radix primitives with Tailwind)
- **components/SettingsPanel.tsx** - Settings UI in popup
- **components/BuyMeCoffee.tsx** - Support link component

## Code Conventions

- Use camelCase for non-component files
- Use PascalCase for component files
- Prioritize Tailwind for CSS
- Path alias: `@/` maps to project root
- Use pnpm for package management

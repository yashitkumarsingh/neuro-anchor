---
name: neuro-anchor-architecture
description: Architecture blueprint and messaging protocol guidelines for Neuro-Anchor, detailing the integration between VS Code API, CLI workspace status monitoring, and local Ollama interfaces.
---

# 🏛 Neuro-Anchor Architectural Design System

This system enforces separation of concerns across the monorepo, keeping business logic decoupled from the IDE and CLI runtime environments.

---

## 📐 The Three-Tier Architecture

To achieve clean portability, the repository is split into three workspaces:

```
                  ┌──────────────────────┐
                  │   extension/         │ (VS Code Host)
                  └──────────┬───────────┘
                             │
                             ▼ (Uses local file link)
 ┌────────────────┐       ┌──────────────────────┐
 │   cli/         ├──────►│   core/              │ (Platform-Agnostic Engine)
 │ (CLI Utility)  │       └──────────────────────┘
 └────────────────┘
```

### 1. Platform-Agnostic Core (`@neuro-anchor/core`)
* **Role**: All LLM client queries, fallback heuristic parsing, and data typing.
* **Constraints**: 
  * ❌ **Must not** import `vscode` or any native CLI parsing utility.
  * ❌ **Must not** depend on global `fetch` (utilizes Node's native `http` module for compatibility).

### 2. VS Code Extension (`extension`)
* **Role**: Handles sidebar views, editor events, DND settings changes, and settings profile backups/restores.
* **Bridge**: Syncs user settings to `@neuro-anchor/core` configuration dynamically at runtime.

### 3. Command Line Interface (`cli`)
* **Role**: Resolves local Git states and triggers microtask compilers / PR translators in the terminal.

---

## ✉️ IPC Messaging Protocol (Webview ◄─► Host)

The VS Code Sidebar Webview and the Extension Host communicate using strict JSON messages:

```typescript
type IPCMessage =
  | { type: 'getInitialState' }
  | { type: 'initialState'; value: { diff: string; activeFile?: string; isDnd: boolean; profile: string; tasks: any[]; queue: string[] } }
  | { type: 'compileTicket'; text: string; mode: string }
  | { type: 'ticketCompiled'; value: any[] }
  | { type: 'updateTasks'; value: any[] }
  | { type: 'updateQueue'; value: any[] }
  | { type: 'executeCommand'; value: string }
  | { type: 'openFile'; value: string };
```

---

## 💡 Rules of Thumb

### 🚨 Rule 1: Command Whitelisting
All terminal execution requests must match the security whitelist:
```typescript
const WhitelistedCommands = [
  'npm test',
  'npm run compile',
  'npm run build',
  'git status',
  'git diff',
  'git diff --stat'
] as const;
```
If a command is not whitelisted, present a VS Code confirmation popup before spawning the terminal!

### ⏳ Rule 2: Shell Timeouts
All background shell queries (e.g. `git diff --stat`) must define a timeout limit to prevent hanging:
```typescript
exec('git diff --stat', { timeout: 3000 }, (err, stdout) => { ... });
```

### 💾 Rule 3: State Persistence
Every state change (task checkbox toggle, shield queue addition) must be backed up to `workspaceState` immediately. Restore state on the `getInitialState` call.

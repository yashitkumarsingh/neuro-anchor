# ⚓ Neuro-Anchor Developer Handbook & Companion Guide

Welcome to **Neuro-Anchor**—a cognitive accessibility support layer designed specifically for neurodivergent developers (ADHD, Autistic, Dyslexic, and others) who find vague project instructions, social feedback barriers, and frequent context switching overwhelming.

---

## 🎯 Purpose and Core Vision

Development environments are often built for linear, high-context thinkers. For engineers who navigate attention fluctuations, sensory processing preferences, or communication-related anxiety:
* **The "Blank Page" Paralysis**: High-level, vague tickets or Jira issues can cause starting anxiety because the brain gets overloaded trying to sequence tasks.
* **Interruption/Distraction Fragility**: Context switching destroys focus. Rebuilding the stack of "What was I doing?" takes significant energy.
* **Cryptic Feedback Friction**: Code reviews are sometimes passive-aggressive, ambiguous, or indirect, causing communication blockages and emotional fatigue.

**Neuro-Anchor** bridges these gaps by wrapping platform-agnostic heuristics and local LLMs (`Ollama`) in a simple command-line interface, a VS Code Extension, and a standalone browser dashboard companion.

---

## 🏛 monorepo Architecture Overview

Neuro-Anchor is built using a clean 3-tier workspace model to ensure portability and separation of concerns:

```
                      ┌──────────────────────┐
                      │   dashboard/         │ (Local Browser Companion)
                      └──────────┬───────────┘
                                 │
                                 ▼ (Uses local @neuro-anchor/core)
┌────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│   cli/         ├───►│   core/              │◄───┤   extension/         │
│ (CLI Utility)  │    │ (Shared Engine)      │    │ (VS Code Host)       │
└────────────────┘    └──────────────────────┘    └──────────────────────┘
```

1. **`@neuro-anchor/core`**: Platform-agnostic package hosting all Ollama connection routines, JSON formatting schema definitions, and local heuristics engines.
2. **`cli`**: The binary utility for running deconstructions, status restorers, and translation tasks directly in the shell terminal.
3. **`extension`**: The VS Code editor host providing sidebar integration, keyboard shortcuts, and theme override settings.
4. **`dashboard`**: The standalone visual companion application running locally in the web browser.

---

## ⚡ Setup & Installation

### Prerequisites
* **Node.js**: Version `v22.14.0` or greater is required.
* **Ollama**: To query local models, make sure [Ollama](https://ollama.com/) is installed and running with the `llama3` model pulled:
  ```bash
  ollama run llama3
  ```
  *(If Ollama is not running, the core engine automatically falls back to deterministic heuristic parsers so the application continues to run offline).*

### Workspace Bootstrapping
Install monorepo workspace dependencies:
```bash
npm install
```

To compile all workspaces:
```bash
npm run compile
```

---

## 🖥 The Standalone Web Dashboard (Browser Companion)

If you prefer a rich, distraction-free visual workspace over terminal commands or extension sidebars, the **Visual Companion Dashboard** is the perfect fit.

### Launching the Dashboard
From the root directory, start the Vite development server:
```bash
npm run dev --prefix dashboard
```
Then navigate to: `http://localhost:5173`

### Features Breakdown
1. **Sensor Profile Selection**:
   * **Standard**: Default settings.
   * **Focus**: Dynamically hides sidebar panels, minimaps, and unneeded details so only your immediate checklist is visible.
   * **Low Sensory**: Mutes distracting text shadows, contrast spikes, glows, and animations to minimize sensory drag.
   * **Debug**: Activates detailed status logs and recovery state indicators.
2. **Interruption Shield & Pomodoro Timer**:
   * Toggle **Do Not Disturb** to buffer system actions.
   * Runs an interactive SVG Pomodoro timer (25 minutes) to pace your work.
   * Provides a **Distraction Buffer Queue** textarea: if a distraction arises, type it in and hit "Add". It will be saved securely in the list to review *after* your focus block, keeping your working memory clear.
3. **Ticket compiler**:
   * Paste messy user stories, Jira logs, or vague feature descriptions.
   * Select a grain size (5-Minute steps, 15-Minute steps, Deep Work, Low Energy).
   * Compile to receive an actionable checklist complete with target files, estimated duration times, and single-click terminal launch buttons.
4. **Context Recovery Checkpoint**:
   * Click **Reconstruct Context Checkpoint** to query git revisions and command logs.
   * Formulaic output details: *What you were doing*, *your last useful state*, *modified files* (with single-click diff triggers), *next logical step*, and a *suggested next command*.
5. **PR Feedback Translator**:
   * Paste confusing, cryptically passive review remarks (e.g., *"Is there a reason this function executes asynchronously here?"*).
   * Receives an instant, plain-English explanation (*Reviewer is asking you to make it synchronous or document why it needs to run asynchronously*), an actionable task, and a polite suggested reply ready to copy to your clipboard.

---

## ⌨️ Command Line Interface (CLI) Reference

The CLI allows you to execute cognitive deconstruction right inside your terminal shell:

### Commands

#### 1. `neuro-anchor status`
Checks your current workspace diff status and suggests what next action to take to rebuild your mental model.
* **Example**:
  ```bash
  neuro-anchor status
  ```

#### 2. `neuro-anchor compile "<ticket_text>"`
Compiles ticket text into structured step-by-step microtasks.
* **Granularity mode options**: `--mode <5m | 15m | deep | low>`
* **Example**:
  ```bash
  neuro-anchor compile "Fix email notification signup validation checks" --mode 5m
  ```

#### 3. `neuro-anchor translate "<reviewer_comment>"`
Translates cryptic PR feedback into direct actionable tasks and copyable replies.
* **Example**:
  ```bash
  neuro-anchor translate "Not sure if this is the right place for validation logic..."
  ```

#### 4. `neuro-anchor shield <on|off>`
Toggles the notification block interruption buffer state.
* **Example**:
  ```bash
  neuro-anchor shield on
  ```

---

## 🛡 Security & Safety Guardrails
All executed shell commands trigger whitelisting checks. The following actions are secure and pre-approved:
* `npm run compile` / `npm run build`
* `npm test`
* `git status` / `git diff` / `git diff --stat`

If an unapproved command is triggered, the engine will intercept the process and alert you or raise a warning for manual confirmation.

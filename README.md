# ⚓ Neuro-Anchor

**Neuro-Anchor** is a local-first AI developer support layer designed for ADHD, autistic, dyslexic, AuDHD, and cognitively overloaded developers. 

It is a practical developer workflow layer that runs locally, respects code privacy, and reduces friction in starting work, recovering context, handling interruptions, understanding feedback, and minimizing IDE overload.

---

## 🚀 Killer Features

### 1. "What was I doing?" Context Recovery
Allows developers to seamlessly recover focus after meetings, distractions, context switches, or breaks.
* Automatically watches git status and modified files.
* Summarizes the last active state, the next logical action, and target terminal commands.
* Uses local LLMs to generate a cognitive restoration checkpoint.

### 2. Ticket-to-Microtask Compiler
Converts complex, long, or vague ticket descriptions into action items.
* Includes specialized cognitive pacing modes:
  * **5-Minute Mode**: Breaks work down into extremely small, low-friction microtasks.
  * **15-Minute Mode**: Standard developer task checklist.
  * **Deep-Work Mode**: Logical milestones.
  * **Low-Energy Mode**: Structured to prevent cognitive drag or analysis paralysis.
* Automatically suggests involved files, run commands, and verification checks.

### 3. PR Feedback Translator
Neurodivergent engineers often struggle with passive-aggressive, socially loaded, or indirect PR feedback.
* Translates vague comments (e.g., *"Not sure this is the right direction. Can we revisit?"*) into a structured:
  * **Likely Meaning**: Clear translation of intent.
  * **Actionable Next Step**: Direct refactoring or communication instructions.
  * **Suggested Reply**: Ready-to-copy polite and constructive reply template.

### 4. Interruption Shield
Provides a Do-Not-Disturb timer widget and distraction buffer.
* Toggles a active **DND mode**.
* Runs a countdown timer (e.g. 25-minute Pomodoro style progress circle).
* **Buffer Queue**: Provides an inputs block where the developer can quickly dump incoming messages or interruptions (*"Review Sam's PR"*, *"Read Slack notification"*), ensuring they don't break current context flow.

### 5. Cognitive-Load IDE Profiles
Provides layout controls to hide noisy editor components that cause sensory overload.
* **Focus Mode**: Hides minimap, activity bars, status bars, and breadcrumbs.
* **Low Sensory Mode**: Diminishes diagnostic warnings/squiggles, match brackets, parameter hints, and hover boxes.
* **Debug Mode**: Restores diagnostic overlays and full layout panels.
* **Standard Mode**: Restores original settings fully.

---

## 🛠 Project Layout

* `extension/`: VS Code extension containing the extension entry points, settings profile controls, and the glassmorphic sidebar companion dashboard.
* `cli/`: CLI utility tool matching features in the terminal.
* `.agents/skills/`: Custom agent-scoped skills documenting frontend patterns and architectural messaging protocols.

---

## ⚙️ Installation & Setup

### Requirements
* **Node.js**: `>= 22`
* **Local LLM (Ollama)**: Recommended but not required (defaults to `http://localhost:11434` running model `llama3`). A robust, heuristic-based offline engine runs as a fallback automatically if Ollama is unreachable.

### Install Workspaces Dependencies
At the workspace root directory:
```bash
npm run bootstrap
```

### Compile Workspaces
```bash
npm run compile
```

### Run the CLI Tool
You can invoke the compiled CLI tool locally:
```bash
node cli/dist/index.js status
node cli/dist/index.js compile "My Jira ticket description" --mode 5m
node cli/dist/index.js translate "Let's clean this up later."
node cli/dist/index.js shield on
```

To install the CLI globally on your system:
```bash
npm install -g ./cli
```

### Run VS Code Extension
1. Open this workspace `/Users/yashitkumarsingh/dev/neuro-anchor` in VS Code.
2. Open `extension/src/extension.ts`.
3. Press `F5` (or select **Run and Debug** -> **Launch Extension**).
4. In the new extension development host window, find the Anchor (`⚓`) icon in your Activity Bar.
5. Launch the companion sidebar dashboard!

---

## 🔒 Privacy-First Design
Neuro-Anchor is built local-first. By default, it communicates only with your local Ollama server. No code, diffs, comments, or inputs are uploaded to external clouds.

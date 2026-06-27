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

* `core/`: Platform-agnostic workspace containing shared models, heuristics, and configuration loaders.
* `cli/`: CLI utility tool matching features in the terminal, including keyboard-interactive menus and custom stdout formatting options.
* `extension/`: VS Code extension containing settings profile controls and the glassmorphic sidebar companion dashboard.
* `dashboard/`: Standalone Vite + TypeScript local companion browser dashboard running at `http://localhost:5173`.
* `.agents/`: Custom agent-scoped skills and style guidelines.

---

## ⚙️ Installation & Setup

### Requirements
* **Node.js**: `>= 22`
* **Local LLM (Ollama)**: Recommended but not required (defaults to `http://localhost:11434` running model `llama3`). A robust, heuristic-based offline engine runs as a fallback automatically if Ollama is unreachable.
* **Overrides File**: You can customize settings (Ollama URL/Model) by creating a `.neuro-anchor.json` file in the workspace root.

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
You can invoke the compiled CLI tool locally. Running it without commands launches the **ADHD-friendly keyboard-interactive menu**:
```bash
node cli/dist/index.js
```
For scripted pipelines (e.g. using `jq`), specify commands and format flags:
```bash
node cli/dist/index.js status --format json
node cli/dist/index.js compile "My Jira ticket description" --mode 5m --format markdown
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

### Run the Standalone Web Dashboard
To launch the visual companion dashboard in your web browser:
```bash
npm run dev --prefix dashboard
```
Then navigate to: **[http://localhost:5173](http://localhost:5173)**

---

## 📋 Completed Requirements Checklist

- [x] **Platform-Agnostic Core Workspace (`@neuro-anchor/core`)** for shared business logic and heuristics fallbacks.
- [x] **VS Code Extension Sidebar** supporting cognitive load profile toggles and webview-host IPC message loops.
- [x] **ADHD-Friendly CLI Utility** supporting direct and keyboard-interactive execution prompts.
- [x] **Standalone Browser Dashboard** displaying DND focus rings, Pomodoro timers, distraction buffers, and compilers.
- [x] **Automated Git Pre-commit Hooks** to scan for hardcoded secrets and validate TypeScript compilations.
- [x] **Permissive MIT Licensing** and detailed developer handbook documentation.
- [x] **Unit & E2E Integration Test Suite** running on Node 22 test runner.

---

## 🔮 The Grand Vision (Product Roadmap)

Neuro-Anchor aims to become a comprehensive cognitive accessibility operating system for developers:

### Phase 1: Deep Workspace Linking (Short-Term)
* **Web-to-IDE Deep Link**: Establish a WebSocket connection between the visual browser dashboard and the VS Code Extension host so that clicking on a compiled task file chip automatically focuses and opens the target file inside your active VS Code instance.
* **Visual Configuration Editor**: Build a settings screen in the web companion to visually manage `.neuro-anchor.json` parameters.

### Phase 2: OS-Level Shield Integrations (Mid-Term)
* **Notification Snoozing**: Hook the Interruption Shield into Slack, Discord, and OS notification systems to mute alerts during DND countdowns, releasing a "Focus Digest" only when the block completes.
* **Terminal Stream Integration**: Stream build/test execution outputs directly into the dashboard console panel with file watchers.

### Phase 3: Speech-To-Task Assistant (Long-Term)
* **Voice Distraction Buffering**: Integrate a quick-access voice assistant to let developers speak out distractions ("Snooze message from Sam") and automatically transcribe them to the buffer queue.
* **Profile Fine-Tuning**: Allow AI prompt fine-tuning tailored to specific neurotypes (ADHD task lists vs. Autistic high-context reviews).

---

## 🔒 Privacy-First Design
Neuro-Anchor is built local-first. By default, it communicates only with your local Ollama server. No code, diffs, comments, or inputs are uploaded to external clouds.

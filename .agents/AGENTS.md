# Agent Rules for Neuro-Anchor

## 🚨 Security & Secret Leak Prevention
* **NO Hardcoded Secrets**: Do not write, commit, or stage any hardcoded API keys, authorization tokens, client secrets, passwords, private keys, or credentials.
* **Environment Configuration**: Always retrieve sensitive configuration options (such as server endpoints, API tokens, or models) dynamically via environment variables (e.g. `process.env.NEURO_ANCHOR_URL`) with fallback defaults, ensuring that credentials are never checked into source files.
* **Pre-Commit Hook Validation**: The workspace is configured with a git pre-commit hook that automatically compiles typescript and scans staged changes for hardcoded secret assignments. Always ensure this hook remains active and verify any lines flagged by the secret scanner before committing.

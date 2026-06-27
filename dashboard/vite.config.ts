import { defineConfig } from 'vite';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { LocalAi, WhitelistedCommands } from '@neuro-anchor/core';

const STATE_FILE = path.join(__dirname, 'dashboard_state.json');

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveState(data: any) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function executeCommand(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const rootDir = path.join(__dirname, '..');
    exec(cmd, { cwd: rootDir, timeout: 5000 }, (err, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        code: err ? err.code || 1 : 0
      });
    });
  });
}

const apiPlugin = () => ({
  name: 'neuro-anchor-api-plugin',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/api')) {
        return next();
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const parts = req.url.split('?');
      const pathname = parts[0];

      try {
        if (pathname === '/api/initialState' && req.method === 'GET') {
          const rootDir = path.join(__dirname, '..');
          const gitDiff = await new Promise<string>((resolve) => {
            exec('git diff --stat', { cwd: rootDir, timeout: 3000 }, (_, stdout) => resolve(stdout || ''));
          });
          const gitStatus = await new Promise<string>((resolve) => {
            exec('git status --short', { cwd: rootDir, timeout: 3000 }, (_, stdout) => resolve(stdout || ''));
          });

          const saved = loadState();
          const responsePayload = {
            diff: gitDiff || gitStatus || 'Workspace is clean.',
            isDnd: saved.isDnd ?? false,
            profile: saved.profile ?? 'standard',
            tasks: saved.tasks ?? [],
            queue: saved.queue ?? []
          };
          res.end(JSON.stringify(responsePayload));
          return;
        }

        if (pathname === '/api/saveState' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', () => {
            const data = JSON.parse(body);
            saveState(data);
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        if (pathname === '/api/compile' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', async () => {
            const { text, mode } = JSON.parse(body);
            try {
              const tasks = await LocalAi.compileTicket(text, mode);
              res.end(JSON.stringify(tasks));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: (err as Error).message }));
            }
          });
          return;
        }

        if (pathname === '/api/translate' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', async () => {
            const { text } = JSON.parse(body);
            try {
              const translation = await LocalAi.translatePRFeedback(text);
              res.end(JSON.stringify(translation));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: (err as Error).message }));
            }
          });
          return;
        }

        if (pathname === '/api/status' && req.method === 'GET') {
          const rootDir = path.join(__dirname, '..');
          const gitDiff = await new Promise<string>((resolve) => {
            exec('git diff --stat', { cwd: rootDir, timeout: 3000 }, (_, stdout) => resolve(stdout || ''));
          });
          try {
            const checkpoint = await LocalAi.generateContextCheckpoint(gitDiff, [], '');
            res.end(JSON.stringify(checkpoint));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: (err as Error).message }));
          }
          return;
        }

        if (pathname === '/api/executeCommand' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', async () => {
            const { command } = JSON.parse(body);
            if (!WhitelistedCommands.includes(command)) {
              res.statusCode = 403;
              res.end(JSON.stringify({ error: `Command "${command}" is not whitelisted for safety.` }));
              return;
            }
            const result = await executeCommand(command);
            res.end(JSON.stringify(result));
          });
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    });
  }
});

export default defineConfig({
  plugins: [apiPlugin()],
  server: {
    port: 5173
  }
});

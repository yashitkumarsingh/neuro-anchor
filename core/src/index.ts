import * as http from 'http';
import * as url from 'url';

export interface Microtask {
  id: string;
  title: string;
  duration?: string;
  files?: string[];
  command?: string;
  verification?: string;
}

export interface PRTranslation {
  meaning: string;
  action: string;
  reply: string;
}

export interface ContextRecoveryState {
  workingOn: string;
  lastState: string;
  changedFiles: string[];
  nextStep: string;
  suggestedCommand: string;
}

export class LocalAi {
  public static config = {
    url: (typeof process !== 'undefined' && process.env && process.env.NEURO_ANCHOR_URL) || 'http://localhost:11434',
    model: (typeof process !== 'undefined' && process.env && process.env.NEURO_ANCHOR_MODEL) || 'llama3'
  };

  /**
   * Helper to perform HTTP JSON POST request against local Ollama API
   */
  private static async callOllama(prompt: string, systemMessage?: string): Promise<string> {
    const urlString = this.config.url;
    const model = this.config.model;

    const payload = JSON.stringify({
      model: model,
      messages: [
        ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: {
        temperature: 0.2
      }
    });

    return new Promise((resolve, reject) => {
      try {
        const fullUrl = `${urlString}/api/chat`;
        const parsedUrl = new url.URL(fullUrl);
        
        const req = http.request({
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 4000 // 4s timeout
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`HTTP error status: ${res.statusCode}`));
                return;
              }
              const parsed = JSON.parse(data);
              resolve(parsed.message?.content || '');
            } catch (e) {
              reject(e);
            }
          });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Connection timed out'));
        });
        req.write(payload);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Compiles ticket text into structured microtasks.
   */
  public static async compileTicket(ticketText: string, mode: string): Promise<Microtask[]> {
    const systemPrompt = `You are a cognitive accessibility support tool for neurodivergent developers (ADHD, Autistic, Dyslexic). 
You compile vague or overwhelming tickets into structured, small, actionable microtasks.
Return ONLY a valid JSON array of tasks matching this TypeScript structure: 
interface Microtask { id: string; title: string; duration?: string; files?: string[]; command?: string; verification?: string; }
Keep tasks very concrete and bite-sized according to the mode: '${mode}'. Do not write any markdown wrappers (no \`\`\`json), just the plain JSON list.`;

    const prompt = `Break down this ticket into microtasks. 
Mode: ${mode} (Low Energy = extremely micro-steps, Deep Work = larger logical units).
Ticket content:
${ticketText}`;

    try {
      const response = await this.callOllama(prompt, systemPrompt);
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as Microtask[];
    } catch (err) {
      console.warn('Ollama lookup failed, using fallback heuristic generator:', (err as Error).message);
      return this.heuristicCompileTicket(ticketText, mode);
    }
  }

  /**
   * Translates social PR feedback remarks.
   */
  public static async translatePRFeedback(feedbackText: string): Promise<PRTranslation> {
    const systemPrompt = `You are an accessibility communication translator for neurodivergent engineers who find vague, passive-aggressive, or indirect feedback overwhelming.
Deconstruct the comment and return a valid JSON object matching this structure:
{ "meaning": "Direct plain-language explanation of reviewer intent", "action": "Actionable development step, clear and concise", "reply": "Suggested professional reply that is constructive and polite" }
Return ONLY raw JSON. No wrappers, no intro text.`;

    try {
      const response = await this.callOllama(feedbackText, systemPrompt);
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as PRTranslation;
    } catch (err) {
      console.warn('Ollama translation failed, using fallback heuristics:', (err as Error).message);
      return this.heuristicTranslatePR(feedbackText);
    }
  }

  /**
   * Generates context restoration checkpoint note.
   */
  public static async generateContextCheckpoint(
    gitDiffSummary: string,
    lastCommands: string[],
    activeFile?: string
  ): Promise<ContextRecoveryState> {
    const systemPrompt = `You are a context recovery assistant for developers who get distracted or context-switched.
Generate a checkpoint object in valid JSON matching:
{ "workingOn": "Concise summary of target feature", "lastState": "What was the last state (e.g. failing test, modified file)", "changedFiles": ["file1", "file2"], "nextStep": "Likely next action", "suggestedCommand": "Terminal command to run next" }
Do not return any conversational text, only the raw JSON.`;

    const prompt = `Active File: ${activeFile || 'None'}
Git Diff Summary:
${gitDiffSummary}
Recent Terminal Commands:
${lastCommands.slice(-3).join('\n')}`;

    try {
      const response = await this.callOllama(prompt, systemPrompt);
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as ContextRecoveryState;
    } catch (err) {
      console.warn('Ollama context checkpoint failed, using fallback heuristics:', (err as Error).message);
      return this.heuristicContextCheckpoint(gitDiffSummary, lastCommands, activeFile);
    }
  }

  // --- HEURISTIC RUNNERS ---

  public static heuristicCompileTicket(ticketText: string, mode: string): Microtask[] {
    const titleClean = ticketText.split('\n')[0].substring(0, 80);
    const keywords = this.extractKeywords(ticketText);
    const files = keywords.map(kw => `src/${kw.charAt(0).toUpperCase() + kw.slice(1)}.ts`);
    if (files.length === 0) {
      files.push('src/index.ts');
    }

    const tasks: Microtask[] = [];
    const duration = mode === '5-minute' ? '5 min' : mode === '15-minute' ? '15 min' : '30 min';

    if (mode === '5-minute' || mode === 'low-energy') {
      tasks.push(
        {
          id: '1',
          title: `Locate main files (${files.join(', ')}) in explorer`,
          duration: '2 min',
          files: files,
          command: '',
          verification: 'Verify files are open and readable.'
        },
        {
          id: '2',
          title: `Write draft interface or signature for target functionality`,
          duration: duration,
          files: [files[0]],
          command: '',
          verification: 'Check for compiler/syntactic errors.'
        },
        {
          id: '3',
          title: `Add a basic mock return or dummy implementation`,
          duration: duration,
          files: [files[0]],
          command: 'npm run compile',
          verification: 'Ensure project compiles successfully.'
        },
        {
          id: '4',
          title: `Add test template covering base cases`,
          duration: '10 min',
          files: [`tests/${keywords[0] || 'index'}.test.ts`],
          command: 'npm test',
          verification: 'Verify that the test runs (and fails as expected).'
        },
        {
          id: '5',
          title: `Implement core logic to satisfy the mock cases`,
          duration: '15 min',
          files: [files[0]],
          command: 'npm test',
          verification: 'Verify that the test suite now passes.'
        }
      );
    } else {
      tasks.push(
        {
          id: '1',
          title: `Analyze file references and dependencies around: ${keywords.join(', ') || 'entrypoint'}`,
          duration: '15 min',
          files: files,
          verification: 'Verify understanding of existing code interactions.'
        },
        {
          id: '2',
          title: `Implement main logic for: ${titleClean}`,
          duration: '45 min',
          files: files,
          command: 'npm run build',
          verification: 'Verify zero type-checker errors.'
        },
        {
          id: '3',
          title: `Create comprehensive test cases`,
          duration: '30 min',
          files: [`tests/${keywords[0] || 'index'}.test.ts`],
          command: 'npm test',
          verification: 'Ensure all tests pass and coverage is adequate.'
        },
        {
          id: '4',
          title: `Format, lint, and prepare branch for submission`,
          duration: '10 min',
          files: files,
          command: 'git diff',
          verification: 'Review diff for accidental logs or leftovers.'
        }
      );
    }
    return tasks;
  }

  public static heuristicTranslatePR(feedbackText: string): PRTranslation {
    const feedbackLower = feedbackText.toLowerCase();
    
    if (feedbackLower.includes('direction') || feedbackLower.includes('revisit')) {
      return {
        meaning: 'The reviewer has concerns about the high-level architecture or approach, rather than minor code syntax.',
        action: 'Schedule a quick sync or comment back asking for specific guidance on their preferred architecture before coding further.',
        reply: 'Thanks for the feedback! Do you prefer a different architectural pattern here, or is there a specific design constraint I should address?'
      };
    }

    if (feedbackLower.includes('cleanup') || feedbackLower.includes('refactor') || feedbackLower.includes('messy')) {
      return {
        meaning: 'The code works, but violates local styling, naming conventions, or needs simpler structures.',
        action: 'Refactor code variables, extract long helper methods, and run the linter or formatter.',
        reply: 'Appreciate the catch. I will clean this section up, extract the helper functions, and simplify the flow.'
      };
    }

    if (feedbackLower.includes('performance') || feedbackLower.includes('slow') || feedbackLower.includes('allocate')) {
      return {
        meaning: 'There is a concern about redundant loops, excessive allocations, or network request overhead.',
        action: 'Review variables scope, cache computations where possible, and avoid multiple array iterations.',
        reply: 'Good point on efficiency. I will optimize the loop execution and cache the static values.'
      };
    }

    return {
      meaning: 'The reviewer is asking for adjustments or clarifications on this line to match codebase standards.',
      action: 'Read the specific line and see if there is an edge case, style deviation, or missing test.',
      reply: 'Thanks for reviewing! I will look into this block and adjust it to align with the rest of the file.'
    };
  }

  public static heuristicContextCheckpoint(
    gitDiffSummary: string,
    lastCommands: string[],
    activeFile?: string
  ): ContextRecoveryState {
    const changedFiles = gitDiffSummary
      ? gitDiffSummary.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.includes('diff --git'))
      : [];

    const activeFileName = activeFile ? activeFile.split('/').pop() || '' : '';
    const workingOn = activeFileName 
      ? `Working on files related to: ${activeFileName}` 
      : 'Modifying files in workspace';

    const lastState = changedFiles.length > 0 
      ? `Modified files locally: ${changedFiles.slice(0, 3).join(', ')}`
      : 'No current local git changes detected.';

    const nextStep = lastCommands.length > 0 
      ? `Resume work and review changes. Previous command executed: "${lastCommands[lastCommands.length - 1]}"`
      : 'Verify files are open and check build compile state.';

    let suggestedCommand = 'npm run compile';
    if (lastCommands.length > 0) {
      suggestedCommand = lastCommands[lastCommands.length - 1];
    } else if (changedFiles.some(f => f.includes('test'))) {
      suggestedCommand = 'npm test';
    }

    return {
      workingOn,
      lastState,
      changedFiles: changedFiles.slice(0, 5),
      nextStep,
      suggestedCommand
    };
  }

  private static extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'for', 'is', 'that', 'on', 'with', 'this', 'it', 'as', 'by', 'an', 'at']);
    const clean = text.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
    const words = clean.split(/\s+/);
    const counts: Record<string, number> = {};
    
    for (const w of words) {
      if (w.length > 3 && !commonWords.has(w)) {
        counts[w] = (counts[w] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  }
}

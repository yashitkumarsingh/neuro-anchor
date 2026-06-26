import './style.css';

// TypeScript interfaces for type safety
interface Microtask {
  id: string;
  title: string;
  duration?: string;
  files?: string[];
  command?: string;
  verification?: string;
  completed?: boolean;
}

interface PRTranslation {
  meaning: string;
  action: string;
  reply: string;
}

interface ContextCheckpoint {
  workingOn: string;
  lastState: string;
  changedFiles: string[];
  nextStep: string;
  suggestedCommand: string;
}

interface DashboardState {
  profile: string;
  isDnd: boolean;
  timerSeconds: number;
  laterQueue: string[];
  tasks: Microtask[];
  suggestedCommand: string;
}

// Global UI State
const state: DashboardState = {
  profile: 'standard',
  isDnd: false,
  timerSeconds: 25 * 60,
  laterQueue: [],
  tasks: [],
  suggestedCommand: ''
};

let timerInterval: number | null = null;

// DOM Elements
const loader = document.getElementById('loader') as HTMLDivElement;
const loaderText = document.getElementById('loader-text') as HTMLSpanElement;

const profileStandard = document.getElementById('profile-standard') as HTMLDivElement;
const profileFocus = document.getElementById('profile-focus') as HTMLDivElement;
const profileLowSensory = document.getElementById('profile-low-sensory') as HTMLDivElement;
const profileDebug = document.getElementById('profile-debug') as HTMLDivElement;
const activeProfileBadge = document.getElementById('active-profile-badge') as HTMLDivElement;

const dndSwitch = document.getElementById('dnd-switch') as HTMLInputElement;
const shieldBadge = document.getElementById('shield-badge') as HTMLDivElement;
const shieldStatusText = document.getElementById('shield-status-text') as HTMLDivElement;
const dndTimerPanel = document.getElementById('dnd-timer-panel') as HTMLDivElement;
const timerText = document.getElementById('timer-text') as HTMLDivElement;
const timerProgress = document.getElementById('timer-progress') as any;
const timerResetBtn = document.getElementById('timer-reset-btn') as HTMLButtonElement;

const queueInput = document.getElementById('queue-input') as HTMLTextAreaElement;
const queueAddBtn = document.getElementById('queue-add-btn') as HTMLButtonElement;
const queueList = document.getElementById('queue-list') as HTMLDivElement;

const quickCmdButtons = document.querySelectorAll('.quick-cmd');
const consoleOutputBox = document.getElementById('console-output-box') as HTMLDivElement;
const consoleOutput = document.getElementById('console-output') as HTMLPreElement;

const ticketInput = document.getElementById('ticket-input') as HTMLTextAreaElement;
const modeSelect = document.getElementById('mode-select') as HTMLSelectElement;
const compileBtn = document.getElementById('compile-btn') as HTMLButtonElement;
const tasksOutputPanel = document.getElementById('tasks-output-panel') as HTMLDivElement;
const tasksPlaylist = document.getElementById('tasks-playlist') as HTMLDivElement;

const checkpointBtn = document.getElementById('checkpoint-btn') as HTMLButtonElement;
const checkpointDisplay = document.getElementById('checkpoint-display') as HTMLDivElement;
const checkpointWorking = document.getElementById('checkpoint-working') as HTMLDivElement;
const checkpointState = document.getElementById('checkpoint-state') as HTMLDivElement;
const checkpointFiles = document.getElementById('checkpoint-files') as HTMLDivElement;
const checkpointNext = document.getElementById('checkpoint-next') as HTMLDivElement;
const checkpointCmd = document.getElementById('checkpoint-cmd') as HTMLSpanElement;
const suggestedCmdBox = document.getElementById('suggested-cmd-box') as HTMLDivElement;

const prInput = document.getElementById('pr-input') as HTMLTextAreaElement;
const translateBtn = document.getElementById('translate-btn') as HTMLButtonElement;
const prOutput = document.getElementById('pr-output') as HTMLDivElement;
const prMeaning = document.getElementById('pr-meaning') as HTMLDivElement;
const prAction = document.getElementById('pr-action') as HTMLDivElement;
const prReply = document.getElementById('pr-reply') as HTMLDivElement;
const copyReplyBadge = document.getElementById('copy-reply-badge') as HTMLSpanElement;

const helpBtn = document.getElementById('help-btn') as HTMLButtonElement;
const closeHelpBtn = document.getElementById('close-help-btn') as HTMLButtonElement;
const helpModal = document.getElementById('help-modal') as HTMLDivElement;
const modalBackdrop = document.getElementById('modal-backdrop') as HTMLDivElement;

// Helper - Load state from server or localStorage
async function init() {
  showLoader('Bootstrapping companion workspace state...');
  try {
    const res = await fetch('/api/initialState');
    if (res.ok) {
      const data = await res.json();
      state.isDnd = data.isDnd;
      state.profile = data.profile;
      state.tasks = data.tasks;
      state.laterQueue = data.queue;

      // Sync inputs
      dndSwitch.checked = state.isDnd;
      applyDndUI(state.isDnd);
      applyProfile(state.profile);
      renderQueue();
      renderTasks();
    }
  } catch (err) {
    console.error('Failed to load initial state from server, falling back to local:', err);
    // Local fallback
    const saved = localStorage.getItem('neuro_anchor_dashboard_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.isDnd = parsed.isDnd ?? false;
      state.profile = parsed.profile ?? 'standard';
      state.tasks = parsed.tasks ?? [];
      state.laterQueue = parsed.queue ?? [];
      
      dndSwitch.checked = state.isDnd;
      applyDndUI(state.isDnd);
      applyProfile(state.profile);
      renderQueue();
      renderTasks();
    }
  } finally {
    hideLoader();
  }
}

// Helper - Save state to server & localStorage
async function persistState() {
  const payload = {
    isDnd: state.isDnd,
    profile: state.profile,
    tasks: state.tasks,
    queue: state.laterQueue
  };
  localStorage.setItem('neuro_anchor_dashboard_state', JSON.stringify(payload));
  try {
    await fetch('/api/saveState', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Failed to sync state to server:', err);
  }
}

// Loader UI Helpers
function showLoader(message: string) {
  loaderText.innerText = message;
  loader.style.display = 'flex';
}

function hideLoader() {
  loader.style.display = 'none';
}

// Profile Application & Styles
function applyProfile(profileName: string) {
  state.profile = profileName;
  activeProfileBadge.innerText = `${profileName.toUpperCase()} MODE`;

  // Reset visual overrides
  document.body.className = '';
  profileStandard.classList.remove('active');
  profileFocus.classList.remove('active');
  profileLowSensory.classList.remove('active');
  profileDebug.classList.remove('active');

  // Activate card
  const card = document.getElementById(`profile-${profileName}`);
  if (card) card.classList.add('active');

  // Trigger CSS class modifications
  if (profileName === 'focus') {
    document.body.classList.add('profile-focus');
    activeProfileBadge.style.background = 'rgba(139, 92, 246, 0.15)';
    activeProfileBadge.style.color = 'var(--color-primary)';
  } else if (profileName === 'low-sensory') {
    document.body.classList.add('profile-low-sensory');
    activeProfileBadge.style.background = 'rgba(16, 185, 129, 0.15)';
    activeProfileBadge.style.color = 'var(--color-success)';
  } else if (profileName === 'debug') {
    activeProfileBadge.style.background = 'rgba(245, 158, 11, 0.15)';
    activeProfileBadge.style.color = 'var(--color-warning)';
  } else {
    activeProfileBadge.style.background = 'rgba(6, 182, 212, 0.15)';
    activeProfileBadge.style.color = 'var(--color-secondary)';
  }
}

// DND UI Helpers
function applyDndUI(active: boolean) {
  state.isDnd = active;
  if (active) {
    shieldBadge.classList.add('active');
    shieldStatusText.innerText = 'Shield active. Non-urgent tasks queued.';
    dndTimerPanel.style.display = 'block';
    startTimer();
  } else {
    shieldBadge.classList.remove('active');
    shieldStatusText.innerText = 'Buffer notifications & queue inputs';
    dndTimerPanel.style.display = 'none';
    stopTimer();
  }
}

// Pomodoro Focus Timer Countdown
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  state.timerSeconds = 25 * 60;
  updateTimerUI();

  timerInterval = window.setInterval(() => {
    if (state.timerSeconds > 0) {
      state.timerSeconds--;
      updateTimerUI();
    } else {
      stopTimer();
      alert('Focus session completed! Time to take a breather.');
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerUI() {
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  timerText.innerText = formatted;

  // 169 is SVG circle circumference for CX=30 CY=30 R=27
  const total = 25 * 60;
  const progress = (state.timerSeconds / total) * 169;
  timerProgress.style.strokeDashoffset = (169 - progress).toString();
}

// Distraction Buffer Queue Renderer
function renderQueue() {
  queueList.innerHTML = '';
  state.laterQueue.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'queue-item';
    div.innerHTML = `
      <span>${item}</span>
      <span class="queue-remove" data-index="${index}">✕</span>
    `;
    queueList.appendChild(div);
  });

  // Attach delete handlers
  document.querySelectorAll('.queue-remove').forEach((el) => {
    el.addEventListener('click', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      state.laterQueue.splice(idx, 1);
      renderQueue();
      persistState();
    });
  });
}

// Microtask Checklist Playlist Renderer
function renderTasks() {
  tasksPlaylist.innerHTML = '';
  
  if (state.tasks.length === 0) {
    tasksPlaylist.innerHTML = '<div style="color:var(--text-muted); font-style:italic;">No tasks generated yet. Paste a ticket description and press compile.</div>';
    tasksOutputPanel.style.display = 'none';
    return;
  }

  state.tasks.forEach((task, index) => {
    const item = document.createElement('div');
    item.className = `task-card ${task.completed ? 'completed' : ''}`;

    let durationTag = '';
    if (task.duration) {
      durationTag = `<span class="task-duration">⏱ ${task.duration}</span>`;
    }

    let fileChips = '';
    if (task.files && task.files.length > 0) {
      task.files.forEach(f => {
        fileChips += `<span class="file-chip run-diff" data-file="${f}">${f}</span>`;
      });
    }

    let actionBtn = '';
    if (task.command) {
      actionBtn = `
        <button class="task-run-btn trigger-exec" data-cmd="${task.command}">
          <span>▶ Run:</span>
          <code>${task.command}</code>
        </button>
      `;
    }

    item.innerHTML = `
      <div class="task-checkbox-wrap">
        <input type="checkbox" class="task-checkbox toggle-task" data-index="${index}" ${task.completed ? 'checked' : ''}>
      </div>
      <div class="task-content">
        <div class="task-heading">${task.title}</div>
        ${task.verification ? `<div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Verify: ${task.verification}</div>` : ''}
        <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px;">
          ${durationTag}
          ${fileChips}
        </div>
        ${actionBtn}
      </div>
    `;

    tasksPlaylist.appendChild(item);
  });

  // Attach task checkbox toggles
  document.querySelectorAll('.toggle-task').forEach((el) => {
    el.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLInputElement).getAttribute('data-index') || '0');
      state.tasks[idx].completed = (e.target as HTMLInputElement).checked;
      renderTasks();
      persistState();
    });
  });

  // Attach trigger command actions
  document.querySelectorAll('.trigger-exec').forEach((el) => {
    el.addEventListener('click', async (e) => {
      const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd') || '';
      await runLocalCommand(cmd);
    });
  });

  // Attach run diff on file chip click
  document.querySelectorAll('.run-diff').forEach((el) => {
    el.addEventListener('click', async (e) => {
      const file = (e.target as HTMLElement).getAttribute('data-file') || '';
      consoleOutputBox.style.display = 'block';
      consoleOutput.innerText = `Analyzing diff for file: ${file}...\n`;
      try {
        const res = await fetch('/api/executeCommand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'git diff' })
        });
        if (res.ok) {
          const data = await res.json();
          // Filter diff stdout to lines containing the filename to mimic file diff
          const fullDiff = data.stdout || '';
          if (fullDiff) {
            consoleOutput.innerText = fullDiff;
          } else {
            consoleOutput.innerText = `No uncommitted git modifications detected for: ${file}`;
          }
        }
      } catch (err) {
        consoleOutput.innerText += `Error executing git diff: ${(err as Error).message}`;
      }
    });
  });

  tasksOutputPanel.style.display = 'block';
}

// Local command runner
async function runLocalCommand(cmd: string) {
  consoleOutputBox.style.display = 'block';
  consoleOutput.innerText = `Executing: ${cmd}...\n`;
  consoleOutput.scrollIntoView({ behavior: 'smooth' });

  try {
    const res = await fetch('/api/executeCommand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd })
    });
    const data = await res.json();
    if (res.ok) {
      consoleOutput.innerText = data.stdout || 'Command succeeded with no output.';
      if (data.stderr) {
        consoleOutput.innerText += `\nError logs:\n${data.stderr}`;
      }
    } else {
      consoleOutput.innerText = `Error: ${data.error || 'Failed to run command.'}`;
    }
  } catch (err) {
    consoleOutput.innerText = `Request error: ${(err as Error).message}`;
  }
}

// Event Listeners Configuration
function setupEventListeners() {
  // Profiles Grid click listeners
  const setupProfileClick = (el: HTMLDivElement, name: string) => {
    el.addEventListener('click', () => {
      applyProfile(name);
      persistState();
    });
  };
  setupProfileClick(profileStandard, 'standard');
  setupProfileClick(profileFocus, 'focus');
  setupProfileClick(profileLowSensory, 'low-sensory');
  setupProfileClick(profileDebug, 'debug');

  // Interruption Shield Switch
  dndSwitch.addEventListener('change', () => {
    applyDndUI(dndSwitch.checked);
    persistState();
  });

  timerResetBtn.addEventListener('click', () => {
    startTimer();
  });

  // Distraction Queue Add action
  queueAddBtn.addEventListener('click', () => {
    const text = queueInput.value.trim();
    if (!text) return;
    state.laterQueue.push(text);
    queueInput.value = '';
    renderQueue();
    persistState();
  });

  queueInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      queueAddBtn.click();
    }
  });

  // Quick Command action triggers
  quickCmdButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const cmd = (e.target as HTMLButtonElement).getAttribute('data-cmd') || '';
      runLocalCommand(cmd);
    });
  });

  // Help Guide Modal triggers
  helpBtn.addEventListener('click', () => {
    helpModal.style.display = 'block';
    modalBackdrop.style.display = 'block';
  });

  const closeHelp = () => {
    helpModal.style.display = 'none';
    modalBackdrop.style.display = 'none';
  };
  closeHelpBtn.addEventListener('click', closeHelp);
  modalBackdrop.addEventListener('click', closeHelp);

  // Ticket Compiler execution
  compileBtn.addEventListener('click', async () => {
    const ticketText = ticketInput.value.trim();
    if (!ticketText) {
      alert('Please paste ticket text details first!');
      return;
    }
    showLoader('Analyzing ticket and generating cognitive microtasks checklist...');
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ticketText,
          mode: modeSelect.value
        })
      });
      if (res.ok) {
        const tasks = await res.json();
        state.tasks = tasks.map((t: any) => ({ ...t, completed: false }));
        renderTasks();
        persistState();
      } else {
        const data = await res.json();
        alert(`Compilation failure: ${data.error}`);
      }
    } catch (err) {
      alert(`Query failed: ${(err as Error).message}`);
    } finally {
      hideLoader();
    }
  });

  // Context Checkpoint restoration
  checkpointBtn.addEventListener('click', async () => {
    showLoader('Scanning git workspaces and reconstructing last states...');
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const checkpoint = await res.json() as ContextCheckpoint;
        checkpointWorking.innerText = checkpoint.workingOn || 'General Development';
        checkpointState.innerText = checkpoint.lastState || 'Workspace is clean.';
        checkpointNext.innerText = checkpoint.nextStep || 'Review the open documentation.';
        
        state.suggestedCommand = checkpoint.suggestedCommand || 'npm run compile';
        checkpointCmd.innerText = state.suggestedCommand;

        // Render changed files chips
        checkpointFiles.innerHTML = '';
        if (checkpoint.changedFiles && checkpoint.changedFiles.length > 0) {
          checkpoint.changedFiles.forEach((file) => {
            const chip = document.createElement('span');
            chip.className = 'file-chip run-diff';
            chip.innerText = file;
            chip.setAttribute('data-file', file);
            checkpointFiles.appendChild(chip);
          });
          
          // Re-attach chip listener
          document.querySelectorAll('#checkpoint-files .run-diff').forEach((el) => {
            el.addEventListener('click', async (e) => {
              const file = (e.target as HTMLElement).getAttribute('data-file') || '';
              consoleOutputBox.style.display = 'block';
              consoleOutput.innerText = `Analyzing diff: ${file}...\n`;
              await runLocalCommand('git diff');
            });
          });
        } else {
          checkpointFiles.innerHTML = '<span style="font-style:italic; color:var(--text-muted);">No modified files.</span>';
        }

        checkpointDisplay.style.display = 'flex';
        checkpointDisplay.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert('Could not retrieve context checkpoints.');
      }
    } catch (err) {
      alert(`Status retrieve failed: ${(err as Error).message}`);
    } finally {
      hideLoader();
    }
  });

  suggestedCmdBox.addEventListener('click', () => {
    if (state.suggestedCommand) {
      runLocalCommand(state.suggestedCommand);
    }
  });

  // PR Feedback translation
  translateBtn.addEventListener('click', async () => {
    const feedbackText = prInput.value.trim();
    if (!feedbackText) {
      alert('Please paste a code review comment!');
      return;
    }
    showLoader('Deconstructing reviewer comment into plain steps...');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: feedbackText })
      });
      if (res.ok) {
        const trans = await res.json() as PRTranslation;
        prMeaning.innerText = trans.meaning;
        prAction.innerText = trans.action;
        prReply.innerText = trans.reply;
        prOutput.style.display = 'block';
        prOutput.scrollIntoView({ behavior: 'smooth' });
      } else {
        const data = await res.json();
        alert(`Translation error: ${data.error}`);
      }
    } catch (err) {
      alert(`Query failed: ${(err as Error).message}`);
    } finally {
      hideLoader();
    }
  });

  // Copy to clipboard helper
  copyReplyBadge.addEventListener('click', () => {
    const text = prReply.innerText;
    navigator.clipboard.writeText(text).then(() => {
      copyReplyBadge.innerText = 'Copied!';
      copyReplyBadge.style.background = 'var(--color-success)';
      setTimeout(() => {
        copyReplyBadge.innerText = 'Copy';
        copyReplyBadge.style.background = 'rgba(255, 255, 255, 0.08)';
      }, 2000);
    }).catch(() => {
      alert('Clipboard access denied.');
    });
  });
}

// Kick off logic initialization
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  init();
});

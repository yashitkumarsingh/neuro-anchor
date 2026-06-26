import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { LocalAi } from '@neuro-anchor/core';
import { colors, renderStatus, renderCompile, renderTranslate, renderShield } from '../renderer';

let rl: readline.Interface;

function getReadlineInterface() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rl;
}

const question = (query: string): Promise<string> => {
  const interfaceInstance = getReadlineInterface();
  return new Promise((resolve) => interfaceInstance.question(query, resolve));
};

export async function runInteractiveMenu() {
  console.log(`\n${colors.violet}${colors.bold}⚓ NEURO-ANCHOR CLI COMPANION${colors.reset}`);
  console.log('An ADHD-friendly interactive menu to reduce starting cognitive drag.');

  while (true) {
    console.log(`\n${colors.bold}--- MAIN MENU ---${colors.reset}`);
    console.log(`${colors.cyan}[1]${colors.reset} 🏠 Check Workspace Status ("What was I doing?")`);
    console.log(`${colors.cyan}[2]${colors.reset} ⚡ Compile Ticket details into Microtasks`);
    console.log(`${colors.cyan}[3]${colors.reset} 💬 Translate cryptic PR comment feedback`);
    console.log(`${colors.cyan}[4]${colors.reset} 🛡  Toggle Interruption Shield DND`);
    console.log(`${colors.cyan}[5]${colors.reset} ⚙  Configure Local AI settings (Ollama URL & Model)`);
    console.log(`${colors.cyan}[6]${colors.reset} ✕  Exit`);

    const choice = await question(`\nSelect option (1-6): `);
    const cleaned = choice.trim();

    if (cleaned === '1') {
      await handleInteractiveStatus();
    } else if (cleaned === '2') {
      await handleInteractiveCompile();
    } else if (cleaned === '3') {
      await handleInteractiveTranslate();
    } else if (cleaned === '4') {
      await handleInteractiveShield();
    } else if (cleaned === '5') {
      await handleInteractiveConfig();
    } else if (cleaned === '6' || cleaned.toLowerCase() === 'exit') {
      console.log(`\n${colors.green}Farewell developer! Keep anchor on your focus.${colors.reset}\n`);
      if (rl) {
        rl.close();
      }
      break;
    } else {
      console.log(`${colors.red}Invalid choice. Select from 1 to 6.${colors.reset}`);
    }
  }
}

// --- SUB HANDLERS ---

async function handleInteractiveStatus() {
  console.log(`\n${colors.gray}Scanning git revisions...${colors.reset}`);
  const gitDiff = await runCmd('git diff --stat');
  const gitStatus = await runCmd('git status --short');
  const changes = gitDiff || gitStatus || '';
  const changedFiles = changes.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const checkpoint = await LocalAi.generateContextCheckpoint(gitDiff, [], '');
  const rendered = renderStatus(checkpoint, changedFiles, 'text');
  console.log(rendered);
}

async function handleInteractiveCompile() {
  const ticketText = await question('\nPaste ticket title / details: ');
  if (!ticketText.trim()) {
    console.log(`${colors.red}Ticket cannot be empty.${colors.reset}`);
    return;
  }

  console.log('\nSelect granularity modes:');
  console.log('  1. 5m  - 5-Minute Mode (Micro checklist tasks)');
  console.log('  2. 15m - 15-Minute Mode (Logical action steps)');
  console.log('  3. deep - Deep Work Mode (Broad milestone levels)');
  console.log('  4. low  - Low Energy Mode (Very low cognitive effort)');
  
  const modeVal = await question('Select mode (1-4, defaults to 15m): ');
  let mode = '15-minute';
  if (modeVal.trim() === '1') mode = '5-minute';
  else if (modeVal.trim() === '3') mode = 'deep-work';
  else if (modeVal.trim() === '4') mode = 'low-energy';

  console.log(`\n${colors.gray}Analyzing ticket detail checks...${colors.reset}`);
  const tasks = await LocalAi.compileTicket(ticketText, mode);
  const rendered = renderCompile(tasks, mode, 'text');
  console.log(rendered);
}

async function handleInteractiveTranslate() {
  const feedback = await question('\nPaste reviewer feedback comment: ');
  if (!feedback.trim()) {
    console.log(`${colors.red}Feedback comment cannot be empty.${colors.reset}`);
    return;
  }

  console.log(`\n${colors.gray}Translating PR comment feedback details...${colors.reset}`);
  const trans = await LocalAi.translatePRFeedback(feedback);
  const rendered = renderTranslate(trans, 'text');
  console.log(rendered);
}

async function handleInteractiveShield() {
  const stateArg = await question('\nToggle shield state (on / off): ');
  const active = stateArg.trim().toLowerCase() === 'on';
  const rendered = renderShield(active, 'text');
  console.log(rendered);
}

async function handleInteractiveConfig() {
  console.log(`\n${colors.bold}--- Current Settings ---${colors.reset}`);
  console.log(`  Ollama Server URL:  ${colors.cyan}${LocalAi.config.url}${colors.reset}`);
  console.log(`  Ollama Model Name:  ${colors.cyan}${LocalAi.config.model}${colors.reset}`);

  const newUrl = await question(`\nEnter new Ollama URL [Press enter to keep current]: `);
  const newModel = await question(`Enter new Ollama Model name [Press enter to keep current]: `);

  const targetConfig = {
    url: newUrl.trim() || LocalAi.config.url,
    model: newModel.trim() || LocalAi.config.model
  };

  // Write config file to workspace root
  const configPath = path.join(process.cwd(), '.neuro-anchor.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(targetConfig, null, 2), 'utf-8');
    
    // Dynamically assign local values
    LocalAi.config.url = targetConfig.url;
    LocalAi.config.model = targetConfig.model;
    
    console.log(`\n${colors.green}✅ Configuration written to ${configPath} successfully!${colors.reset}`);
    console.log(`Applied new settings: ${targetConfig.model} @ ${targetConfig.url}\n`);
  } catch (err) {
    console.log(`${colors.red}Failed to write configuration: ${(err as Error).message}${colors.reset}`);
  }
}

// --- UTILS ---
function runCmd(command: string): Promise<string> {
  return new Promise((resolve) => {
    exec(command, (err, stdout) => {
      resolve(err ? '' : stdout.trim());
    });
  });
}

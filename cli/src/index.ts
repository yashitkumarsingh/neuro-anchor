#!/usr/bin/env node

import { exec } from 'child_process';
import { LocalAi } from '@neuro-anchor/core';

// ANSI coloring codes for premium terminal layout
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  violet: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bgGray: '\x1b[100m'
};

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'compile':
      await handleCompile();
      break;
    case 'translate':
      await handleTranslate();
      break;
    case 'shield':
      handleShield();
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

// Help Menu
function printHelp() {
  console.log(`
${colors.violet}${colors.bold}⚓ NEURO-ANCHOR CLI - Cognitive developer support layer${colors.reset}

${colors.bold}Usage:${colors.reset}
  neuro-anchor <command> [options]

${colors.bold}Commands:${colors.reset}
  ${colors.cyan}status${colors.reset}                   Check your current workspace context recovery state ("What was I doing?")
  ${colors.cyan}compile <ticket>${colors.reset}       Break down a ticket into actionable microtasks
  ${colors.cyan}translate <feedback>${colors.reset}   Translate cryptic or indirect PR comments into plain language
  ${colors.cyan}shield <on|off>${colors.reset}        Toggle or display status of the Interruption Shield

${colors.bold}Options for compile:${colors.reset}
  --mode <5m | 15m | deep | low>   Task breakdown grain (default: 15m)

${colors.bold}Examples:${colors.reset}
  neuro-anchor status
  neuro-anchor compile "Implement email webhook cancellation" --mode 5m
  neuro-anchor translate "Not sure if this is the right architecture..."
`);
}

// Handle Context Recovery Checkpoint
async function handleStatus() {
  console.log(`${colors.gray}Reading workspace state...${colors.reset}`);
  
  const gitDiff = await runCmd('git diff --stat');
  const gitStatus = await runCmd('git status --short');
  
  console.log(`\n${colors.violet}${colors.bold}=== Context Restore Point ===${colors.reset}\n`);
  
  const changes = gitDiff || gitStatus || 'No current local changes.';
  const changedFiles = changes.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log(`${colors.bold}Last Known State:${colors.reset}`);
  if (gitDiff) {
    console.log(`  ${colors.yellow}Modified Files:${colors.reset}`);
    changedFiles.forEach(file => console.log(`   - ${file}`));
  } else if (gitStatus) {
    console.log(`  ${colors.yellow}Staged/Untracked Files:${colors.reset}`);
    changedFiles.forEach(file => console.log(`   - ${file}`));
  } else {
    console.log(`  ${colors.gray}Workspace is clean.${colors.reset}`);
  }

  // Suggest next steps using core heuristics
  console.log(`\n${colors.bold}Suggested next step:${colors.reset}`);
  const checkpoint = LocalAi.heuristicContextCheckpoint(gitDiff, [], '');
  console.log(`  ${checkpoint.nextStep}`);
  console.log(`  Command: ${colors.cyan}${checkpoint.suggestedCommand}${colors.reset}`);
  console.log();
}

// Handle Ticket-to-Microtask compiler
async function handleCompile() {
  const ticketText = args[1];
  if (!ticketText) {
    console.error(`${colors.red}Error: Please specify the ticket text.${colors.reset}`);
    console.log('Example: neuro-anchor compile "Fix login validation check"');
    return;
  }

  let mode = '15-minute';
  const modeIdx = args.indexOf('--mode');
  if (modeIdx !== -1 && args[modeIdx + 1]) {
    const val = args[modeIdx + 1];
    if (val === '5m') mode = '5-minute';
    else if (val === '15m') mode = '15-minute';
    else if (val === 'deep') mode = 'deep-work';
    else if (val === 'low') mode = 'low-energy';
  }

  console.log(`${colors.gray}Compiling ticket in ${mode} mode using shared core...${colors.reset}`);

  // Query core LocalAi engine
  const tasks = await LocalAi.compileTicket(ticketText, mode);
  
  console.log(`\n${colors.violet}${colors.bold}=== Actionable Microtasks (${mode}) ===${colors.reset}\n`);
  tasks.forEach((t, i) => {
    console.log(`${colors.bold}[ ] Step ${i + 1}: ${t.title}${colors.reset}`);
    if (t.duration) console.log(`    ${colors.gray}Est: ${t.duration}${colors.reset}`);
    if (t.files && t.files.length > 0) console.log(`    ${colors.yellow}Files: ${t.files.join(', ')}${colors.reset}`);
    if (t.command) console.log(`    ${colors.cyan}Run: ${t.command}${colors.reset}`);
    if (t.verification) console.log(`    ${colors.gray}Verify: ${t.verification}${colors.reset}`);
    console.log();
  });
}

// Handle PR Feedback Translation
async function handleTranslate() {
  const feedback = args[1];
  if (!feedback) {
    console.error(`${colors.red}Error: Please specify the comment to translate.${colors.reset}`);
    return;
  }

  console.log(`${colors.gray}Translating feedback using shared core...${colors.reset}\n`);
  const result = await LocalAi.translatePRFeedback(feedback);

  console.log(`${colors.violet}${colors.bold}=== Feedback Translated ===${colors.reset}\n`);
  console.log(`${colors.bold}🔍 Likely Meaning:${colors.reset}`);
  console.log(`  ${result.meaning}\n`);
  console.log(`${colors.bold}🛠 Actionable Next Step:${colors.reset}`);
  console.log(`  ${result.action}\n`);
  console.log(`${colors.bold}💬 Suggested Reply:${colors.reset}`);
  console.log(`  ${colors.green}"${result.reply}"${colors.reset}\n`);
}

// Handle Interruption Shield DND simulation
function handleShield() {
  const stateArg = args[1];
  if (!stateArg) {
    console.log(`\n${colors.bold}Interruption Shield Status:${colors.reset}`);
    console.log(`  Current State: ${colors.gray}INACTIVE${colors.reset}`);
    console.log(`  To activate: ${colors.cyan}neuro-anchor shield on${colors.reset}\n`);
    return;
  }

  if (stateArg.toLowerCase() === 'on') {
    console.log(`\n${colors.bold}🛡  Interruption Shield: ${colors.green}ACTIVE${colors.reset}`);
    console.log(`${colors.gray}Do Not Disturb initiated. Buffering Slack/emails. Focus timer started for 25 mins.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bold}🛡  Interruption Shield: ${colors.red}DISABLED${colors.reset}`);
    console.log(`${colors.gray}Standard notification flow resumed.${colors.reset}\n`);
  }
}

// --- COMMAND EXECUTION RUNNERS ---

function runCmd(command: string): Promise<string> {
  return new Promise((resolve) => {
    exec(command, (err, stdout) => {
      resolve(err ? '' : stdout.trim());
    });
  });
}

main();

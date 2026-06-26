#!/usr/bin/env node

import { exec } from 'child_process';
import { LocalAi } from '@neuro-anchor/core';
import { colors, renderStatus, renderCompile, renderTranslate, renderShield } from './renderer';
import { runInteractiveMenu } from './commands/interactive';

const args = process.argv.slice(2);
const command = args[0];

// Parse format flag
const formatIdx = args.indexOf('--format');
let format = 'text';
if (formatIdx !== -1 && args[formatIdx + 1]) {
  format = args[formatIdx + 1].toLowerCase();
}

async function main() {
  // Default to interactive menu if no arguments are provided
  if (!command || command === 'interactive') {
    await runInteractiveMenu();
    return;
  }

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
  neuro-anchor [command] [options]

${colors.bold}Commands:${colors.reset}
  ${colors.cyan}interactive${colors.reset}              Launch the interactive helper menu (Default)
  ${colors.cyan}status${colors.reset}                   Check your current workspace context recovery state ("What was I doing?")
  ${colors.cyan}compile <ticket>${colors.reset}       Break down a ticket into actionable microtasks
  ${colors.cyan}translate <feedback>${colors.reset}   Translate cryptic or indirect PR comments into plain language
  ${colors.cyan}shield <on|off>${colors.reset}        Toggle or display status of the Interruption Shield

${colors.bold}Options for compile:${colors.reset}
  --mode <5m | 15m | deep | low>   Task breakdown grain (default: 15m)

${colors.bold}Global Options:${colors.reset}
  --format <text | json | markdown | md>   Output formatting style (default: text)

${colors.bold}Examples:${colors.reset}
  neuro-anchor
  neuro-anchor status --format markdown
  neuro-anchor compile "Implement email webhook cancellation" --mode 5m --format json
  neuro-anchor translate "Not sure if this is the right architecture..." --format md
`);
}

// Handle Context Recovery Checkpoint
async function handleStatus() {
  const gitDiff = await runCmd('git diff --stat');
  const gitStatus = await runCmd('git status --short');
  
  const changes = gitDiff || gitStatus || '';
  const checkpoint = await LocalAi.generateContextCheckpoint(gitDiff, [], '');

  const changedFiles = changes.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const rendered = renderStatus(checkpoint, changedFiles, format);
  console.log(rendered);
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

  if (format === 'text') {
    console.log(`${colors.gray}Compiling ticket in ${colors.reset}${colors.bold}${mode}${colors.reset}${colors.gray} mode using shared core...${colors.reset}`);
  }

  const tasks = await LocalAi.compileTicket(ticketText, mode);
  const rendered = renderCompile(tasks, mode, format);
  console.log(rendered);
}

// Handle PR Feedback Translation
async function handleTranslate() {
  const feedback = args[1];
  if (!feedback) {
    console.error(`${colors.red}Error: Please specify the comment to translate.${colors.reset}`);
    return;
  }

  if (format === 'text') {
    console.log(`${colors.gray}Translating feedback using shared core...${colors.reset}\n`);
  }

  const result = await LocalAi.translatePRFeedback(feedback);
  const rendered = renderTranslate(result, format);
  console.log(rendered);
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

  const active = stateArg.toLowerCase() === 'on';
  const rendered = renderShield(active, format);
  console.log(rendered);
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

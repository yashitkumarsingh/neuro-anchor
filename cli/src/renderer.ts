import { Microtask, PRTranslation, ContextRecoveryState } from '@neuro-anchor/core';

export const colors = {
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

/**
 * Render compiled microtasks
 */
export function renderCompile(tasks: Microtask[], mode: string, format: string): string {
  if (format === 'json') {
    return JSON.stringify(tasks, null, 2);
  }

  if (format === 'markdown' || format === 'md') {
    let output = `# Actionable Microtasks (${mode})\n\n`;
    tasks.forEach((t, i) => {
      output += `- [ ] **Step ${i + 1}: ${t.title}**\n`;
      if (t.duration) output += `  - **Estimated Duration**: ${t.duration}\n`;
      if (t.files && t.files.length > 0) {
        output += `  - **Target Files**: ${t.files.map(f => `\`${f}\``).join(', ')}\n`;
      }
      if (t.command) output += `  - **Run Command**: \`${t.command}\`\n`;
      if (t.verification) output += `  - **Verification**: ${t.verification}\n`;
    });
    return output;
  }

  // Colored text mode
  let output = `\n${colors.violet}${colors.bold}=== Actionable Microtasks (${mode}) ===${colors.reset}\n\n`;
  tasks.forEach((t, i) => {
    output += `${colors.bold}[ ] Step ${i + 1}: ${t.title}${colors.reset}\n`;
    if (t.duration) output += `    ${colors.gray}Est: ${t.duration}${colors.reset}\n`;
    if (t.files && t.files.length > 0) {
      output += `    ${colors.yellow}Files: ${t.files.join(', ')}${colors.reset}\n`;
    }
    if (t.command) output += `    ${colors.cyan}Run: ${t.command}${colors.reset}\n`;
    if (t.verification) output += `    ${colors.gray}Verify: ${t.verification}${colors.reset}\n`;
    output += '\n';
  });
  return output;
}

/**
 * Render PR comment translations
 */
export function renderTranslate(translation: PRTranslation, format: string): string {
  if (format === 'json') {
    return JSON.stringify(translation, null, 2);
  }

  if (format === 'markdown' || format === 'md') {
    return `# PR Feedback Translation

## 🔍 Likely Meaning
${translation.meaning}

## 🛠 Actionable Next Step
${translation.action}

## 💬 Suggested Polite Reply
> ${translation.reply}
`;
  }

  // Colored text mode
  return `
${colors.violet}${colors.bold}=== PR Feedback Translated ===${colors.reset}

${colors.bold}🔍 Likely Meaning:${colors.reset}
  ${translation.meaning}

${colors.bold}🛠 Actionable Next Step:${colors.reset}
  ${translation.action}

${colors.bold}💬 Suggested Reply:${colors.reset}
  ${colors.green}"${translation.reply}"${colors.reset}
`;
}

/**
 * Render Context Restoration Checkpoint status
 */
export function renderStatus(
  checkpoint: ContextRecoveryState,
  gitDiffFiles: string[],
  format: string
): string {
  if (format === 'json') {
    return JSON.stringify(checkpoint, null, 2);
  }

  if (format === 'markdown' || format === 'md') {
    const filesList = gitDiffFiles.length > 0
      ? gitDiffFiles.map(f => `- \`${f}\``).join('\n')
      : 'Workspace is clean.';

    return `# Context Restoration Point

## Last Known State
- **Working On**: ${checkpoint.workingOn}
- **State**: ${checkpoint.lastState}

### Changed Files
${filesList}

## Suggested Next Step
- **Action**: ${checkpoint.nextStep}
- **Suggested Command**: \`${checkpoint.suggestedCommand}\`
`;
  }

  // Colored text mode
  let output = `\n${colors.violet}${colors.bold}=== Context Restore Point ===${colors.reset}\n\n`;
  output += `${colors.bold}Last Known State:${colors.reset}\n`;
  
  if (gitDiffFiles.length > 0) {
    output += `  ${colors.yellow}Modified Files:${colors.reset}\n`;
    gitDiffFiles.forEach(file => {
      output += `   - ${file}\n`;
    });
  } else {
    output += `  ${colors.gray}Workspace is clean.${colors.reset}\n`;
  }

  output += `\n${colors.bold}Suggested next step:${colors.reset}\n`;
  output += `  ${checkpoint.nextStep}\n`;
  output += `  Command: ${colors.cyan}${checkpoint.suggestedCommand}${colors.reset}\n`;
  return output;
}

/**
 * Render Interruption Shield DND toggle
 */
export function renderShield(active: boolean, format: string): string {
  if (format === 'json') {
    return JSON.stringify({ active }, null, 2);
  }

  if (format === 'markdown' || format === 'md') {
    return `# Interruption Shield Status\n\n- **DND State**: ${active ? 'ACTIVE' : 'INACTIVE'}\n`;
  }

  if (active) {
    return `\n${colors.bold}🛡  Interruption Shield: ${colors.green}ACTIVE${colors.reset}\n` +
           `${colors.gray}Do Not Disturb initiated. Buffering Slack/emails. Focus timer started for 25 mins.${colors.reset}\n`;
  }

  return `\n${colors.bold}🛡  Interruption Shield: ${colors.red}DISABLED${colors.reset}\n` +
         `${colors.gray}Standard notification flow resumed.${colors.reset}\n`;
}

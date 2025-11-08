#!/usr/bin/env node

/**
 * BitLoot Quality Check Script
 * 
 * Runs comprehensive quality checks across the monorepo:
 * - Type checking (TypeScript)
 * - Linting (ESLint)
 * - Formatting (Prettier)
 * - Testing (Vitest)
 * - Building (NestJS + Next.js)
 * 
 * Usage:
 *   node scripts/quality-check.js          # Run all checks
 *   node scripts/quality-check.js [task]   # Run specific task
 * 
 * Available tasks:
 *   type-check, lint, format, test, build, all
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Utility functions
const log = {
  title: (text) => console.log(`\n${colors.bright}${colors.blue}━━━ ${text} ━━━${colors.reset}\n`),
  section: (text) => console.log(`${colors.bright}${colors.cyan}▶ ${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}✓${colors.reset} ${text}`),
  warning: (text) => console.log(`${colors.yellow}⚠${colors.reset} ${text}`),
  error: (text) => console.log(`${colors.red}✗${colors.reset} ${text}`),
  info: (text) => console.log(`${colors.dim}ℹ ${text}${colors.reset}`),
  divider: () => console.log(`${colors.dim}${'-'.repeat(80)}${colors.reset}`),
  newline: () => console.log(),
};

// Task definitions
const tasks = {
  'type-check': {
    name: 'Type Checking',
    command: 'npm run type-check',
    description: 'Verify TypeScript compilation across all workspaces',
  },
  'lint': {
    name: 'Linting',
    command: 'npm run lint',
    description: 'Check code quality with ESLint',
  },
  'format': {
    name: 'Format Verification',
    command: 'npm run format',
    description: 'Verify code formatting with Prettier',
  },
  'test': {
    name: 'Testing',
    command: 'npm run test',
    description: 'Run all unit tests',
  },
  'build': {
    name: 'Building',
    command: 'npm run build',
    description: 'Build all workspaces (API + Web)',
  },
};

// Task execution function
function executeTask(taskKey, taskConfig) {
  return new Promise((resolve) => {
    log.section(`${taskConfig.name}`);
    log.info(taskConfig.description);
    
    const startTime = Date.now();
    
    try {
      const output = execSync(taskConfig.command, {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe',
        encoding: 'utf-8',
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      log.success(`${taskConfig.name} passed in ${duration}s`);
      
      // Show last few lines of output if verbose
      if (process.env.VERBOSE) {
        log.newline();
        const lines = output.trim().split('\n').slice(-5);
        lines.forEach(line => log.info(line));
      }
      
      log.newline();
      resolve({ success: true, task: taskKey, duration });
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      log.error(`${taskConfig.name} failed after ${duration}s`);
      log.newline();
      
      if (error.stdout) {
        const lines = error.stdout.toString().split('\n').slice(-10);
        lines.forEach(line => {
          if (line.trim()) log.info(line);
        });
      }
      
      log.newline();
      resolve({ success: false, task: taskKey, duration, error: error.message });
    }
  });
}

// Summary function
function printSummary(results) {
  log.divider();
  log.title('Quality Check Summary');
  
  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log.section('Results');
  results.forEach((result) => {
    const status = result.success
      ? `${colors.green}✓ PASS${colors.reset}`
      : `${colors.red}✗ FAIL${colors.reset}`;
    const taskName = tasks[result.task].name;
    console.log(`  ${status}  ${taskName.padEnd(25)} (${result.duration}s)`);
  });
  
  log.newline();
  log.section('Summary');
  console.log(`  ${colors.green}Passed:${colors.reset} ${passed.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`  ${colors.red}Failed:${colors.reset} ${failed.length}/${results.length}`);
  }
  
  const totalDuration = results.reduce((sum, r) => sum + parseFloat(r.duration), 0).toFixed(2);
  console.log(`  ${colors.cyan}Total Time:${colors.reset} ${totalDuration}s`);
  
  log.newline();
  
  if (failed.length === 0) {
    log.success('All quality checks passed! 🎉');
  } else {
    log.error(`${failed.length} check(s) failed. Please review the output above.`);
  }
  
  log.divider();
  log.newline();
  
  return failed.length === 0;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  let selectedTasks = [];
  const flags = args.filter(arg => arg.startsWith('--'));
  const taskArgs = args.filter(arg => !arg.startsWith('--'));
  
  // Determine which tasks to run
  if (taskArgs.length === 0) {
    selectedTasks = Object.keys(tasks).filter(k => k !== 'all');
  } else {
    taskArgs.forEach(arg => {
      if (arg === 'all') {
        selectedTasks = Object.keys(tasks).filter(k => k !== 'all');
      } else if (tasks[arg]) {
        selectedTasks.push(arg);
      } else {
        log.error(`Unknown task: ${arg}`);
        process.exit(1);
      }
    });
  }
  
  // Remove duplicates while preserving order
  selectedTasks = [...new Set(selectedTasks)];
  
  // Print header
  log.title('BitLoot Quality Check');
  log.section('Configuration');
  console.log(`  ${colors.cyan}Project:${colors.reset} BitLoot`);
  console.log(`  ${colors.cyan}Workspace:${colors.reset} ${path.resolve(__dirname, '..')}`);
  console.log(`  ${colors.cyan}Tasks:${colors.reset} ${selectedTasks.map(t => tasks[t].name).join(', ')}`);
  
  if (process.env.VERBOSE) {
    log.info('Verbose mode enabled (VERBOSE=1)');
  }
  
  log.newline();
  log.divider();
  
  // Execute tasks sequentially
  const results = [];
  for (const taskKey of selectedTasks) {
    const result = await executeTask(taskKey, tasks[taskKey]);
    results.push(result);
    
    // Stop on first failure (optional, can be changed with --continue flag)
    if (!result.success && !flags.includes('--continue')) {
      log.warning('Stopping execution due to failure (use --continue flag to continue)');
      results.forEach(r => {
        if (!selectedTasks.includes(r.task)) {
          results.push({ success: null, task: r.task, duration: 0, skipped: true });
        }
      });
      break;
    }
  }
  
  // Print summary
  const allPassed = printSummary(results);
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run the script
main().catch((error) => {
  log.error('Unexpected error:', error.message);
  process.exit(1);
});

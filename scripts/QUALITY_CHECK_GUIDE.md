# 🎯 BitLoot Quality Check Script — Complete Guide

## Overview

A unified, beautifully-formatted quality check system for BitLoot that runs TypeScript, ESLint, Prettier, Vitest, and build tasks with centralized npm scripts and a custom Node.js orchestrator.

---

## 🚀 Quick Start

```bash
# Run ALL quality checks (type-check, lint, format, test, build)
npm run quality

# Run all checks and continue even if one fails
npm run quality all --continue

# Run individual checks only
npm run quality:type-check
npm run quality:lint
npm run quality:format
npm run quality:test
npm run quality:build

# Full check (all tasks, stops on first failure)
npm run quality:full
```

---

## 📂 File Structure

```
scripts/
├─ quality-check.js          # Main Node.js orchestrator (beautiful output)
└─ quality-check.sh          # Bash wrapper (Linux/Mac)

Root package.json scripts:
├─ quality                   # npm run quality (all checks, stop on failure)
├─ quality all --continue    # npm run quality all --continue (all checks, continue on failure)
├─ quality:type-check        # npm run quality:type-check (TypeScript only)
├─ quality:lint              # npm run quality:lint (ESLint only)
├─ quality:format            # npm run quality:format (Prettier check only)
├─ quality:test              # npm run quality:test (Vitest only)
├─ quality:build             # npm run quality:build (Build only)
└─ quality:full              # npm run quality:full (all tasks, continue on failure)
```

---

## 💡 Features

### 1. **Beautiful Output with Colors**

```
━━━ BitLoot Quality Check ━━━

▶ Configuration
  Project: BitLoot
  Workspace: C:\Users\beast\bitloot
  Tasks: Type Checking, Linting, Format Verification, Testing, Building

────────────────────────────────────────────────────────────────────────────────
▶ Type Checking
ℹ Verify TypeScript compilation across all workspaces
✓ Type Checking passed in 2.62s

▶ Linting
ℹ Check code quality with ESLint
✓ Linting passed in 8.53s
...
```

### 2. **Individual Task Selection**

Run only specific quality checks without running all:

```bash
npm run quality:type-check    # Only TypeScript
npm run quality:lint          # Only ESLint
npm run quality:format        # Only Prettier
```

### 3. **Smart Error Handling**

- Stops on first failure (default) to save time
- `--continue` flag runs all tasks even if some fail
- Clear error output with last lines of failure logs

### 4. **Performance Timing**

Displays duration for each task and total time:

```
▶ Results
  ✓ PASS  Type Checking             (2.62s)
  ✓ PASS  Linting                   (8.53s)
  ✓ PASS  Format Verification       (3.72s)
  ✓ PASS  Testing                   (4.87s)
  ✓ PASS  Building                  (18.97s)

▶ Summary
  Passed: 5/5
  Total Time: 38.71s
```

### 5. **Comprehensive Summary**

Each run generates a detailed summary showing:

- ✅/❌ Pass/fail status for each task
- Time taken per task
- Total duration
- Success/failure counts

---

## 📋 Available Commands

### All-in-One Quality Check (Recommended)

```bash
# Run all checks (stop on first failure)
npm run quality

# Run all checks (continue even if one fails)
npm run quality all --continue

# Run all checks (continue mode)
npm run quality:full
```

### Individual Quality Checks

```bash
# Type checking (strict mode, no 'any')
npm run quality:type-check

# Linting (ESLint)
npm run quality:lint

# Format verification (Prettier)
npm run quality:format

# Testing (Vitest)
npm run quality:test

# Build (NestJS + Next.js)
npm run quality:build
```

### Traditional Commands (Still Available)

```bash
npm run type-check           # TypeScript compilation
npm run lint                 # ESLint check
npm run lint:fix             # Auto-fix lint issues
npm run format               # Prettier check
npm run format:fix           # Auto-format code
npm run test                 # Run tests
npm run build                # Build all
```

---

## 🔧 Script Configuration

### Root `package.json` Scripts

```json
{
  "scripts": {
    "quality": "node scripts/quality-check.js",
    "quality:type-check": "node scripts/quality-check.js type-check",
    "quality:lint": "node scripts/quality-check.js lint",
    "quality:format": "node scripts/quality-check.js format",
    "quality:test": "node scripts/quality-check.js test",
    "quality:build": "node scripts/quality-check.js build",
    "quality:full": "node scripts/quality-check.js all --continue"
  }
}
```

### Task Definitions (in `scripts/quality-check.js`)

Each task is defined with:

- **name**: Display name
- **command**: npm script to run
- **description**: What the task does

```javascript
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
  // ...
};
```

---

## 🎨 Color Scheme

The script uses ANSI color codes for beautiful terminal output:

- 🔵 **Blue** — Section headers
- 🟢 **Green** — Success/checkmarks
- 🔴 **Red** — Errors/failures
- 🟡 **Yellow** — Warnings
- 🔵 **Cyan** — Configuration info
- ⚪ **Dim** — Informational text

---

## 📊 Exit Codes

- **0** — All checks passed ✅
- **1** — One or more checks failed ❌

Useful for CI/CD pipelines to determine success/failure.

---

## 🔄 CI/CD Integration

Use in GitHub Actions or other CI systems:

```yaml
# .github/workflows/ci.yml
- name: Run Quality Checks
  run: npm run quality all --continue
```

The `--continue` flag ensures all checks run even if one fails, giving complete visibility into all issues.

---

## 🛠️ Customization

### Add a New Task

Edit `scripts/quality-check.js`:

```javascript
const tasks = {
  'new-task': {
    name: 'My New Task',
    command: 'npm run my:task',
    description: 'What this task does',
  },
  // ... existing tasks
};
```

Then add to `package.json`:

```json
{
  "scripts": {
    "quality:my-task": "node scripts/quality-check.js new-task"
  }
}
```

### Modify Task Order

Reorder tasks in the `selectedTasks` array within the main execution section.

### Change Colors

Edit color constants at top of `scripts/quality-check.js`:

```javascript
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  // ... etc
};
```

---

## 📖 Documentation

### In `.github/copilot-instructions.md`

See **Section 10: Verification Commands** for:
- Development server commands
- Unified quality check usage
- Individual check commands
- Traditional command reference

### In `README.md`

See **Quality & Build** section for:
- Unified quality check commands
- Individual check commands
- Code quality gates

---

## ✨ Example Usage

### Scenario 1: Run All Checks Before Committing

```bash
npm run quality
```

Output:
```
✓ All quality checks passed! 🎉
```

### Scenario 2: Debug a Specific Issue

```bash
npm run quality:type-check    # Check if TypeScript errors
npm run quality:lint          # Check for lint issues
npm run quality:format        # Check formatting
```

### Scenario 3: CI/CD Pipeline Check All Issues

```bash
npm run quality all --continue
```

Shows all failures (even if one task fails), useful for seeing everything that needs fixing.

---

## 🎯 Best Practices

1. **Before Committing**
   ```bash
   npm run quality
   ```
   Ensures all changes pass quality gates.

2. **During Development**
   ```bash
   npm run lint:fix && npm run format:fix && npm run quality
   ```
   Auto-fix common issues, then verify.

3. **In CI/CD**
   ```bash
   npm run quality all --continue
   ```
   Shows all issues in one run.

4. **For PR Reviews**
   ```bash
   npm run quality
   ```
   Gate PRs on passing all checks.

---

## 🐛 Troubleshooting

### Q: Script not found error
**A:** Ensure Node.js 20+ is installed and `npm install` has been run.

### Q: Slow on first run
**A:** Normal. First run: installs dependencies, caches results. Subsequent runs are faster.

### Q: ENOENT: no such file or directory 'scripts/quality-check.js'
**A:** Run from repository root: `cd bitloot && npm run quality`

### Q: Want to see more verbose output
**A:** Set environment variable:
```bash
VERBOSE=1 npm run quality
```

---

## 📝 Summary

| Command | Purpose | Behavior |
| --- | --- | --- |
| `npm run quality` | All checks | Stops on first failure |
| `npm run quality all --continue` | All checks | Continues on failure |
| `npm run quality:full` | All checks | Continues on failure (alias) |
| `npm run quality:type-check` | TypeScript only | Fast type checking |
| `npm run quality:lint` | ESLint only | Code quality |
| `npm run quality:format` | Prettier only | Formatting check |
| `npm run quality:test` | Tests only | Unit tests |
| `npm run quality:build` | Build only | Compilation check |

---

## 🎉 That's It!

Your BitLoot project now has a professional, beautiful quality check system. Use `npm run quality` before every commit!

**Questions?** Check `.github/copilot-instructions.md` or `README.md` for more details.

#!/usr/bin/env node

const { execSync } = require("child_process");
const readline = require("readline");
const chalk = require("chalk");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SENSITIVE_PATTERNS = [
  /(?<=\bsecret\b\s*=\s*)['"][^'"]+['"]/gi,
  /(?<=\bpassword\b\s*=\s*)['"][^'"]+['"]/gi,
  /(?<=\btoken\b\s*=\s*)['"][^'"]+['"]/gi,
  /(?<=\bapi[_-]?key\b\s*=\s*)['"][^'"]+['"]/gi,
  /\b[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /sk_live_[0-9a-zA-Z]{24}/,
];

async function askQuestion(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

function getStagedFiles() {
  try {
    const files = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);

    if (!files.length) {
      console.log(chalk.green("🔍 No files staged."));
      process.exit(0);
    }

    console.log(chalk.blue("🔍 Staged files:"), files);
    return files;
  } catch (err) {
    console.error(chalk.red("❌ Error fetching staged files."));
    process.exit(1);
  }
}

async function checkFileContent(file, files) {
  try {
    const content = execSync(`git show :${file}`, { encoding: "utf8" });

    for (const pattern of SENSITIVE_PATTERNS) {
      const matches = content.match(pattern);

      if (matches) {
        for (const match of matches) {
          console.clear();
          console.log(chalk.blue("🔍 Staged files:"), files);
          console.log(`\n📂 ${chalk.cyan("Reading file:")} ${file}\n`);
          console.log(
            chalk.red(
              `🚨 [ALERT] Possible secret in: ${chalk.yellow(`${file}`)}`,
            ),
          );
          console.log(
            `🔎 Suspicious snippet: ${chalk.bgRed.white(` ${match} `)}\n`,
          );

          const answer = await askQuestion(
            chalk.yellow("⚠️  Is this a secret? (y/N): "),
          );

          if (answer.toLowerCase() === "y") {
            console.error(chalk.white("\n❌ Commit blocked!"));
            return true;
          }
        }
      }
    }
  } catch (err) {
    console.error(chalk.red(`❌ Error reading ${file}:`), err.message);
  }
  return false;
}

async function runSecretCheck() {
  try {
    const files = getStagedFiles();
    let hasSecret = false;

    for (const file of files) {
      if (
        file.startsWith(".husky/") ||
        !file.match(/\.(js|ts|env|json|yaml|yml|md)$/)
      )
        continue;

      console.log(chalk.cyan(`📂 Reading file: ${file}`));

      if (await checkFileContent(file, files)) {
        hasSecret = true;
        break;
      }
    }

    rl.close();
    if (hasSecret) process.exit(1);

    console.clear();
    console.log(chalk.green("✅ No secrets confirmed. Commit allowed."));
    process.exit(0);
  } catch (err) {
    console.error(chalk.red("❌ Error during verification:"), err.message);
    process.exit(1);
  }
}

runSecretCheck();

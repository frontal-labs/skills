#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');
const { glob } = require('glob');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const INSTALL_DIR = path.join(__dirname, '..', '..', '.skills');

async function installSkills() {
  console.log(chalk.blue('Installing Frontal Agent Skills...\n'));

  try {
    // Create install directory if it doesn't exist
    if (!fs.existsSync(INSTALL_DIR)) {
      fs.mkdirSync(INSTALL_DIR, { recursive: true });
      console.log(chalk.green(`Created install directory: ${INSTALL_DIR}`));
    }

    const skillDirs = await glob('*', { cwd: SKILLS_DIR, onlyDirectories: true });

    if (skillDirs.length === 0) {
      console.log(chalk.yellow(' No skills found to install'));
      return;
    }

    let installedCount = 0;

    for (const skillDir of skillDirs) {
      const sourcePath = path.join(SKILLS_DIR, skillDir);
      const targetPath = path.join(INSTALL_DIR, skillDir);

      // Remove existing skill directory
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }

      // Copy skill directory
      fs.cpSync(sourcePath, targetPath, { recursive: true });

      console.log(chalk.green(`Installed: ${skillDir}`));
      installedCount++;
    }

    console.log(chalk.blue(`\nInstallation complete!`));
    console.log(`Installed ${installedCount} skills to: ${INSTALL_DIR}`);

  } catch (error) {
    console.error(chalk.red('Error installing skills:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  installSkills();
}

module.exports = { installSkills };

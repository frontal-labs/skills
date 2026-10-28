#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');
const chalk = require('chalk');
const { glob } = require('glob');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

function getSkillInfo(skillPath) {
  const skillFile = path.join(skillPath, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    return null;
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return null;
  }

  try {
    const frontmatter = yaml.parse(frontmatterMatch[1]);
    return {
      name: frontmatter.name,
      description: frontmatter.description,
      category: frontmatter.metadata?.category || 'uncategorized',
      version: frontmatter.metadata?.version || '1.0.0',
      path: skillFile
    };
  } catch (error) {
    return null;
  }
}

async function listSkills() {
  console.log(chalk.blue('Frontal Agent Skills\n'));

  try {
    const skillDirs = await glob('*', { cwd: SKILLS_DIR, onlyDirectories: true });

    if (skillDirs.length === 0) {
      console.log(chalk.yellow(' No skills found'));
      return;
    }

    const skills = [];

    for (const skillDir of skillDirs) {
      const skillPath = path.join(SKILLS_DIR, skillDir);
      const skillInfo = getSkillInfo(skillPath);

      if (skillInfo) {
        skills.push(skillInfo);
      }
    }

    // Group by category
    const categories = {};
    skills.forEach(skill => {
      if (!categories[skill.category]) {
        categories[skill.category] = [];
      }
      categories[skill.category].push(skill);
    });

    // Display skills by category
    Object.keys(categories).sort().forEach(category => {
      console.log(chalk.cyan(`\n${category.toUpperCase()}`));
      console.log(chalk.gray('─'.repeat(50)));

      categories[category].forEach(skill => {
        console.log(chalk.green(`  ${skill.name}`));
        console.log(chalk.gray(`     ${skill.description}`));
        console.log(chalk.gray(`     Version: ${skill.version}`));
        console.log(chalk.gray(`     Path: ${skill.path}`));
        console.log();
      });
    });

    // Summary
    console.log(chalk.blue(`\nSummary:`));
    console.log(`Total skills: ${skills.length}`);
    console.log(`Categories: ${Object.keys(categories).length}`);

    // Categories list
    console.log(chalk.blue(`\n Categories:`));
    Object.keys(categories).sort().forEach(category => {
      console.log(`  ${category}: ${categories[category].length} skills`);
    });

  } catch (error) {
    console.error(chalk.red('Error listing skills:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  listSkills();
}

module.exports = { listSkills, getSkillInfo };

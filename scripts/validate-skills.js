#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');
const chalk = require('chalk');
const { glob } = require('glob');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

function validateSkillName(name) {
  // Must be 1-64 characters
  if (name.length < 1 || name.length > 64) {
    return false;
  }
  
  // May only contain unicode lowercase alphanumeric characters (a-z) and hyphens (-)
  if (!/^[a-z-]+$/.test(name)) {
    return false;
  }
  
  // Must not start or end with a hyphen (-)
  if (name.startsWith('-') || name.endsWith('-')) {
    return false;
  }
  
  // Must not contain consecutive hyphens (--)
  if (name.includes('--')) {
    return false;
  }
  
  return true;
}

function validateFrontmatter(content, filePath) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { valid: false, errors: ['Missing frontmatter'] };
  }
  
  try {
    const frontmatter = yaml.parse(frontmatterMatch[1]);
    const errors = [];
    
    // Required fields
    if (!frontmatter.name) {
      errors.push('Missing required field: name');
    }
    
    if (!frontmatter.description) {
      errors.push('Missing required field: description');
    }
    
    // Validate name field
    if (frontmatter.name && !validateSkillName(frontmatter.name)) {
      errors.push('Invalid name format');
    }
    
    // Validate description length
    if (frontmatter.description && frontmatter.description.length > 1024) {
      errors.push('Description too long (max 1024 characters)');
    }
    
    // Validate license if present
    if (frontmatter.license && frontmatter.license.length > 100) {
      errors.push('License too long (max 100 characters)');
    }
    
    // Validate compatibility if present
    if (frontmatter.compatibility && frontmatter.compatibility.length > 500) {
      errors.push('Compatibility too long (max 500 characters)');
    }
    
    return { valid: errors.length === 0, errors };
  } catch (error) {
    return { valid: false, errors: ['Invalid YAML frontmatter'] };
  }
}

function validateSkillStructure(skillPath) {
  const skillDir = path.basename(skillPath);
  const skillFile = path.join(skillPath, 'SKILL.md');
  
  const errors = [];
  
  // Check if SKILL.md exists
  if (!fs.existsSync(skillFile)) {
    errors.push('Missing SKILL.md file');
    return { valid: false, errors };
  }
  
  // Validate skill name against directory name
  const content = fs.readFileSync(skillFile, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    try {
      const frontmatter = yaml.parse(frontmatterMatch[1]);
      if (frontmatter.name !== skillDir) {
        errors.push(`Skill name '${frontmatter.name}' does not match directory name '${skillDir}'`);
      }
    } catch (error) {
      errors.push('Invalid YAML frontmatter');
    }
  }
  
  // Validate frontmatter
  const frontmatterValidation = validateFrontmatter(content, skillFile);
  if (!frontmatterValidation.valid) {
    errors.push(...frontmatterValidation.errors);
  }
  
  return { valid: errors.length === 0, errors };
}

async function validateAllSkills() {
  console.log(chalk.blue('Validating Frontal Agent Skills...\n'));
  
  try {
    const skillDirs = await glob('*', { cwd: SKILLS_DIR, onlyDirectories: true });
    
    if (skillDirs.length === 0) {
      console.log(chalk.yellow('No skill directories found'));
      return;
    }
    
    let totalSkills = 0;
    let validSkills = 0;
    const allErrors = [];
    
    for (const skillDir of skillDirs) {
      totalSkills++;
      const skillPath = path.join(SKILLS_DIR, skillDir);
      const validation = validateSkillStructure(skillPath);
      
      if (validation.valid) {
        console.log(chalk.green(`OK ${skillDir}`));
        validSkills++;
      } else {
        console.log(chalk.red(`FAIL ${skillDir}`));
        validation.errors.forEach(error => {
          console.log(chalk.red(`   - ${error}`));
        });
        allErrors.push({ skill: skillDir, errors: validation.errors });
      }
    }
    
    console.log('\n' + chalk.blue('Summary:'));
    console.log(`Total skills: ${totalSkills}`);
    console.log(`Valid skills: ${chalk.green(validSkills)}`);
    console.log(`Invalid skills: ${chalk.red(totalSkills - validSkills)}`);
    
    if (allErrors.length > 0) {
      console.log('\n' + chalk.red('Validation Errors:'));
      allErrors.forEach(({ skill, errors }) => {
        console.log(chalk.red(`\n${skill}:`));
        errors.forEach(error => {
          console.log(chalk.red(`  - ${error}`));
        });
      });
      process.exit(1);
    } else {
      console.log(chalk.green('\nAll skills are valid!'));
    }
    
  } catch (error) {
    console.error(chalk.red('Error during validation:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  validateAllSkills();
}

module.exports = { validateSkillStructure, validateAllSkills };

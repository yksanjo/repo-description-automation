#!/usr/bin/env node

/**
 * Repo Description Automation
 * Auto-generate and update repository descriptions
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const fs = require('fs');

// Description patterns based on repo name keywords
const patterns = {
  // Data Collection
  'scraper': 'Web scraping tool for extracting data from various sources',
  'crawler': 'Automated web crawler for data collection',
  'collector': 'Data collection and aggregation tool',
  'tracker': 'Real-time tracking and monitoring tool',
  
  // Infrastructure & DevOps
  'monitor': 'Monitoring dashboard for system metrics and alerts',
  'cli': 'Command-line tool for terminal productivity',
  'server': 'Backend server with Node.js/Express',
  
  // Web & Frontend
  'api': 'REST API service with Express/Node.js',
  'dashboard': 'Web dashboard built with React and modern UI',
  'web': 'Web application built with modern frameworks',
  'mobile': 'Mobile app for iOS/Android',
  'vscode': 'VS Code extension for enhanced productivity',
  
  // AI & Agents
  'mcp': 'Model Context Protocol server for AI agents',
  'agent': 'AI agent framework with autonomous capabilities',
  'ai': 'AI-powered tool with machine learning',
  'llm': 'Large Language Model integration and utilities',
  
  // Security
  'security': 'Security scanning and vulnerability detection',
  'audit': 'Audit logging and trail analysis',
  'detector': 'Detection system using AI/ML algorithms',
  
  // Development Tools
  'generator': 'Code/data generation tool with templates',
  'analyzer': 'Analysis tool for code, data, or metrics',
  'manager': 'Management system for handling resources',
  'client': 'Client library or SDK for API integration',
  
  // Business & Enterprise
  'workflow': 'Workflow automation and orchestration',
  'compliance': 'Compliance monitoring and reporting',
  'stripe': 'Stripe payment integration and management',
  'sap': 'SAP system integration and tools',
  
  // Specialized
  'quantum': 'Quantum computing simulation and tools',
  'integrator': 'Integration layer for connecting systems',
  'orchestrator': 'Orchestration engine for complex workflows',
  'hub': 'Central hub for connecting services',
  'gateway': 'API gateway for traffic management',
  'bridge': 'Bridge for connecting different systems',
  'framework': 'Framework for building applications',
  'platform': 'Platform for building and deploying solutions',
  'studio': 'Studio environment for development',
  'lite': 'Lightweight version of the application',
  
  // Data Intelligence
  'intelligence': 'Intelligence and analytics platform',
  'analytics': 'Analytics and data visualization',
  'visualizer': 'Data visualization and exploration tool',
  'knowledge': 'Knowledge management and retrieval',
  
  // Infrastructure
  'cloud': 'Cloud infrastructure and deployment',
  'infrastructure': 'Infrastructure management tools',
  'deploy': 'Deployment automation and tooling',
  
  // Misc
  'project': 'Development project and codebase',
  'toolkit': 'Collection of development tools',
  'suite': 'Comprehensive tool suite',
  'launchpad': 'Quick start deployment platform',
  'bot': 'Bot and automation agent',
  'widget': 'Widget and UI component',
  'template': 'Template and scaffold generator',
};

function generateDescription(repoName) {
  const name = repoName.toLowerCase();
  
  // First check for exact keyword matches
  for (const [keyword, desc] of Object.entries(patterns)) {
    if (name.includes(keyword)) return desc;
  }
  
  // Then check individual words
  const words = name.split(/[-_]/);
  for (const word of words) {
    if (patterns[word]) return patterns[word];
  }
  
  return null;
}

async function getRepos(username) {
  const repos = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const cursorArg = cursor ? `, after: "${cursor}"` : '';
    const query = `{
      user(login: "${username}") {
        repositories(first: 100${cursorArg}, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            description
            url
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }`;

    try {
      const result = JSON.parse(
        execSync(`gh api graphql -f query='${query}'`, { encoding: 'utf8' })
      );
      const { nodes, pageInfo } = result.data.user.repositories;
      repos.push(...nodes);
      hasNextPage = pageInfo.hasNextPage;
      cursor = pageInfo.endCursor;
    } catch (e) {
      break;
    }
  }
  return repos;
}

async function updateDescriptions() {
  console.log(chalk.blue('\n📝 Updating repository descriptions...\n'));
  
  const username = 'yksanjo';
  const repos = await getRepos(username);
  
  const missing = repos.filter(r => !r.description);
  console.log(chalk.yellow(`Found ${missing.length} repos without descriptions\n`));
  
  let updated = 0;
  let skipped = 0;
  
  for (const repo of missing) {
    const desc = generateDescription(repo.name);
    if (desc) {
      try {
        execSync(`gh repo edit ${username}/${repo.name} --description "${desc}"`, {
          encoding: 'utf8'
        });
        console.log(chalk.green(`✓ ${repo.name}: ${desc}`));
        updated++;
      } catch (e) {
        console.log(chalk.red(`✗ Failed: ${repo.name}`));
      }
    } else {
      console.log(chalk.yellow(`⚠ No pattern: ${repo.name}`));
      skipped++;
    }
  }
  
  console.log(chalk.green(`\n✅ Updated: ${updated} | Skipped: ${skipped}`));
}

async function listMissing() {
  console.log(chalk.blue('\n🔍 Finding repos without descriptions...\n'));
  
  const username = 'yksanjo';
  const repos = await getRepos(username);
  
  const missing = repos.filter(r => !r.description);
  
  if (missing.length === 0) {
    console.log(chalk.green('✅ All repositories have descriptions!'));
  } else {
    console.log(chalk.yellow(`Found ${missing.length} repos:\n`));
    missing.forEach(r => {
      const suggested = generateDescription(r.name) || 'No suggestion';
      console.log(`  ${r.name} → ${chalk.gray(suggested)}`);
    });
  }
}

async function previewDescriptions() {
  console.log(chalk.blue('\n👀 Preview descriptions for all repos...\n'));
  
  const username = 'yksanjo';
  const repos = await getRepos(username);
  
  repos.forEach(repo => {
    const current = repo.description || chalk.gray('(none)');
    const suggested = generateDescription(repo.name);
    console.log(`${chalk.cyan(repo.name)}:`);
    console.log(`  Current: ${current}`);
    console.log(`  Suggested: ${chalk.green(suggested || 'N/A')}\n`);
  });
}

async function main() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     📝 Repo Description Automation v1.0.0                   ║
║                                                               ║
║     Auto-generate repository descriptions                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select action:',
      choices: [
        'Update All Missing Descriptions',
        'List Repos Without Descriptions',
        'Preview All Descriptions',
        'Exit'
      ]
    }
  ]);

  switch (action) {
    case 'Update All Missing Descriptions':
      await updateDescriptions();
      break;
    case 'List Repos Without Descriptions':
      await listMissing();
      break;
    case 'Preview All Descriptions':
      await previewDescriptions();
      break;
    case 'Exit':
      console.log(chalk.yellow('Goodbye! 👋'));
      process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateDescription, updateDescriptions };
